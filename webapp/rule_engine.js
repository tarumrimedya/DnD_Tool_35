/**
 * D&D 3.5e Declarative Rule, Modifier & Stacking Engine
 * Handles ability modifiers, RAW stacking rules, dynamic feat mechanics,
 * 14 body slot equipment bonuses, active buffs with round countdowns,
 * Armor Class evaluation (Normal, Touch, Flat-Footed), and saving throws.
 */

if (typeof SrdCompendium === 'undefined' && typeof require === 'function') {
  try { require('./srd_compendium.js'); } catch (_) {}
}

const RuleEngine = {
  // Built-in SRD Armor reference catalog
  SRD_ARMORS: {
    'padded': { armor: 1, maxDex: 8, acp: 0, type: 'Light' },
    'leather': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'leather armor': { armor: 2, maxDex: 6, acp: 0, type: 'Light' },
    'studded leather': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'studded leather armor': { armor: 3, maxDex: 5, acp: -1, type: 'Light' },
    'chain shirt': { armor: 4, maxDex: 4, acp: -2, type: 'Light' },
    'hide': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'hide armor': { armor: 3, maxDex: 4, acp: -3, type: 'Medium' },
    'scale mail': { armor: 4, maxDex: 3, acp: -4, type: 'Medium' },
    'chainmail': { armor: 5, maxDex: 2, acp: -5, type: 'Medium' },
    'breastplate': { armor: 5, maxDex: 3, acp: -4, type: 'Medium' },
    'splint mail': { armor: 6, maxDex: 0, acp: -7, type: 'Heavy' },
    'banded mail': { armor: 6, maxDex: 1, acp: -6, type: 'Heavy' },
    'half-plate': { armor: 7, maxDex: 0, acp: -7, type: 'Heavy' },
    'full plate': { armor: 8, maxDex: 1, acp: -6, type: 'Heavy' }
  },

  // Built-in SRD Shield reference catalog
  SRD_SHIELDS: {
    'buckler': { shield: 1, maxDex: null, acp: -1 },
    'light wooden shield': { shield: 1, maxDex: null, acp: -1 },
    'light steel shield': { shield: 1, maxDex: null, acp: -1 },
    'light shield': { shield: 1, maxDex: null, acp: -1 },
    'heavy wooden shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy steel shield': { shield: 2, maxDex: null, acp: -2 },
    'heavy shield': { shield: 2, maxDex: null, acp: -2 },
    'tower shield': { shield: 4, maxDex: 2, acp: -10 }
  },

  // Canonical D&D 3.5e RAW Class Proficiencies (PHB Chapter 3, Complete & Tome of Battle)
  CLASS_PROFICIENCIES: {
    'fighter': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: true }
    },
    'barbarian': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'paladin': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'ranger': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'cleric': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'druid': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'dart', 'quarterstaff', 'scimitar', 'sickle', 'shortspear', 'sling', 'spear'] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'rogue': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'sap', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'bard': {
      weapons: { simple: true, martial: false, specific: ['longsword', 'rapier', 'sap', 'short sword', 'shortbow', 'whip'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'monk': {
      weapons: { simple: false, martial: false, specific: ['club', 'crossbow', 'light crossbow', 'heavy crossbow', 'dagger', 'handaxe', 'javelin', 'kama', 'nunchaku', 'quarterstaff', 'sai', 'shuriken', 'siangham', 'sling', 'unarmed strike'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'sorcerer': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'wizard': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'warlock': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'crusader': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'swordsage': {
      weapons: { simple: true, martial: false, specific: ['light crossbow', 'heavy crossbow', 'shortbow', 'composite shortbow'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'warblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'duskblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'knight': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: true }
    },
    'warmage': {
      weapons: { simple: true, martial: false, specific: ['light repeating crossbow'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'beguiler': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'scout': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'sap', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'swashbuckler': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'hexblade': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'favored soul': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: true, heavy: false },
      shields: { shield: true, tower: false }
    },
    'spellthief': {
      weapons: { simple: true, martial: false, specific: ['hand crossbow', 'rapier', 'shortbow', 'short sword'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'psion': {
      weapons: { simple: false, martial: false, specific: ['club', 'dagger', 'heavy crossbow', 'light crossbow', 'quarterstaff', 'shortspear'] },
      armors: { light: false, medium: false, heavy: false },
      shields: { shield: false, tower: false }
    },
    'psychic warrior': {
      weapons: { simple: true, martial: true, specific: [] },
      armors: { light: true, medium: true, heavy: true },
      shields: { shield: true, tower: false }
    },
    'soulknife': {
      weapons: { simple: true, martial: false, specific: ['mind blade'] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    },
    'wilder': {
      weapons: { simple: true, martial: false, specific: [] },
      armors: { light: true, medium: false, heavy: false },
      shields: { shield: true, tower: false }
    }
  },

  // Calculate D&D 3.5e Ability Modifier: floor((score - 10) / 2)
  getAbilityMod(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  },

  // Normalize human shorthand formula tokens (e.g. "10+lvl+Con", "10 + 1/2 lvl + Cha") into Canonical V2 @tokens
  normalizeFormulaTokens(formulaStr) {
    if (formulaStr === null || formulaStr === undefined) return '';
    let s = String(formulaStr).trim();
    if (!s) return '';
    s = s
      .replace(/^dc\s*[:=]?\s*/i, '')
      .replace(/\b1\s*\/\s*2\s*(?:@?level|@?lvl|@?hd)\b/gi, 'floor(@level / 2)')
      .replace(/\bhalf\s+(?:@?level|@?lvl|@?hd)\b/gi, 'floor(@level / 2)')
      .replace(/(?:@?level|@?lvl|@?hd)\s*\/\s*2\b/gi, 'floor(@level / 2)')
      .replace(/(?<![a-zA-Z@.])(?:lvl|level|hd)\b/gi, '@level')
      .replace(/(?<![a-zA-Z@.])(?:cl|caster\s*level)\b/gi, '@cl')
      .replace(/(?<![a-zA-Z@.])bab\b/gi, '@bab')
      .replace(/(?<![a-zA-Z@])str(?:\s*mod)?\b/gi, '@strMod')
      .replace(/(?<![a-zA-Z@])dex(?:\s*mod)?\b/gi, '@dexMod')
      .replace(/(?<![a-zA-Z@])con(?:\s*mod)?\b/gi, '@conMod')
      .replace(/(?<![a-zA-Z@])int(?:\s*mod)?\b/gi, '@intMod')
      .replace(/(?<![a-zA-Z@])wis(?:\s*mod)?\b/gi, '@wisMod')
      .replace(/(?<![a-zA-Z@])cha(?:\s*mod)?\b/gi, '@chaMod')
      .replace(/\s*\+\s*/g, ' + ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  },

  // Build live formula evaluation context from a character object
  buildFormulaContext(character, extra = {}) {
    const ch = character || (typeof window !== 'undefined' ? window.character : null) || {};
    const activeProg = Array.isArray(ch.levelProgression)
      ? ch.levelProgression.filter(r => r && r.active !== false)
      : [];
    const level = activeProg.length > 0 ? activeProg.length : (Math.max(1, Number(ch.level) || 1));
    const cl = Math.max(1, Number(ch.spellcasting?.cl ?? ch.casterLevel) || level);
    const bab = Number(ch.bab) || 0;

    const classLevels = Object.assign({}, ch.classLevels || {});
    if (activeProg.length > 0) {
      activeProg.forEach(r => {
        const cKey = String(r.className || r.class || '').toLowerCase().trim().replace(/\s+/g, '_');
        if (cKey) classLevels[cKey] = (classLevels[cKey] || 0) + 1;
      });
    } else if (Array.isArray(ch.classes)) {
      ch.classes.forEach(c => {
        const cKey = String(c.name || c.className || '').toLowerCase().trim().replace(/\s+/g, '_');
        if (cKey) classLevels[cKey] = Number(c.level) || 1;
      });
    }

    const getMod = (key) => {
      if (ch.evaluatedAbilities && ch.evaluatedAbilities[key] && typeof ch.evaluatedAbilities[key].mod === 'number') {
        return ch.evaluatedAbilities[key].mod;
      }
      const rawAbi = ch.abilities && ch.abilities[key];
      if (rawAbi && typeof rawAbi === 'object') {
        if (typeof rawAbi.mod === 'number') return rawAbi.mod;
        const tot = Number(rawAbi.total ?? rawAbi.score ?? rawAbi.base ?? 10);
        const tmp = Number(rawAbi.temp) || 0;
        return this.getAbilityMod(tot + (rawAbi.total !== undefined ? 0 : tmp));
      }
      if (typeof rawAbi === 'number') return this.getAbilityMod(rawAbi);
      if (ch.stats && typeof ch.stats[key] === 'number') return this.getAbilityMod(ch.stats[key]);
      return 0;
    };

    return Object.assign({
      level,
      cl,
      casterLevel: cl,
      bab,
      strMod: getMod('str'),
      dexMod: getMod('dex'),
      conMod: getMod('con'),
      intMod: getMod('int'),
      wisMod: getMod('wis'),
      chaMod: getMod('cha'),
      classLevels,
      skills: ch.skills || {},
      state: ch.legoState || ch.state || {},
      inputs: extra.inputs || {},
      self: extra.self || { stacks: 1, invested: 0 },
      spells: ch.spells || ch.spellcasting || {}
    }, extra);
  },

  // Evaluate an ability or entry's Save DC formula against live character stats
  evaluateAbilitySaveDc(entryOrFormula, character) {
    const rawFormula = (entryOrFormula && typeof entryOrFormula === 'object')
      ? (entryOrFormula.dcFormula || entryOrFormula.saveDcFormula || (entryOrFormula.save && entryOrFormula.save.dcFormula) || '')
      : String(entryOrFormula || '');
    const normFormula = this.normalizeFormulaTokens(rawFormula);
    if (!normFormula) return null;
    const ctx = this.buildFormulaContext(character);
    const dc = Math.floor(Number(this.evaluateFormula(normFormula, ctx)) || 0);
    if (dc <= 0) return null;

    const breakdownParts = normFormula
      .replace(/floor\(\s*@level\s*\/\s*2\s*\)/gi, `${Math.floor(ctx.level / 2)} [1/2 Lvl]`)
      .replace(/@level\b/gi, `${ctx.level} Lvl`)
      .replace(/@cl\b/gi, `${ctx.cl} CL`)
      .replace(/@bab\b/gi, `${ctx.bab} BAB`)
      .replace(/@strMod\b/gi, `${ctx.strMod} STR`)
      .replace(/@dexMod\b/gi, `${ctx.dexMod} DEX`)
      .replace(/@conMod\b/gi, `${ctx.conMod} CON`)
      .replace(/@intMod\b/gi, `${ctx.intMod} INT`)
      .replace(/@wisMod\b/gi, `${ctx.wisMod} WIS`)
      .replace(/@chaMod\b/gi, `${ctx.chaMod} CHA`);

    return {
      dc,
      formula: normFormula,
      breakdown: breakdownParts
    };
  },

  // Zero-eval recursive-descent arithmetic, comparison, ternary, and math-function evaluator
  safeEvaluateMathExpr(exprStr) {
    const src = String(exprStr || '').trim();
    if (!src) return 0;
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let num = '';
        while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
        tokens.push({ type: 'num', value: Number(num) || 0 });
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        let id = '';
        while (i < src.length && /[a-zA-Z0-9_.]/.test(src[i])) id += src[i++];
        const cleanId = id.replace(/^Math\./i, '').toLowerCase();
        tokens.push({ type: 'id', value: cleanId });
        continue;
      }
      const two = src.slice(i, i + 2);
      if (['>=', '<=', '==', '!=', '&&', '||'].includes(two)) {
        tokens.push({ type: 'op', value: two });
        i += 2;
        continue;
      }
      if ('+-*/%(),?:><!'.includes(ch)) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      return 0;
    }

    let pos = 0;
    const peek = () => tokens[pos] || null;
    const consume = () => tokens[pos++] || null;

    const parseTernary = () => {
      const cond = parseOr();
      if (peek() && peek().type === 'op' && peek().value === '?') {
        consume();
        const truthy = parseTernary();
        if (peek() && peek().type === 'op' && peek().value === ':') consume();
        const falsy = parseTernary();
        return cond ? truthy : falsy;
      }
      return cond;
    };

    const parseOr = () => {
      let left = parseAnd();
      while (peek() && peek().type === 'op' && peek().value === '||') {
        consume();
        const right = parseAnd();
        left = (left || right) ? 1 : 0;
      }
      return left;
    };

    const parseAnd = () => {
      let left = parseCmp();
      while (peek() && peek().type === 'op' && peek().value === '&&') {
        consume();
        const right = parseCmp();
        left = (left && right) ? 1 : 0;
      }
      return left;
    };

    const parseCmp = () => {
      let left = parseAdd();
      while (peek() && peek().type === 'op' && ['>', '<', '>=', '<=', '==', '!='].includes(peek().value)) {
        const op = consume().value;
        const right = parseAdd();
        if (op === '>') left = left > right ? 1 : 0;
        else if (op === '<') left = left < right ? 1 : 0;
        else if (op === '>=') left = left >= right ? 1 : 0;
        else if (op === '<=') left = left <= right ? 1 : 0;
        else if (op === '==') left = left === right ? 1 : 0;
        else if (op === '!=') left = left !== right ? 1 : 0;
      }
      return left;
    };

    const parseAdd = () => {
      let left = parseMul();
      while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseMul();
        left = op === '+' ? (left + right) : (left - right);
      }
      return left;
    };

    const parseMul = () => {
      let left = parseUnary();
      while (peek() && peek().type === 'op' && ['*', '/', '%'].includes(peek().value)) {
        const op = consume().value;
        const right = parseUnary();
        if (op === '*') left *= right;
        else if (op === '/') left = right !== 0 ? (left / right) : 0;
        else if (op === '%') left = right !== 0 ? (left % right) : 0;
      }
      return left;
    };

    const parseUnary = () => {
      if (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-' || peek().value === '!')) {
        const op = consume().value;
        const val = parseUnary();
        if (op === '-') return -val;
        if (op === '!') return val ? 0 : 1;
        return val;
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      const tok = peek();
      if (!tok) return 0;
      if (tok.type === 'num') {
        consume();
        return tok.value;
      }
      if (tok.type === 'op' && tok.value === '(') {
        consume();
        const val = parseTernary();
        if (peek() && peek().type === 'op' && peek().value === ')') consume();
        return val;
      }
      if (tok.type === 'id') {
        const fn = consume().value;
        const args = [];
        if (peek() && peek().type === 'op' && peek().value === '(') {
          consume();
          if (!(peek() && peek().type === 'op' && peek().value === ')')) {
            args.push(parseTernary());
            while (peek() && peek().type === 'op' && peek().value === ',') {
              consume();
              args.push(parseTernary());
            }
          }
          if (peek() && peek().type === 'op' && peek().value === ')') consume();
        }
        if (fn === 'min') return args.length ? Math.min(...args) : 0;
        if (fn === 'max') return args.length ? Math.max(...args) : 0;
        if (fn === 'floor') return Math.floor(args[0] || 0);
        if (fn === 'ceil') return Math.ceil(args[0] || 0);
        if (fn === 'round') return Math.round(args[0] || 0);
        if (fn === 'abs') return Math.abs(args[0] || 0);
        if (fn === 'clamp') return Math.min(args[2] ?? 0, Math.max(args[1] ?? 0, args[0] ?? 0));
        return 0;
      }
      consume();
      return 0;
    };

    try {
      const res = parseTernary();
      return typeof res === 'number' && Number.isFinite(res) ? res : 0;
    } catch (_) {
      return 0;
    }
  },

  // Canonical V2/V2.5 Formula Evaluator (Zero-eval, supports @level, @cl, @bab, @strMod..@chaMod, @input.*, @self.*, @state.*, @skill.*, @classes.*, @spells.maxUnspentLevel)
  evaluateFormula(formula, context = {}) {
    if (formula === null || formula === undefined || formula === '') return 0;
    if (typeof formula === 'number') return formula;
    const raw = this.normalizeFormulaTokens(String(formula).trim());
    const directNum = Number(raw);
    if (!Number.isNaN(directNum)) return directNum;

    const cl = Number(context.cl ?? context.casterLevel ?? context.level ?? 1) || 1;
    const level = Number(context.level ?? cl) || 1;
    const bab = Number(context.bab ?? 0) || 0;
    const enh = Number(context.enhancement ?? context.enhancementBonus ?? 0) || 0;
    const critMult = Number(context.critMult ?? 1) || 1;

    let expr = raw
      .replace(/@item\.level\b/gi, String(cl))
      .replace(/@cl\b/gi, String(cl))
      .replace(/@casterLevel\b/gi, String(cl))
      .replace(/@level\b/gi, String(level))
      .replace(/@bab\b/gi, String(bab))
      .replace(/@enhancement\b/gi, String(enh))
      .replace(/@critMult\b/gi, String(critMult))
      .replace(/@strMod\b/gi, String(Number(context.strMod) || 0))
      .replace(/@dexMod\b/gi, String(Number(context.dexMod) || 0))
      .replace(/@conMod\b/gi, String(Number(context.conMod) || 0))
      .replace(/@intMod\b/gi, String(Number(context.intMod) || 0))
      .replace(/@wisMod\b/gi, String(Number(context.wisMod) || 0))
      .replace(/@chaMod\b/gi, String(Number(context.chaMod) || 0))
      .replace(/@ability\.(str|dex|con|int|wis|cha)\.mod\b/gi, (_, a) => String(Number(context[`${a.toLowerCase()}Mod`]) || 0))
      .replace(/@(?:classes|class)\.([a-z0-9_]+)\.level\b/gi, (_, cName) => {
        const key = cName.toLowerCase();
        const cLvl = (context.classLevels && typeof context.classLevels[key] === 'number') ? context.classLevels[key] : 0;
        return String(cLvl);
      })
      .replace(/@input\.([a-z0-9_]+)\b/gi, (_, k) => {
        const v = context.inputs && context.inputs[k] !== undefined ? Number(context.inputs[k]) : 0;
        return String(Number.isFinite(v) ? v : 0);
      })
      .replace(/@self\.([a-z0-9_]+)\b/gi, (_, k) => {
        const v = context.self && context.self[k] !== undefined ? Number(context.self[k]) : 0;
        return String(Number.isFinite(v) ? v : 0);
      })
      .replace(/@state\.([a-z0-9_]+)\b/gi, (_, k) => {
        const v = context.state && context.state[k] !== undefined ? Number(context.state[k]) : 0;
        return String(Number.isFinite(v) ? v : 0);
      })
      .replace(/@skill\.([a-z0-9_]+)\.(total|ranks|bonus)\b/gi, (_, sKey, prop) => {
        const sk = context.skills && (context.skills[sKey] || context.skills[sKey.toLowerCase()]);
        if (typeof sk === 'number') return String(sk);
        if (sk && typeof sk === 'object') return String(Number(sk[prop] ?? sk.total ?? sk.bonus ?? sk.ranks) || 0);
        return '0';
      })
      .replace(/@spells\.maxUnspentLevel(?:\(\s*['"]?([a-z0-9_]+)['"]?\s*\))?/gi, (_, desc) => {
        const sp = context.spells || {};
        if (typeof sp.maxUnspentLevel === 'number') return String(sp.maxUnspentLevel);
        if (desc && sp.maxUnspentByDescriptor && typeof sp.maxUnspentByDescriptor[desc.toLowerCase()] === 'number') {
          return String(sp.maxUnspentByDescriptor[desc.toLowerCase()]);
        }
        if (Array.isArray(sp.prepared)) {
          const dLow = desc ? desc.toLowerCase() : null;
          let maxL = 0;
          sp.prepared.forEach(p => {
            if (!p || p.spent || p.expended) return;
            if (dLow) {
              const tags = `${p.descriptor || ''} ${p.school || ''} ${(p.tags || []).join(' ')} ${p.name || ''}`.toLowerCase();
              if (!tags.includes(dLow)) return;
            }
            const lvl = Number(p.level) || 0;
            if (lvl > maxL) maxL = lvl;
          });
          return String(maxL);
        }
        return '0';
      });

    // If expression contains dice notation like "(min(10, 5))d6" or "2d8+(min(5, 10))*1", evaluate math parts
    if (/\d*d\d+/i.test(expr)) {
      let diceResolved = expr.replace(/\(([^()]+)\)(?=d\d+)/gi, (_, sub) => {
        const val = this.evaluateFormula(sub, context);
        return String(Math.max(1, Math.floor(Number(val) || 1)));
      });
      diceResolved = diceResolved.replace(/^(min|max|floor|ceil|round)\(([^()]+)\)(?=d\d+)/i, (full) => {
        const val = this.evaluateFormula(full, context);
        return String(Math.max(1, Math.floor(Number(val) || 1)));
      });
      diceResolved = diceResolved.replace(/^([0-9+\-*/\s]+)(?=d\d+)/i, (prefix) => {
        if (/^\d+$/.test(prefix.trim())) return prefix.trim();
        const val = this.safeEvaluateMathExpr(prefix);
        return String(Math.max(1, Math.floor(Number(val) || 1)));
      });
      const tailMatch = diceResolved.match(/^(\d+d\d+)\s*([+-][\s\S]+)$/i);
      if (tailMatch && !/\d+d\d+/i.test(tailMatch[2])) {
        const bonusVal = Math.floor(Number(this.evaluateFormula(tailMatch[2], context)) || 0);
        if (bonusVal === 0) return tailMatch[1];
        return `${tailMatch[1]}${bonusVal > 0 ? '+' : ''}${bonusVal}`;
      }
      return diceResolved;
    }

    return this.safeEvaluateMathExpr(expr);
  },

  // Ensure an object is upgraded to Canonical V2/V2.5 via SchemaMigrator & normalizeLegoEntry
  ensureV2Entry(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    if (entry.schemaVersion === 2 && Array.isArray(entry.modifiers) && Array.isArray(entry.defenses)) return entry;
    let upgraded = entry;
    if (typeof window !== 'undefined' && window.SchemaMigrator && typeof window.SchemaMigrator.upgradeEntryToV2 === 'function') {
      upgraded = window.SchemaMigrator.upgradeEntryToV2(entry);
    }
    return this.normalizeLegoEntry(upgraded);
  },

  // D&D 3.5e DMG p.28 Weapon Size / Die Step Progression Table
  WEAPON_DIE_STEPS: ['1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6'],
  WEAPON_DIE_ALT_STEPS: {
    '1d12': { '1': '3d6', '-1': '1d10' },
    '2d4': { '1': '2d6', '-1': '1d6' },
    '2d8': { '1': '3d8', '-1': '1d10' }
  },

  stepWeaponDie(diceStr, steps = 1) {
    const clean = String(diceStr || '1d6').trim().toLowerCase();
    const stepInt = Math.trunc(Number(steps) || 0);
    if (stepInt === 0) return clean;
    if (this.WEAPON_DIE_ALT_STEPS[clean] && this.WEAPON_DIE_ALT_STEPS[clean][String(stepInt)]) {
      return this.WEAPON_DIE_ALT_STEPS[clean][String(stepInt)];
    }
    const idx = this.WEAPON_DIE_STEPS.indexOf(clean);
    if (idx === -1) return clean;
    const nextIdx = Math.max(0, Math.min(this.WEAPON_DIE_STEPS.length - 1, idx + stepInt));
    return this.WEAPON_DIE_STEPS[nextIdx];
  },

  // Upgrade any V2 entry into full V2.5 Composable Lego Entry (migrates legacy ruleFlags defenses & recharge into structured blocks)
  normalizeLegoEntry(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    const out = Object.assign({}, entry);
    out.schemaVersion = 2;
    out.modifiers = Array.isArray(out.modifiers) ? out.modifiers.map(m => Object.assign({ op: 'add', type: 'Untyped', condition: null }, m)) : [];
    out.damageParts = Array.isArray(out.damageParts) ? out.damageParts : [];
    out.modes = Array.isArray(out.modes) ? out.modes : [];
    out.defenses = Array.isArray(out.defenses) ? out.defenses.slice() : [];
    out.resources = Array.isArray(out.resources) ? out.resources.slice() : [];
    out.grants = Array.isArray(out.grants) ? out.grants.slice() : [];
    out.choices = Array.isArray(out.choices) ? out.choices.slice() : [];

    // Migrate legacy ruleFlags defense keys into structured defenses[] if not already present
    const rf = out.ruleFlags || {};
    const hasDef = (kind, target) => out.defenses.some(d => d && d.kind === kind && (!target || d.target === target));
    if (rf.sr && !hasDef('sr')) {
      out.defenses.push(typeof rf.sr === 'number' ? { kind: 'sr', target: 'magic', value: rf.sr } : { kind: 'sr', target: 'magic', formula: String(rf.sr) });
    }
    if (rf.srFormula && !hasDef('sr')) {
      out.defenses.push({ kind: 'sr', target: 'magic', formula: String(rf.srFormula) });
    }
    if (rf.dr && !hasDef('dr')) {
      const drParts = String(rf.dr).split('/');
      const drVal = Number(drParts[0]);
      out.defenses.push(Number.isFinite(drVal)
        ? { kind: 'dr', target: 'physical', value: drVal, bypass: drParts[1] || '-' }
        : { kind: 'dr', target: 'physical', formula: drParts[0], bypass: drParts[1] || '-' });
    }
    if (rf.fortification && !hasDef('fortification')) {
      out.defenses.push({ kind: 'fortification', target: 'crit', value: Number(rf.fortification) || 25 });
    }
    if (rf.conToWillSave && !out.modifiers.some(m => m.target === 'save.will.abilityMod')) {
      out.modifiers.push({ target: 'save.will.abilityMod', op: 'max', formula: '@conMod', type: 'Untyped' });
    }

    // Migrate top-level dailyCharges / rechargeDice into structured resources[] if not already present
    if (out.dailyCharges && typeof out.dailyCharges === 'object' && out.resources.length === 0) {
      out.resources.push({
        id: `${out.id || 'item'}_charges`,
        name: 'Daily Charges',
        kind: 'consume',
        maxFormula: out.dailyCharges.max || 3,
        recharge: { period: 'day', dice: null }
      });
    } else if ((out.rechargeDice || out.recharge) && out.resources.length === 0) {
      out.resources.push({
        id: `${out.id || 'ability'}_cooldown`,
        name: 'Recharge Cooldown',
        kind: 'consume',
        maxFormula: 1,
        recharge: { period: 'rounds', dice: out.rechargeDice || out.recharge }
      });
    }

    return out;
  },

  // Build normalized ownedIds Set (raw, lowercase, and unprefixed shortId) from existingOwnedIds or character arrays
  buildCharacterOwnedIdsSet(character, existingOwnedIds = null) {
    const ownedIds = new Set();
    const addToken = (tok) => {
      if (!tok) return;
      const raw = String(tok).trim();
      if (!raw) return;
      const norm = raw.toLowerCase();
      const shortId = norm.split(':').pop();
      ownedIds.add(raw);
      ownedIds.add(norm);
      if (shortId) ownedIds.add(shortId);
    };
    if (existingOwnedIds && (existingOwnedIds instanceof Set ? existingOwnedIds.size > 0 : existingOwnedIds.length > 0)) {
      const iter = existingOwnedIds instanceof Set ? existingOwnedIds : Array.from(existingOwnedIds);
      iter.forEach(addToken);
      return ownedIds;
    }
    const ch = character || {};
    const scanArr = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (!item) return;
        if (typeof item === 'string') {
          addToken(item);
          addToken(`feat_${item.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`);
        } else if (typeof item === 'object') {
          if (item.id) addToken(item.id);
          if (item.baseItemId) addToken(item.baseItemId);
          if (item.name) {
            addToken(item.name);
            addToken(`feat_${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`);
          }
        }
      });
    };
    scanArr(ch.feats);
    scanArr(ch.specialAbilities);
    scanArr(ch.legoEntries);
    scanArr(ch.classFeatures);
    scanArr(ch.traits);
    scanArr(ch.flaws);
    if (Array.isArray(ch.levelProgression)) {
      ch.levelProgression.filter(r => r && r.active !== false).forEach(r => {
        scanArr(r.feats);
        scanArr(r.specialAbilities);
      });
    }
    return ownedIds;
  },

  // Evaluate structured V2.5 Predicate (when / requires) deterministically without regex guessing
  evaluatePredicate(predicate, character, context = {}) {
    if (!predicate) return true;
    const ch = character || {};
    const toggles = ch.activeToggles || context.toggles || {};
    const ownedIds = this.buildCharacterOwnedIdsSet(ch, context.ownedIds);
    const hasOwnedId = (id) => {
      const raw = String(id || '').trim();
      if (!raw) return false;
      const norm = raw.toLowerCase();
      const shortId = norm.split(':').pop();
      return ownedIds.has(raw) || ownedIds.has(norm) || ownedIds.has(shortId);
    };

    if (typeof predicate === 'string') {
      const tKey = predicate.toLowerCase().trim();
      if (!tKey) return true;
      if (tKey in toggles) return toggles[tKey] !== false;
      if (ownedIds.size > 0 && hasOwnedId(tKey)) return true;
      return toggles[tKey] !== false;
    }
    if (typeof predicate !== 'object') return true;

    const childCtx = Object.assign({}, context, { ownedIds });

    if (Array.isArray(predicate.all)) {
      const ok = predicate.all.every(p => typeof p === 'string' ? hasOwnedId(p) : this.evaluatePredicate(p, ch, childCtx));
      if (!ok) return false;
    }
    if (Array.isArray(predicate.any)) {
      const ok = predicate.any.some(p => typeof p === 'string' ? hasOwnedId(p) : this.evaluatePredicate(p, ch, childCtx));
      if (!ok) return false;
    }
    if (predicate.not) {
      const notMet = typeof predicate.not === 'string'
        ? hasOwnedId(predicate.not)
        : this.evaluatePredicate(predicate.not, ch, childCtx);
      if (notMet) return false;
    }
    if (predicate.has) {
      const reqs = Array.isArray(predicate.has) ? predicate.has : [predicate.has];
      if (!reqs.every(id => hasOwnedId(id))) return false;
    }
    if (Array.isArray(predicate.hasEntries)) {
      if (!predicate.hasEntries.every(id => hasOwnedId(id))) return false;
    }
    if (predicate.hasEntry) {
      if (!hasOwnedId(predicate.hasEntry)) return false;
    }
    if (predicate.toggle) {
      if (!toggles[predicate.toggle]) return false;
    }
    if (predicate.terrain) {
      const activeTerrain = String(ch.activeTerrain || context.terrain || '').toLowerCase();
      const allowed = Array.isArray(predicate.terrain) ? predicate.terrain.map(t => String(t).toLowerCase()) : [String(predicate.terrain).toLowerCase()];
      if (!allowed.includes(activeTerrain)) return false;
    }
    if (predicate.armorCategory) {
      const wornCat = String(ch.wornArmorCategory || context.armorCategory || 'None').toLowerCase();
      const allowed = Array.isArray(predicate.armorCategory) ? predicate.armorCategory.map(t => String(t).toLowerCase()) : [String(predicate.armorCategory).toLowerCase()];
      if (!allowed.includes(wornCat)) return false;
    }
    if (typeof predicate.minLevel === 'number') {
      const lvl = Number(context.level ?? ch.level ?? 1);
      if (lvl < predicate.minLevel) return false;
    }
    if (typeof predicate.minBab === 'number') {
      const bab = Number(context.bab ?? ch.bab ?? 0);
      if (bab < predicate.minBab) return false;
    }
    return true;
  },

  // Return list of missing requirement IDs/clauses for a V2.5 `requires` object
  getMissingRequirements(requires, character, context = {}) {
    if (!requires || typeof requires !== 'object') return [];
    const ch = character || {};
    const ownedIds = this.buildCharacterOwnedIdsSet(ch, context.ownedIds);
    const hasOwnedId = (id) => {
      const raw = String(id || '').trim();
      if (!raw) return false;
      const norm = raw.toLowerCase();
      const shortId = norm.split(':').pop();
      return ownedIds.has(raw) || ownedIds.has(norm) || ownedIds.has(shortId);
    };
    const missing = [];
    if (Array.isArray(requires.all)) {
      requires.all.forEach(p => {
        if (typeof p === 'string') {
          if (!hasOwnedId(p)) missing.push(p);
        } else if (!this.evaluatePredicate(p, ch, Object.assign({}, context, { ownedIds }))) {
          missing.push(JSON.stringify(p));
        }
      });
    }
    if (requires.has) {
      const reqs = Array.isArray(requires.has) ? requires.has : [requires.has];
      reqs.forEach(id => { if (!hasOwnedId(id)) missing.push(id); });
    }
    if (Array.isArray(requires.hasEntries)) {
      requires.hasEntries.forEach(id => { if (!hasOwnedId(id)) missing.push(id); });
    }
    if (requires.hasEntry && !hasOwnedId(requires.hasEntry)) {
      missing.push(requires.hasEntry);
    }
    return missing;
  },

  // Check if a target entity matches a ModifierEntryV2.selector filter
  matchesEntitySelector(entry, selector) {
    if (!entry || !selector || typeof selector !== 'object') return false;
    if (selector.id) {
      const localId = String(entry.id || '').split(':').pop();
      const selLocalId = String(selector.id).split(':').pop();
      if (entry.id !== selector.id && localId !== selLocalId) return false;
    }
    if (selector.type && String(entry.type || '').toLowerCase() !== String(selector.type).toLowerCase()) {
      return false;
    }
    if (selector.school) {
      const sch = String(entry.school || entry.spellStats?.school || '').toLowerCase();
      if (sch !== String(selector.school).toLowerCase()) return false;
    }
    if (typeof selector.maxLevel === 'number') {
      const lvl = Number(entry.level ?? entry.spellStats?.level);
      if (!Number.isFinite(lvl) || lvl > selector.maxLevel) return false;
    }
    if (typeof selector.minLevel === 'number') {
      const lvl = Number(entry.level ?? entry.spellStats?.level);
      if (!Number.isFinite(lvl) || lvl < selector.minLevel) return false;
    }
    if (selector.tag) {
      const tags = Array.isArray(entry.tags) ? entry.tags.map(t => String(t).toLowerCase()) : [];
      if (!tags.includes(String(selector.tag).toLowerCase())) return false;
    }
    return true;
  },

  // D&D 3.5e RAW Multiplier Combiner (PHB p.304: x2 + x2 = x3)
  combineRawMultipliers(multipliers = []) {
    if (!Array.isArray(multipliers) || multipliers.length === 0) return 1;
    let extra = 0;
    multipliers.forEach(m => {
      const num = Number(m);
      if (Number.isFinite(num) && num > 1) extra += (num - 1);
    });
    return 1 + extra;
  },

  // Collect and deduplicate all V2.5 Composable Lego entries from a character (legoEntries, feats, specialAbilities, classFeatures, equipped items, active buffs)
  collectLegoEntries(character) {
    const ch = character || {};
    const collected = [];
    const seenFullIds = new Set();
    const seenNames = new Set();
    const seenItemIds = new Set();
    const seenBodySlotNames = new Set();

    const addEntry = (raw, fallbackCategory = 'Feature', legoSource = 'legoEntries') => {
      if (!raw) return;
      let obj = raw;
      if (typeof raw === 'string') {
        if (typeof this.getMasterDbEntry === 'function') {
          obj = this.getMasterDbEntry(raw, fallbackCategory);
        }
        if (!obj || typeof obj !== 'object') return;
      } else if (typeof raw === 'object') {
        const dbMatch = (typeof this.getMasterDbEntry === 'function')
          ? (this.getMasterDbEntry(raw, fallbackCategory) || this.getMasterDbEntry(raw.id || raw.name, fallbackCategory))
          : null;
        if (dbMatch && typeof dbMatch === 'object') {
          const merged = Object.assign({}, dbMatch, raw);
          ['modifiers', 'defenses', 'resources', 'modes', 'grants', 'choices', 'damageParts'].forEach(k => {
            if ((!Array.isArray(raw[k]) || raw[k].length === 0) && Array.isArray(dbMatch[k]) && dbMatch[k].length > 0) {
              merged[k] = dbMatch[k];
            }
          });
          if (!raw.id && dbMatch.id) merged.id = dbMatch.id;
          if (!raw.requires && dbMatch.requires) merged.requires = dbMatch.requires;
          if (!raw.overrides && dbMatch.overrides) merged.overrides = dbMatch.overrides;
          obj = merged;
        }
      }
      const norm = this.normalizeLegoEntry(obj);
      if (!norm) return;
      norm._legoSource = legoSource;
      const fullId = String(norm.id || norm.baseItemId || norm.name || '').trim().toLowerCase();
      const nameLower = String(norm.name || '').trim().toLowerCase();
      if (fullId && seenFullIds.has(fullId)) return;
      if (!fullId.includes(':') && nameLower && seenNames.has(nameLower) && !norm.overrides) return;
      if (fullId) seenFullIds.add(fullId);
      if (nameLower) seenNames.add(nameLower);
      collected.push(norm);
    };

    const addItem = (rawItem, fromBodySlot = false) => {
      if (!rawItem || typeof rawItem !== 'object') return;
      const invId = String(rawItem.inventoryId || '').trim().toLowerCase();
      const itemId = String(rawItem.id || '').trim().toLowerCase();
      const nameKey = String(rawItem.name || '').trim().toLowerCase();
      if (fromBodySlot) {
        if (invId && seenItemIds.has(`inv:${invId}`)) return;
        if (invId) seenItemIds.add(`inv:${invId}`);
        if (itemId) seenItemIds.add(`id:${itemId}`);
        if (nameKey) seenBodySlotNames.add(nameKey);
      } else {
        if (invId && seenItemIds.has(`inv:${invId}`)) return;
        if (itemId && seenItemIds.has(`id:${itemId}`)) return;
        if (nameKey && seenBodySlotNames.has(nameKey)) return;
        if (invId) seenItemIds.add(`inv:${invId}`);
        if (itemId) seenItemIds.add(`id:${itemId}`);
        if (nameKey) seenBodySlotNames.add(nameKey);
      }
      const norm = this.normalizeLegoEntry(rawItem);
      if (norm) {
        norm._legoSource = fromBodySlot ? 'bodySlots' : 'inventory';
        collected.push(norm);
      }
    };

    (Array.isArray(ch.legoEntries) ? ch.legoEntries : []).forEach(e => addEntry(e, 'Feat', 'legoEntries'));
    (Array.isArray(ch.feats) ? ch.feats : []).forEach(f => addEntry(f, 'Feat', 'feats'));
    (Array.isArray(ch.specialAbilities) ? ch.specialAbilities : []).forEach(a => addEntry(a, 'Special Ability', 'specialAbilities'));
    (Array.isArray(ch.classFeatures) ? ch.classFeatures : []).forEach(cf => addEntry(cf, 'Class Feature', 'classFeatures'));

    Object.values(ch.bodySlots || {}).forEach(slotItem => {
      if (slotItem && typeof slotItem === 'object' && slotItem.active !== false && slotItem.equipped !== false) {
        addItem(slotItem, true);
      }
    });
    const invItems = (Array.isArray(ch.inventory) ? ch.inventory : []).concat(Array.isArray(ch.gearPool) ? ch.gearPool : []);
    invItems.forEach(item => {
      if (item && typeof item === 'object' && (item.equipped || item.isEquipped)) {
        addItem(item, false);
      }
    });

    (Array.isArray(ch.activeLegoBuffs) ? ch.activeLegoBuffs : []).forEach(b => {
      if (b && typeof b === 'object' && b.active !== false) addEntry(b, 'Buff', 'activeLegoBuffs');
    });
    (Array.isArray(ch.buffs) ? ch.buffs : []).forEach(b => {
      if (b && typeof b === 'object' && Boolean(b.active)) addEntry(b, 'Buff', 'buffs');
    });

    return collected;
  },

  // Single Unified V2.5 Composable Lego Evaluation Pipeline
  // Stages: 1. Grants/Synergies -> 2. Selector Modifiers -> 3. Stat/Sub-Component Modifiers -> 4. Defenses -> 5. Resources -> 6. Modes
  evaluateLegoCharacter(character, candidatePool = [], options = {}) {
    const ch = character || {};
    const allInitial = this.collectLegoEntries(ch);

    // Resolve House-Rule Overrides (Priority: Character-local > DM Pack > SRD; supports chained overrides Pack B -> Pack A -> SRD)
    const isOverriddenBy = (target, overrider) => {
      if (!target || !overrider || !overrider.overrides || target === overrider) return false;
      const ov = String(overrider.overrides).trim().toLowerCase();
      const tId = String(target.id || '').trim().toLowerCase();
      const tSlug = String(target.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (!ov) return false;
      if (tId && tId === ov) return true;
      if (ov.startsWith('srd:') && !tId.includes(':')) {
        const ovShort = ov.split(':').pop();
        if (tId === ovShort || tSlug === ovShort) return true;
      }
      return false;
    };
    const nonOverridden = allInitial.filter(target => {
      if (!target) return false;
      return !allInitial.some(other => isOverriddenBy(target, other));
    });
    // Final deduplication among surviving non-overridden entries: if both an SRD/unprefixed entry and its exact same-ID copy exist, keep first
    const seenActiveKeys = new Set();
    const activeEntries = nonOverridden.filter(e => {
      const fullId = String(e.id || '').trim().toLowerCase();
      const shortId = fullId.split(':').pop();
      const hasNs = fullId.includes(':');
      const key = hasNs ? fullId : (shortId || String(e.name || '').trim().toLowerCase());
      if (key && seenActiveKeys.has(key)) return false;
      if (key) seenActiveKeys.add(key);
      return true;
    });

    const ownedIds = new Set();
    activeEntries.forEach(e => {
      if (e && e.id) {
        ownedIds.add(e.id);
        ownedIds.add(String(e.id).split(':').pop());
      }
    });

    const ctx = this.buildFormulaContext(ch, { ownedIds });

    // STAGE 1: Synergy & Grant Resolution (auto-unlocks entries from candidatePool or embedded grants when requires predicate passes)
    const grantedCapabilities = { spellsAtWill: [], proficiencies: [], senses: [], movements: [], unlockedEntities: [] };
    const poolNormalized = Array.isArray(candidatePool) ? candidatePool.map(p => this.normalizeLegoEntry(p)) : [];

    // First process embedded grants (which may unlock entities needed by candidatePool requires predicates)
    activeEntries.slice().forEach(e => {
      (e.grants || []).forEach(g => {
        if (!this.evaluatePredicate(g.requires, ch, ctx)) return;
        if (g.grantType === 'entity' && g.targetId && !ownedIds.has(g.targetId)) {
          const found = poolNormalized.find(p => p.id === g.targetId || String(p.id).split(':').pop() === g.targetId);
          if (found) {
            const unlocked = Object.assign({}, found, { _autoUnlocked: true });
            activeEntries.push(unlocked);
            ownedIds.add(unlocked.id);
            ownedIds.add(String(unlocked.id).split(':').pop());
            grantedCapabilities.unlockedEntities.push(unlocked.id);
          } else {
            ownedIds.add(g.targetId);
            ownedIds.add(String(g.targetId).split(':').pop());
            grantedCapabilities.unlockedEntities.push(g.targetId);
          }
        } else if (g.grantType === 'spell_at_will') {
          grantedCapabilities.spellsAtWill.push({ source: e.id, targetId: g.targetId, filter: g.filter || null });
        } else if (g.grantType === 'proficiency') {
          grantedCapabilities.proficiencies.push(g.targetId || g.value);
        } else if (g.grantType === 'sense') {
          grantedCapabilities.senses.push({ type: g.targetId, range: g.value });
        } else if (g.grantType === 'movement') {
          grantedCapabilities.movements.push({ mode: g.targetId, speed: g.value });
        }
      });
    });

    // Check candidate pool entries that auto-unlock via requires/grants synergy
    poolNormalized.forEach(cand => {
      if (!cand || ownedIds.has(cand.id) || ownedIds.has(String(cand.id).split(':').pop())) return;
      if (cand.requires && (cand.requires.all || cand.requires.any || cand.requires.has)) {
        if (this.evaluatePredicate(cand.requires, ch, ctx)) {
          const unlocked = Object.assign({}, cand, { _autoUnlocked: true });
          activeEntries.push(unlocked);
          ownedIds.add(unlocked.id);
          ownedIds.add(String(unlocked.id).split(':').pop());
          grantedCapabilities.unlockedEntities.push(unlocked.id);
        }
      }
    });

    // Deep-clone entries before Stage 2 selector mutations so base catalog objects are never mutated in place
    const workingEntries = activeEntries.map(e => JSON.parse(JSON.stringify(e)));

    const getStacks = (e) => (e && e.stacks !== undefined && e.stacks !== null && e.stacks !== '' && !Number.isNaN(Number(e.stacks))) ? Number(e.stacks) : 1;
    const getInvested = (e) => (e && e.invested !== undefined && e.invested !== null && e.invested !== '' && !Number.isNaN(Number(e.invested))) ? Number(e.invested) : 0;

    // Collect all active modifiers (from top-level and passive modes)
    const allModifiers = [];
    workingEntries.forEach(e => {
      const selfCtx = Object.assign({}, ctx, {
        self: { stacks: getStacks(e), invested: getInvested(e) }
      });
      (e.modifiers || []).forEach(m => {
        if (this.evaluatePredicate(m.when || m.condition, ch, selfCtx)) {
          allModifiers.push({ mod: m, sourceEntry: e, selfCtx });
        }
      });
      (e.modes || []).forEach(mode => {
        if (mode && (String(mode.actionType || '').toLowerCase() === 'passive' || mode.isPassive)) {
          (mode.modifiers || []).forEach(m => {
            if (this.evaluatePredicate(m.when || m.condition, ch, selfCtx)) {
              allModifiers.push({ mod: m, sourceEntry: e, selfCtx });
            }
          });
        }
      });
    });

    // STAGE 2: Selector Modifiers (Entity-to-Entity & Category-Wide Mutations)
    const selectorMods = allModifiers.filter(item => item.mod.selector || String(item.mod.target || '').startsWith('entity.'));
    const statMods = allModifiers.filter(item => !item.mod.selector && !String(item.mod.target || '').startsWith('entity.'));

    selectorMods.forEach(({ mod, selfCtx }) => {
      const val = mod.formula !== undefined && mod.formula !== null
        ? this.evaluateFormula(mod.formula, selfCtx)
        : Number(mod.value || 0);
      const op = mod.op || 'add';
      const field = String(mod.target || '').replace(/^entity\./, '');

      workingEntries.forEach(targetEntry => {
        if (!this.matchesEntitySelector(targetEntry, mod.selector || {})) return;
        targetEntry._mutated = targetEntry._mutated || {};

        if (field === 'saveBonus') {
          (targetEntry.modifiers || []).forEach(tm => {
            if (String(tm.target || '').startsWith('save')) {
              tm.value = op === 'set' || op === 'replace' ? val : (Number(tm.value || 0) + val);
            }
          });
          (targetEntry.modes || []).forEach(mode => {
            if (mod.selector?.mode && mode.id !== mod.selector.mode) return;
            (mode.modifiers || []).forEach(tm => {
              if (String(tm.target || '').startsWith('save')) {
                tm.value = op === 'set' || op === 'replace' ? val : (Number(tm.value || 0) + val);
              }
            });
          });
        } else if (field === 'dc') {
          targetEntry._mutated.dcBonus = (targetEntry._mutated.dcBonus || 0) + (op === 'set' ? val : val);
        } else if (field === 'damageDice' || field === 'weaponDamageDice') {
          if (op === 'step_die') {
            if (targetEntry.weaponMeta?.damageDice) {
              targetEntry.weaponMeta.damageDice = this.stepWeaponDie(targetEntry.weaponMeta.damageDice, val);
            }
            (targetEntry.damageParts || []).forEach(dp => {
              dp.dice = this.stepWeaponDie(dp.dice, val);
            });
          }
        } else if (field === 'damageMultiplier') {
          targetEntry._mutated.damageMultipliers = targetEntry._mutated.damageMultipliers || [];
          targetEntry._mutated.damageMultipliers.push(val);
        } else if (field === 'areaMultiplier' || field === 'area') {
          targetEntry._mutated.areaMultiplier = (targetEntry._mutated.areaMultiplier || 1) * (op === 'multiply' ? val : (1 + val));
        } else if (field === 'durationMultiplier') {
          targetEntry._mutated.durationMultiplier = (targetEntry._mutated.durationMultiplier || 1) * (op === 'multiply' ? val : (1 + val));
        } else if (field === 'dispelDcBonus') {
          targetEntry._mutated.dispelDcBonus = (targetEntry._mutated.dispelDcBonus || 0) + val;
        } else if (field === 'actionType') {
          targetEntry.actionType = String(mod.value || val);
          (targetEntry.modes || []).forEach(m => {
            if (!mod.selector?.mode || m.id === mod.selector.mode) m.actionType = String(mod.value || val);
          });
        }
      });
    });

    // Re-collect stat modifiers in case a selector mutated an entry's modifier values (e.g. Arcane Shield mutating Absorb Magic from +2 to +4)
    const refreshedStatMods = [];
    workingEntries.forEach(e => {
      const selfCtx = Object.assign({}, ctx, {
        self: { stacks: getStacks(e), invested: getInvested(e) }
      });
      (e.modifiers || []).forEach(m => {
        if (m.selector || String(m.target || '').startsWith('entity.')) return;
        if (this.evaluatePredicate(m.when || m.condition, ch, selfCtx)) {
          refreshedStatMods.push({ mod: m, sourceEntry: e, selfCtx });
        }
      });
      (e.modes || []).forEach(mode => {
        if (mode && (String(mode.actionType || '').toLowerCase() === 'passive' || mode.isPassive)) {
          (mode.modifiers || []).forEach(m => {
            if (m.selector || String(m.target || '').startsWith('entity.')) return;
            if (this.evaluatePredicate(m.when || m.condition, ch, selfCtx)) {
              refreshedStatMods.push({ mod: m, sourceEntry: e, selfCtx });
            }
          });
        }
      });
    });

    // STAGE 3: Character Stat & Sub-Component Substitution Pipeline with 3.5e RAW Stacking
    const NON_STACKING_TYPES = new Set([
      'Enhancement', 'Deflection', 'Armor', 'Shield', 'Natural Armor', 'Resistance',
      'Morale', 'Luck', 'Insight', 'Sacred', 'Profane', 'Competence', 'Alchemical',
      'Racial', 'Size', 'Inherent'
    ]);

    const statBuckets = {};
    const replacements = {};
    const multipliers = { carryingCapacity: [], spellDamage: 0, healingReceived: 0 };
    const effectiveSizeScopes = {};

    const resolveModValue = (mod, selfCtx) => {
      let v = (mod.formula !== undefined && mod.formula !== null && mod.formula !== '')
        ? Number(this.evaluateFormula(mod.formula, selfCtx))
        : Number(mod.value || 0);
      if (mod.cap !== undefined && mod.cap !== null && mod.cap !== '') {
        const capVal = Number(this.evaluateFormula(mod.cap, selfCtx));
        if (Number.isFinite(capVal)) v = Math.min(v, capVal);
      }
      return Math.floor(v);
    };

    // First apply Ability Score bonuses so derived ability modifiers (@strMod..@chaMod) update dynamically
    const abilityKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const abilityTotals = {};
    abilityKeys.forEach(k => {
      const baseScore = Number(ch.abilities?.[k]?.base ?? ch.abilities?.[k]?.score ?? ch.abilities?.[k] ?? ch.stats?.[k] ?? 10);
      abilityTotals[k] = { base: baseScore, typed: {}, untyped: 0 };
    });

    refreshedStatMods.forEach(({ mod, selfCtx }) => {
      const t = String(mod.target || '');
      const m = t.match(/^ability\.(str|dex|con|int|wis|cha)$/i);
      if (!m) return;
      const k = m[1].toLowerCase();
      const v = resolveModValue(mod, selfCtx);
      const bType = mod.type || 'Untyped';
      if (NON_STACKING_TYPES.has(bType) && v > 0) {
        abilityTotals[k].typed[bType] = Math.max(abilityTotals[k].typed[bType] || 0, v);
      } else {
        abilityTotals[k].untyped += v;
      }
    });

    const evaluatedAbilities = {};
    abilityKeys.forEach(k => {
      let score;
      if (options && options.precomputedAbilities && options.precomputedAbilities[k] !== undefined) {
        const pre = options.precomputedAbilities[k];
        score = typeof pre === 'object' ? Number(pre.score ?? pre.total ?? pre.base ?? 10) : Number(pre);
      } else {
        const typedSum = Object.values(abilityTotals[k].typed).reduce((a, b) => a + b, 0);
        score = abilityTotals[k].base + typedSum + abilityTotals[k].untyped;
      }
      const modVal = this.getAbilityMod(score);
      evaluatedAbilities[k] = { score, mod: modVal };
      ctx[`${k}Mod`] = modVal;
    });

    // Now evaluate all remaining stat, sub-component, size, and multiplier modifiers with updated ability mods
    refreshedStatMods.forEach(({ mod, sourceEntry, selfCtx }) => {
      const updatedCtx = Object.assign({}, selfCtx, {
        strMod: evaluatedAbilities.str.mod,
        dexMod: evaluatedAbilities.dex.mod,
        conMod: evaluatedAbilities.con.mod,
        intMod: evaluatedAbilities.int.mod,
        wisMod: evaluatedAbilities.wis.mod,
        chaMod: evaluatedAbilities.cha.mod
      });
      const t = String(mod.target || '');
      if (/^ability\.(str|dex|con|int|wis|cha)$/i.test(t)) return;

      const op = mod.op || 'add';
      const rawVal = (mod.formula !== undefined && mod.formula !== null && mod.formula !== '')
        ? Number(this.evaluateFormula(mod.formula, updatedCtx))
        : Number(mod.value || 0);
      let v = rawVal;
      if (mod.cap !== undefined && mod.cap !== null && mod.cap !== '') {
        const capVal = Number(this.evaluateFormula(mod.cap, updatedCtx));
        if (Number.isFinite(capVal)) v = Math.min(v, capVal);
      }

      if (t === 'carryingCapacity.multiplier' && op === 'multiply') {
        multipliers.carryingCapacity.push(v);
        return;
      }
      if (t === 'spell.damageMultiplier') {
        multipliers.spellDamage += (op === 'multiply' && v > 1) ? (v - 1) : v;
        return;
      }
      if (t === 'healing.receivedMultiplier') {
        multipliers.healingReceived += (op === 'multiply' && v > 1) ? (v - 1) : v;
        return;
      }
      if (t === 'size.effective') {
        const scopes = Array.isArray(mod.appliesTo) && mod.appliesTo.length > 0
          ? mod.appliesTo
          : ['grapple', 'bullRush', 'trip', 'overrun', 'sunder', 'weaponSize', 'opposedSize'];
        scopes.forEach(sc => {
          effectiveSizeScopes[sc] = (effectiveSizeScopes[sc] || 0) + Math.floor(v);
        });
        return;
      }

      if (op === 'replace' || op === 'max' || op === 'set') {
        replacements[t] = replacements[t] || [];
        replacements[t].push({ op, value: Math.floor(v), source: sourceEntry.name, affects: mod.affects || null });
        return;
      }
      if (/^(?:save\.(?:fort|ref|will)|ac)\.abilitymod$/i.test(t) && op === 'add') {
        replacements[t] = replacements[t] || [];
        replacements[t].push({ op: 'add', value: Math.floor(v), source: sourceEntry.name, affects: mod.affects || null });
        return;
      }

      const bType = mod.type || 'Untyped';
      const intVal = Math.floor(v);
      const expandTargets = t === 'save.all' ? ['save.fort', 'save.ref', 'save.will'] : [t];
      expandTargets.forEach(targetKey => {
        statBuckets[targetKey] = statBuckets[targetKey] || { typed: {}, untyped: 0, breakdown: [] };
        if (NON_STACKING_TYPES.has(bType) && intVal > 0) {
          const prev = statBuckets[targetKey].typed[bType] || 0;
          if (intVal > prev) statBuckets[targetKey].typed[bType] = intVal;
        } else {
          statBuckets[targetKey].untyped += intVal;
        }
        statBuckets[targetKey].breakdown.push({
          value: intVal,
          type: bType,
          source: sourceEntry.name,
          sourceLabel: mod.sourceLabel || null
        });
      });
    });

    const sumBucket = (key) => {
      const b = statBuckets[key];
      if (!b) return 0;
      return Object.values(b.typed).reduce((acc, n) => acc + n, 0) + b.untyped;
    };

    // Resolve Sub-Component Ability Modifiers (e.g. save.will.abilityMod, save.ref.abilityMod, ac.abilityMod)
    const resolveSubComponentMod = (slotKey, defaultMod) => {
      const cands = replacements[slotKey];
      const addSum = (cands || []).filter(c => c.op === 'add').reduce((acc, c) => acc + c.value, 0);
      const nonAdd = (cands || []).filter(c => c.op !== 'add');
      let baseVal = defaultMod;
      if (nonAdd.length > 0) {
        const forced = nonAdd.filter(c => c.op === 'replace' || c.op === 'set');
        if (forced.length > 0) baseVal = Math.max(...forced.map(f => f.value));
        else baseVal = Math.max(defaultMod, ...nonAdd.map(c => c.value));
      }
      return baseVal + addSum;
    };

    const fortAbiMod = resolveSubComponentMod('save.fort.abilityMod', evaluatedAbilities.con.mod);
    const refAbiMod = resolveSubComponentMod('save.ref.abilityMod', evaluatedAbilities.dex.mod);
    const willAbiMod = resolveSubComponentMod('save.will.abilityMod', evaluatedAbilities.wis.mod);
    const acAbiMod = resolveSubComponentMod('ac.abilityMod', evaluatedAbilities.dex.mod);

    const baseSaves = ch.baseSaves || { fort: 0, ref: 0, will: 0 };
    const saves = {
      fort: (Number(baseSaves.fort) || 0) + fortAbiMod + sumBucket('save.fort'),
      ref: (Number(baseSaves.ref) || 0) + refAbiMod + sumBucket('save.ref'),
      will: (Number(baseSaves.will) || 0) + willAbiMod + sumBucket('save.will'),
      abilityMods: {
        fort: fortAbiMod,
        ref: refAbiMod,
        will: willAbiMod
      }
    };

    // Resolve Armor Class (Normal, Touch, Flat-Footed) & AC Replacement (e.g. Perform Dance check = AC)
    const armorBonus = sumBucket('ac.armor');
    const shieldBonus = sumBucket('ac.shield');
    const natArmorBonus = sumBucket('ac.natural');
    const deflectBonus = sumBucket('ac.deflection');
    const dodgeBonus = sumBucket('ac.dodge');
    const miscAcBonus = sumBucket('ac');

    let normalAc = 10 + acAbiMod + armorBonus + shieldBonus + natArmorBonus + deflectBonus + dodgeBonus + miscAcBonus;
    let touchAc = 10 + acAbiMod + deflectBonus + dodgeBonus + miscAcBonus;
    let flatFootedAc = 10 + Math.min(0, acAbiMod) + armorBonus + shieldBonus + natArmorBonus + deflectBonus + miscAcBonus;

    const acReplaces = [...(replacements['ac.base'] || []), ...(replacements['ac.total'] || [])];
    acReplaces.forEach(rep => {
      const aff = Array.isArray(rep.affects) ? rep.affects : ['normal', 'touch', 'flatFooted'];
      if (rep.op === 'replace' || rep.op === 'set') {
        if (aff.includes('normal')) normalAc = rep.value;
        if (aff.includes('touch')) touchAc = rep.value;
        if (aff.includes('flatFooted')) flatFootedAc = rep.value;
      } else if (rep.op === 'max') {
        if (aff.includes('normal')) normalAc = Math.max(normalAc, rep.value);
        if (aff.includes('touch')) touchAc = Math.max(touchAc, rep.value);
        if (aff.includes('flatFooted')) flatFootedAc = Math.max(flatFootedAc, rep.value);
      }
    });

    // STAGE 4: Defenses Evaluation
    const defenses = {
      dr: [],
      sr: 0,
      resistances: {},
      immunities: new Set(),
      vulnerabilities: new Set(),
      regen: 0,
      fastHealing: 0,
      fortification: 0,
      absorptions: {}
    };

    workingEntries.forEach(e => {
      const selfCtx = Object.assign({}, ctx, {
        strMod: evaluatedAbilities.str.mod,
        dexMod: evaluatedAbilities.dex.mod,
        conMod: evaluatedAbilities.con.mod,
        intMod: evaluatedAbilities.int.mod,
        wisMod: evaluatedAbilities.wis.mod,
        chaMod: evaluatedAbilities.cha.mod,
        self: { stacks: getStacks(e), invested: getInvested(e) }
      });
      (e.defenses || []).forEach(d => {
        if (!this.evaluatePredicate(d.when, ch, selfCtx)) return;
        const val = (d.formula !== undefined && d.formula !== null && d.formula !== '')
          ? Math.floor(Number(this.evaluateFormula(d.formula, selfCtx)) || 0)
          : Number(d.value || 0);
        const tgt = String(d.target || '').toLowerCase();
        if (d.kind === 'dr') {
          defenses.dr.push({ value: val, bypass: d.bypass || '-', source: e.name });
        } else if (d.kind === 'sr') {
          defenses.sr = Math.max(defenses.sr, val);
        } else if (d.kind === 'resistance') {
          defenses.resistances[tgt] = Math.max(defenses.resistances[tgt] || 0, val);
        } else if (d.kind === 'immunity') {
          defenses.immunities.add(tgt);
        } else if (d.kind === 'vulnerability') {
          defenses.vulnerabilities.add(tgt);
        } else if (d.kind === 'regen') {
          defenses.regen = Math.max(defenses.regen, val);
        } else if (d.kind === 'fast_healing') {
          defenses.fastHealing = Math.max(defenses.fastHealing, val);
        } else if (d.kind === 'fortification') {
          defenses.fortification = Math.max(defenses.fortification, val);
        } else if (d.kind === 'absorption') {
          const ratio = (d.healRatio !== undefined || d.ratio !== undefined || d.value !== undefined)
            ? Number(d.healRatio ?? d.ratio ?? d.value)
            : null;
          if (ratio !== null && Number.isFinite(ratio)) {
            defenses.absorptions[tgt] = Math.max(defenses.absorptions[tgt] || 0, ratio);
          }
        }
      });
    });

    // STAGE 5: Resources & Essentia Allocation Pools
    const resources = {};
    workingEntries.forEach(e => {
      (e.resources || []).forEach(r => {
        const maxVal = Math.max(0, Math.floor(Number(this.evaluateFormula(r.maxFormula ?? 1, ctx)) || 0));
        resources[r.id] = {
          id: r.id,
          name: r.name,
          kind: r.kind || 'consume',
          max: maxVal,
          recharge: r.recharge || { period: 'day', dice: null },
          source: e.id
        };
      });
    });

    // STAGE 6: Modes / Activities Evaluation (with post-selector mutations applied)
    const evaluatedModes = [];
    workingEntries.forEach(e => {
      const mut = e._mutated || {};
      const dmgMult = this.combineRawMultipliers(mut.damageMultipliers || []);
      const dcBonus = Number(mut.dcBonus || 0);
      const selfCtx = Object.assign({}, ctx, {
        strMod: evaluatedAbilities.str.mod,
        dexMod: evaluatedAbilities.dex.mod,
        conMod: evaluatedAbilities.con.mod,
        intMod: evaluatedAbilities.int.mod,
        wisMod: evaluatedAbilities.wis.mod,
        chaMod: evaluatedAbilities.cha.mod,
        self: { stacks: getStacks(e), invested: getInvested(e) }
      });

      (e.modes || []).forEach(m => {
        if (m.requires && !this.evaluatePredicate(m.requires, ch, selfCtx)) return;
        const saveObj = (m.save && typeof m.save === 'object')
          ? m.save
          : (e.dcFormula ? { type: m.save || e.save || 'Reflex', dcFormula: e.dcFormula, onSave: 'half' } : null);
        const computedDc = saveObj && saveObj.dcFormula
          ? (Math.floor(Number(this.evaluateFormula(saveObj.dcFormula, selfCtx)) || 0) + dcBonus)
          : (dcBonus ? (10 + dcBonus) : null);

        const resolvedParts = (m.damageParts || []).map(dp => {
          const baseDice = String(this.evaluateFormula(dp.dice, selfCtx));
          let resolvedDice = baseDice;
          if (dmgMult > 1 && /^\d+d\d+/i.test(resolvedDice)) {
            resolvedDice = resolvedDice.replace(/^(\d+)d(\d+)/i, (_, c, s) => `${Number(c) * dmgMult}d${s}`);
          }
          const flatBonus = Math.floor(Number(this.evaluateFormula(dp.bonus ?? 0, selfCtx)) || 0) * dmgMult;
          const displayFormula = dmgMult > 1 ? `${baseDice} ×${dmgMult}` : baseDice;
          return Object.assign({}, dp, { baseDice, dice: resolvedDice, displayFormula, bonus: flatBonus, multiplierApplied: dmgMult });
        });

        evaluatedModes.push({
          entryId: e.id,
          entryName: e.name,
          modeId: m.id,
          name: m.name,
          sourceLabel: m.sourceLabel || null,
          actionType: m.actionType || e.actionType || 'standard',
          reactsTo: m.reactsTo || null,
          area: m.area || e.range || null,
          dc: computedDc,
          save: saveObj,
          damageParts: resolvedParts,
          inputs: m.inputs || [],
          spawnsBuff: m.spawnsBuff || null
        });
      });
    });

    return {
      abilities: evaluatedAbilities,
      saves,
      ac: { normal: normalAc, touch: touchAc, flatFooted: flatFootedAc, naturalArmor: natArmorBonus, abilityMod: acAbiMod, replacements: acReplaces },
      hpBonus: sumBucket('hp'),
      speedLandBonus: sumBucket('speed.land'),
      defenses: {
        dr: defenses.dr,
        sr: defenses.sr,
        resistances: defenses.resistances,
        immunities: Array.from(defenses.immunities),
        vulnerabilities: Array.from(defenses.vulnerabilities),
        regen: defenses.regen,
        fastHealing: defenses.fastHealing,
        fortification: defenses.fortification,
        absorptions: defenses.absorptions
      },
      multipliers: {
        carryingCapacity: this.combineRawMultipliers(multipliers.carryingCapacity),
        spellDamage: 1 + multipliers.spellDamage,
        healingReceived: 1 + multipliers.healingReceived
      },
      effectiveSizeScopes,
      resources,
      grantedCapabilities,
      modes: evaluatedModes,
      entries: workingEntries
    };
  },

  // D&D 3.5e RAW Incoming Damage Mitigation Pipeline (Immunity -> Vulnerability +50% -> Resistance / DR -> Elemental Absorption)
  applyIncomingDamage(evalResOrChar, amount, damageType, bypassTypes = []) {
    const incoming = Math.max(0, Math.floor(Number(amount) || 0));
    const dKey = String(damageType || 'physical').trim().toLowerCase();
    const evalRes = (evalResOrChar && evalResOrChar.defenses)
      ? evalResOrChar
      : this.evaluateLegoCharacter(evalResOrChar || {});
    const defs = evalRes.defenses || {};
    const immunities = Array.isArray(defs.immunities) ? defs.immunities : [];
    const vulnerabilities = Array.isArray(defs.vulnerabilities) ? defs.vulnerabilities : [];
    const resistances = defs.resistances || {};
    const absorptions = defs.absorptions || defs.absorption || {};
    const drList = Array.isArray(defs.dr) ? defs.dr : [];

    // 1. Immunity check
    if (dKey && immunities.includes(dKey)) {
      return {
        incoming,
        damageType: dKey,
        finalDelta: 0,
        taken: 0,
        healed: 0,
        note: `Immune to ${damageType} (0 dmg)`
      };
    }

    // 2. Absorption check (converts incoming damage of matching type into healing according to explicit ratio)
    const rawAbsorb = dKey ? absorptions[dKey] : undefined;
    const absorbRatio = typeof rawAbsorb === 'number'
      ? rawAbsorb
      : (rawAbsorb && typeof rawAbsorb === 'object' ? Number(rawAbsorb.healRatio ?? rawAbsorb.ratio ?? rawAbsorb.value) : null);
    if (absorbRatio !== null && Number.isFinite(absorbRatio) && absorbRatio > 0) {
      const healed = Math.floor(incoming * absorbRatio);
      return {
        incoming,
        damageType: dKey,
        finalDelta: healed,
        taken: 0,
        healed,
        note: `Absorbed ${damageType} (+${healed} HP)`
      };
    }

    // 3. Vulnerability (+50% damage before resistance per 3.5e RAW)
    let dmg = incoming;
    const isVulnerable = Boolean(dKey && vulnerabilities.includes(dKey));
    if (isVulnerable) {
      dmg = Math.floor(dmg * 1.5);
    }

    // 4. Energy Resistance or Physical DR
    let mitigatedBy = 0;
    const isPhysical = !dKey || ['physical', 'slashing', 'piercing', 'bludgeoning'].includes(dKey);
    if (!isPhysical && resistances[dKey] > 0) {
      mitigatedBy = Number(resistances[dKey]) || 0;
    } else if (isPhysical && drList.length > 0) {
      const bypassSet = new Set((Array.isArray(bypassTypes) ? bypassTypes : [bypassTypes]).map(b => String(b || '').toLowerCase().trim()));
      let bestDr = 0;
      drList.forEach(dr => {
        const bp = String(dr.bypass || '-').toLowerCase().trim();
        const isBypassed = bp !== '-' && bp !== '' && bp !== 'none' && bypassSet.has(bp);
        if (!isBypassed && Number(dr.value) > bestDr) bestDr = Number(dr.value);
      });
      mitigatedBy = bestDr;
    }

    const taken = Math.max(0, dmg - mitigatedBy);
    let note = '';
    if (isVulnerable && mitigatedBy > 0) {
      note = `Vulnerable (+50% -> ${dmg}) & Resisted ${mitigatedBy} ${damageType} (${taken} taken)`;
    } else if (isVulnerable) {
      note = `Vulnerable to ${damageType} (${taken} taken)`;
    } else if (mitigatedBy > 0) {
      note = `Resisted ${mitigatedBy} ${damageType || 'Physical'} (${taken} taken)`;
    }

    return {
      incoming,
      damageType: dKey,
      finalDelta: -taken,
      taken,
      healed: 0,
      note
    };
  },

  // Trigger an active/reactive Lego mode with runtime user inputs (@input.*) and return spawned buff / state changes
  triggerLegoMode(character, entryId, modeId, inputValues = {}) {
    const ch = character || {};
    const evalState = this.evaluateLegoCharacter(ch);
    const entry = evalState.entries.find(e => e.id === entryId || String(e.id).split(':').pop() === entryId);
    if (!entry) return null;
    const mode = (entry.modes || []).find(m => m.id === modeId) || (entry.modes || [])[0];
    if (!mode) return null;

    const ctx = this.buildFormulaContext(ch, {
      inputs: inputValues,
      strMod: evalState.abilities.str.mod,
      dexMod: evalState.abilities.dex.mod,
      conMod: evalState.abilities.con.mod,
      intMod: evalState.abilities.int.mod,
      wisMod: evalState.abilities.wis.mod,
      chaMod: evalState.abilities.cha.mod
    });

    const result = {
      entryId: entry.id,
      modeId: mode.id,
      tempHpGained: 0,
      healedHp: 0,
      spawnedBuff: null
    };

    if (mode.spawnsBuff) {
      const sb = mode.spawnsBuff;
      const dur = Math.floor(Number(this.evaluateFormula(sb.durationRounds ?? 1, ctx)) || 1);
      const tempHp = sb.tempHpFormula ? Math.floor(Number(this.evaluateFormula(sb.tempHpFormula, ctx)) || 0) : 0;
      const healHp = sb.healFormula ? Math.floor(Number(this.evaluateFormula(sb.healFormula, ctx)) || 0) : 0;
      const resolvedMods = (sb.modifiers || []).map(m => Object.assign({}, m, {
        value: m.formula ? Math.floor(Number(this.evaluateFormula(m.formula, ctx)) || 0) : Number(m.value || 0),
        formula: undefined
      }));
      result.tempHpGained = tempHp;
      result.healedHp = healHp;
      result.spawnedBuff = {
        id: sb.id || `buff_${entry.id}_${mode.id}`,
        name: sb.name || `${entry.name} (${mode.name})`,
        type: 'Special Ability',
        durationRounds: dur,
        maxStacks: sb.maxStacks || null,
        stacks: 1,
        tempHp,
        modifiers: resolvedMods,
        defenses: sb.defenses || [],
        note: sb.note || null
      };
    }

    return result;
  },

  // Dry-Run Preview: compare character stats before and after adding a candidate V2.5 Lego Entry
  dryRunLegoEntry(character, candidateEntry, candidatePool = []) {
    const before = this.evaluateLegoCharacter(character, candidatePool);
    const afterChar = Object.assign({}, character, {
      legoEntries: [...(character.legoEntries || []), candidateEntry]
    });
    const after = this.evaluateLegoCharacter(afterChar, candidatePool);
    const diffs = [];
    if (before.ac.normal !== after.ac.normal) diffs.push(`AC: ${before.ac.normal} -> ${after.ac.normal}`);
    if (before.saves.fort !== after.saves.fort) diffs.push(`Fort: ${before.saves.fort} -> ${after.saves.fort}`);
    if (before.saves.ref !== after.saves.ref) diffs.push(`Ref: ${before.saves.ref} -> ${after.saves.ref}`);
    if (before.saves.will !== after.saves.will) diffs.push(`Will: ${before.saves.will} -> ${after.saves.will}`);
    if (before.hpBonus !== after.hpBonus) diffs.push(`HP Bonus: +${before.hpBonus} -> +${after.hpBonus}`);
    if (before.defenses.sr !== after.defenses.sr) diffs.push(`SR: ${before.defenses.sr} -> ${after.defenses.sr}`);
    return { before, after, diffs };
  },

  // Derive the Declarative Page Object Interaction Map from an entry's Lego primitives (no entity-specific hardcoding)
  getObjectInteractionMap(entry) {
    const norm = this.normalizeLegoEntry(entry);
    if (!norm) return { nodes: [], edges: [] };
    const nodes = new Set();
    const edges = [];

    // 1. Modes -> Action Economy, Combat Offense, Saves Reaction Strip, Buff/HP Bar
    (norm.modes || []).forEach(m => {
      const act = String(m.actionType || norm.actionType || 'standard').toLowerCase();
      if (act !== 'passive') {
        nodes.add('ActionEconomyBar');
        edges.push({ from: `mode:${m.id}.actionType(${act})`, to: 'ActionEconomyBar', effect: `Spends ${act.toUpperCase()} slot (Move spending warns on Full Attack; Standard can convert to Move; Immediate locks next turn Swift)` });
      }
      if ((Array.isArray(m.damageParts) && m.damageParts.length > 0) || m.save) {
        nodes.add('CombatSpecialAttacksPanel');
        edges.push({ from: `mode:${m.id}`, to: 'CombatSpecialAttacksPanel', effect: 'Projects interactive Roll Damage + Save DC + Recharge card into Combat tab' });
      }
      if (m.reactsTo) {
        nodes.add('SavesAndReactionsStrip');
        edges.push({ from: `mode:${m.id}.reactsTo(${m.reactsTo})`, to: 'SavesAndReactionsStrip', effect: 'Mounts quick reaction trigger next to Saves/Defense HUD' });
      }
      if (m.spawnsBuff) {
        nodes.add('ActiveBuffsAndTurnClock');
        edges.push({ from: `mode:${m.id}.spawnsBuff`, to: 'ActiveBuffsAndTurnClock', effect: `Spawns timed buff (${m.spawnsBuff.durationRounds || 1} rds) & updates HP/TempHP` });
      }
    });

    // 2. Resources -> Turn Clock / Rest Manager
    (norm.resources || []).forEach(r => {
      const period = r.recharge?.period || 'day';
      if (period === 'rounds' || r.recharge?.dice) {
        nodes.add('TurnClockNode');
        edges.push({ from: `resource:${r.id}.recharge(${r.recharge?.dice || 'rounds'})`, to: 'TurnClockNode', effect: 'Subscribes to Next Round clock via absolute readyRound timestamp' });
      } else {
        nodes.add('RestAndResourcePoolBar');
        edges.push({ from: `resource:${r.id}(${period})`, to: 'RestAndResourcePoolBar', effect: `Tracks ${r.kind || 'consume'} pool across ${period} rest cycles` });
      }
    });

    // 3. Defenses -> Special Defenses Strip
    if (Array.isArray(norm.defenses) && norm.defenses.length > 0) {
      nodes.add('CombatSpecialDefensesPanel');
      edges.push({ from: 'defenses[]', to: 'CombatSpecialDefensesPanel', effect: 'Projects DR, SR, Energy Resistance, Immunity, and Absorption badges' });
    }

    // 4. Modifiers -> Stat / Selector Target Nodes
    (norm.modifiers || []).forEach(mod => {
      if (mod.selector || String(mod.target || '').startsWith('entity.')) {
        nodes.add('EntityMutatorGraph');
        edges.push({ from: `modifier:${mod.target}`, to: 'EntityMutatorGraph', effect: `Mutates matching entities (${JSON.stringify(mod.selector || {})}) before stat aggregation` });
      } else {
        nodes.add('CharacterStatHUD');
        edges.push({ from: `modifier:${mod.target}`, to: 'CharacterStatHUD', effect: `Applies ${mod.op || 'add'} (${mod.type || 'Untyped'}) to ${mod.target}` });
      }
    });

    const nodeList = Array.from(nodes);
    const boundUiTargets = nodeList.filter(n => n !== (norm.id || norm.name));
    const links = edges.map(e => ({ widget: e.to, detail: e.effect, from: e.from }));
    return { nodes: nodeList, edges, boundUiTargets, links };
  },

  // Phase 3: Local Two-Tier Lego Pattern Matcher (matches input text against curated lego_patterns.json skeletons)
  findMatchingLegoPatterns(queryText, patternsCatalog = null, maxResults = 3) {
    const q = String(queryText || '').toLowerCase().trim();
    if (!q) return [];
    const catalog = patternsCatalog
      || (typeof window !== 'undefined' && window.LEGO_PATTERNS_CATALOG ? window.LEGO_PATTERNS_CATALOG : []);
    const list = Array.isArray(catalog) ? catalog : (Array.isArray(catalog?.patterns) ? catalog.patterns : []);
    const scored = [];
    list.forEach(pat => {
      if (!pat || !Array.isArray(pat.keywords)) return;
      let score = 0;
      pat.keywords.forEach(kw => {
        const k = String(kw || '').toLowerCase();
        if (k && q.includes(k)) score += (k.includes(' ') ? 3 : 2);
      });
      if (score > 0) scored.push({ pattern: pat, score });
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map(s => s.pattern);
  },

  // Build AI Lego Assembly Prompt using matched structural templates from lego_patterns.json
  buildLegoAssemblyPrompt(userQuery, matchedPatterns = []) {
    const templatesJson = JSON.stringify(matchedPatterns.map(p => p.template), null, 2);
    return [
      'You are the D&D 3.5e Rule Master Lego Assembler.',
      'Clone and combine the provided V2.5 Composable Lego JSON templates (`modifiers`, `defenses`, `resources`, `modes`, `grants`, `choices`) and adapt only the domain parameters to match the user request.',
      'For multi-benefit DM Boons, include both benefits active simultaneously using `sourceLabel: "Benefit 1"` and `sourceLabel: "Benefit 2"`.',
      `Matched Structural Lego Templates:\n${templatesJson}`,
      `User Rule / Ability Request:\n${userQuery}`
    ].join('\n\n');
  },

  // Declarative Compendium & Master DB lookup helper (O(1) ID/BaseItemId priority per Rule #10.4)
  getMasterDbEntry(itemOrName, typeFilter = null) {
    if (!itemOrName) return null;
    const isObj = typeof itemOrName === 'object';
    const refId = isObj ? (itemOrName.baseItemId || itemOrName.id || null) : null;
    const rawName = String(isObj ? (itemOrName.masterDbName || itemOrName.name || '') : itemOrName).trim();

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    if (comp) {
      if (refId) {
        const byId = comp.getById(refId);
        if (byId) return byId;
      }
      if (rawName) {
        const byName = comp.getByName(rawName, typeFilter || (isObj ? itemOrName.type : null));
        if (byName) return byName;
      }
    }

    const clean = rawName.toLowerCase();
    if (!clean) return null;
    const db = (typeof window !== 'undefined' && window.masterDb) || (typeof masterDb !== 'undefined' ? masterDb : []);
    let found = Array.isArray(db) && db.length > 0
      ? db.find(m => m && ((refId && m.id === refId) || (m.name && m.name.toLowerCase().trim() === clean) || (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean)))
      : null;
    if (!found && !(typeof window !== 'undefined' && window.SrdCompendium && window.SrdCompendium._ready) && typeof window !== 'undefined' && Array.isArray(window.BUNDLED_SRD_CORE_CATALOG)) {
      found = window.BUNDLED_SRD_CORE_CATALOG.find(m => m && ((refId && m.id === refId) || (m.name && m.name.toLowerCase().trim() === clean) || (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean))) || null;
    }
    if (!found && typeof window !== 'undefined' && window.RuleMaster && window.RuleMaster.canonicalDictionary) {
      let dictKey = clean;
      if (typeof window.RuleMaster.canonicalDictionary[dictKey] === 'string') {
        dictKey = window.RuleMaster.canonicalDictionary[dictKey];
      }
      if (window.RuleMaster.canonicalDictionary[dictKey] && typeof window.RuleMaster.canonicalDictionary[dictKey] === 'object') {
        found = window.RuleMaster.canonicalDictionary[dictKey];
      }
    }
    if (!found && Array.isArray(this.SPLATBOOK_BUFF_SPELLS)) {
      found = this.SPLATBOOK_BUFF_SPELLS.find(m => m && ((refId && m.id === refId) || (m.name && m.name.toLowerCase().trim() === clean))) || null;
    }
    return found ? this.ensureV2Entry(found) : null;
  },

  // Check if weapon is the secondary / off-hand head of a Double Weapon or explicit Off-Hand weapon
  isOffHandWeaponHead(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;
    if (name.includes('off-hand') || name.includes('offhand') || name.includes('ikinci el')) return true;
    if (typeof weapon === 'object') {
      if (weapon.isOffHandHead || weapon.ruleFlags?.doubleWeaponOffHand) return true;
      const slot = String(weapon.slot || '').toLowerCase().trim();
      if ((slot === 'off-hand' || slot === 'offhand') && (weapon.category || weapon.type || '').toLowerCase() !== 'shield') return true;
      const desc = String(weapon.desc || weapon.benefit || weapon.description || '').toLowerCase();
      if (desc.includes('secondary head') || desc.includes('off-hand head') || desc.includes('secondary blade') || desc.includes('secondary spear head') || desc.includes('secondary pick head')) return true;
    }
    return false;
  },

  // Check if weapon is a D&D 3.5e Double Weapon (can be wielded 2H with one end or TWF with both ends)
  isDoubleWeapon(weapon) {
    if (!weapon || this.isOffHandWeaponHead(weapon)) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;
    if (typeof weapon === 'object') {
      if (weapon.isDoubleWeapon || weapon.ruleFlags?.doubleWeapon) return true;
      if (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase().includes('double'))) return true;
      const desc = String(weapon.desc || weapon.benefit || weapon.description || '').toLowerCase();
      if (desc.includes('is a double weapon') || desc.includes('double weapon.')) return true;
    }
    const db = this.getMasterDbEntry(weapon);
    if (db && !this.isOffHandWeaponHead(db)) {
      if (db.isDoubleWeapon || db.ruleFlags?.doubleWeapon) return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase().includes('double'))) return true;
    }
    const doubleWeapons = [
      'dire flail', 'two-bladed sword', 'orc double axe', 'gnome hooked hammer', 'dwarven urgrosh', 'quarterstaff'
    ];
    return doubleWeapons.some(dw => name.includes(dw));
  },

  // Build the virtual Off-Hand Head weapon stats for a Double Weapon (D&D 3.5e RAW: treated as a Light weapon)
  getDoubleWeaponOffHandHeadStats(weapon) {
    if (!weapon) return null;
    const baseObj = (typeof weapon === 'object') ? weapon : (this.getMasterDbEntry(weapon) || { name: String(weapon) });
    const db = this.getMasterDbEntry(baseObj) || baseObj;
    const rawName = String(baseObj.name || db.name || weapon || '').replace(/^↳\s*/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
    const nameLower = rawName.toLowerCase();
    const modes = Array.isArray(baseObj.modes) && baseObj.modes.length > 0 ? baseObj.modes : (Array.isArray(db.modes) ? db.modes : []);
    const offMode = modes.find(m => m && (m.id === 'offhand-head' || (m.ruleFlags && m.ruleFlags.doubleWeaponOffHand)));
    const modePart = offMode && Array.isArray(offMode.damageParts) && offMode.damageParts[0] ? offMode.damageParts[0] : null;

    let offDice = (modePart && modePart.dice) || baseObj.dice || db.dice || '1d8';
    let offDmgType = (modePart && modePart.type) || baseObj.dmgType || db.dmgType || 'Bludgeoning';
    let offCritMin = Number((offMode && offMode.critRange) || baseObj.critMin || db.critMin || db.critRange) || 20;
    let offCritMult = Number((offMode && offMode.critMult) || baseObj.critMult || db.critMult) || 2;

    if (nameLower.includes('gnome hooked hammer')) {
      offDice = '1d6'; offDmgType = 'Piercing'; offCritMin = 20; offCritMult = 4;
    } else if (nameLower.includes('dwarven urgrosh')) {
      offDice = '1d6'; offDmgType = 'Piercing'; offCritMin = 20; offCritMult = 3;
    } else if (nameLower.includes('two-bladed sword')) {
      offDice = '1d8'; offDmgType = 'Slashing'; offCritMin = 19; offCritMult = 2;
    } else if (nameLower.includes('orc double axe')) {
      offDice = '1d8'; offDmgType = 'Slashing'; offCritMin = 20; offCritMult = 3;
    } else if (nameLower.includes('dire flail')) {
      offDice = '1d8'; offDmgType = 'Bludgeoning'; offCritMin = 20; offCritMult = 2;
    } else if (nameLower.includes('quarterstaff')) {
      offDice = '1d6'; offDmgType = 'Bludgeoning'; offCritMin = 20; offCritMult = 2;
    }

    const enh = Number(baseObj.enhancementBonus || baseObj.attBonus || db.enhancementBonus || db.attBonus) || 0;
    return {
      name: `${rawName} (Off-Hand)`,
      parent: rawName,
      grip: 'Off-Hand',
      dice: offDice,
      critMin: offCritMin,
      critMult: offCritMult,
      attBonus: enh,
      dmgBonus: Number(baseObj.dmgBonus ?? enh) || 0,
      dmgType: offDmgType,
      isLight: true,
      isDoubleOffHandVirtual: true,
      damageParts: [{ dice: offDice, bonus: 0, type: offDmgType, multiplyOnCrit: true }],
      ruleFlags: { isLight: true, doubleWeaponOffHand: true },
      tags: ['off-hand', 'double', 'light']
    };
  },

  // Check if weapon is Light according to D&D 3.5e RAW rules
  isLightWeapon(weapon) {
    if (!weapon) return false;
    if (this.isOffHandWeaponHead(weapon)) return true;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      if (weapon.isLight || weapon.grip === 'Light' || weapon.category === 'Light' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'light'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.isLight || db.grip === 'Light' || db.category === 'Light' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'light'))) {
        return true;
      }
    }

    const standardLightWeapons = [
      'dagger', 'punching dagger', 'gauntlet', 'spiked gauntlet', 'light mace', 'sickle',
      'club', 'short sword', 'kukri', 'handaxe', 'light hammer', 'sap', 'light pick',
      'kama', 'nunchaku', 'sai', 'siangham', 'unarmed strike', 'silahsız'
    ];
    return standardLightWeapons.some(lw => name.includes(lw));
  },

  // Check if weapon is Exotic according to D&D 3.5e RAW rules
  isExoticWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      const wProf = weapon.proficiency || weapon.weaponMeta?.proficiency || weapon.category;
      if (wProf === 'Exotic' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'exotic'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      const dbProf = db.proficiency || db.weaponMeta?.proficiency || db.category;
      if (dbProf === 'Exotic' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'exotic'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const exoticWeapons = [
      'spiked chain', 'bastard sword', 'dwarven waraxe', 'kama', 'nunchaku', 'sai', 'siangham',
      'shuriken', 'whip', 'orc double axe', 'two-bladed sword', 'gnome hooked hammer', 'dire flail',
      'bolas', 'kusari-gama'
    ];
    return exoticWeapons.some(ew => baseWepName.includes(ew) || name.includes(ew));
  },

  // Check if weapon qualifies for Weapon Finesse
  isFinessable(weapon) {
    if (!weapon) return false;
    const name = (weapon.name || '').toLowerCase();
    const tags = Array.isArray(weapon.tags) ? weapon.tags.map(t => t.toLowerCase()) : [];
    const cat = (weapon.category || weapon.type || '').toLowerCase();
    
    // 1. Any Light weapon qualifies for Weapon Finesse per D&D 3.5e RAW (PHB p. 102)
    if (this.isLightWeapon(weapon) || weapon.isLight || tags.includes('light') || tags.includes('finessable') || cat === 'light' || cat.includes('light')) {
      return true;
    }

    // 2. Canonical D&D 3.5e RAW exceptions (usable with Weapon Finesse despite not being light)
    if (name.includes('rapier') || name.includes('whip') || name.includes('spiked chain')) {
      return true;
    }

    // 3. Fallback catalog of standard D&D 3.5e light weapons for untagged / legacy items
    const standardLightWeapons = [
      'dagger', 'punching dagger', 'gauntlet', 'spiked gauntlet', 'light mace', 'sickle',
      'club', 'short sword', 'kukri', 'handaxe', 'light hammer', 'sap', 'light pick',
      'kama', 'nunchaku', 'sai', 'siangham', 'unarmed strike'
    ];
    return standardLightWeapons.some(lw => name.includes(lw));
  },

  // Check if weapon belongs to Shadow Hand discipline
  isShadowHandWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (typeof weapon === 'object') {
      const discipline = (weapon.discipline || '').toLowerCase();
      if (discipline === 'shadow hand') return true;
      if (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'shadow hand')) return true;
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      const discipline = (db.discipline || '').toLowerCase();
      if (discipline === 'shadow hand') return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'shadow hand')) return true;
    }

    const shadowWeapons = ['dagger', 'short sword', 'sai', 'siangham', 'unarmed strike', 'spiked chain'];
    return shadowWeapons.some(sw => name.includes(sw));
  },

  // Check if weapon is Two-Handed according to D&D 3.5e RAW rules
  isTwoHandedWeapon(weapon) {
    if (!weapon) return false;
    if (this.isOffHandWeaponHead(weapon)) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (this.isLightWeapon(weapon)) return false;

    const db = this.getMasterDbEntry(weapon);
    const rawHandedness = String(
      (typeof weapon === 'object' ? (weapon.handedness || weapon.weaponMeta?.handedness || '') : '') ||
      (db ? (db.handedness || db.weaponMeta?.handedness || '') : '')
    ).toLowerCase().trim();

    if (rawHandedness.includes('light') || rawHandedness.includes('one-handed') || rawHandedness === '1-hand') {
      return false;
    }
    if (rawHandedness.includes('two-handed') || rawHandedness === '2-hand') {
      return true;
    }

    // Standard D&D 3.5e One-Handed / Light Weapons (never Two-Handed even if gripped in 2 hands)
    const oneHandedOrLightWeapons = [
      'battleaxe', 'longsword', 'rapier', 'scimitar', 'warhammer', 'morningstar',
      'heavy mace', 'light mace', 'dagger', 'punching dagger', 'short sword', 'shortsword',
      'handaxe', 'throwing axe', 'kukri', 'light hammer', 'light pick', 'heavy pick',
      'sap', 'sickle', 'trident', 'whip', 'kama', 'nunchaku', 'sai', 'siangham',
      'bastard sword', 'dwarven waraxe', 'shortspear', 'gauntlet', 'spiked gauntlet', 'unarmed strike'
    ];
    if (oneHandedOrLightWeapons.some(w => name.includes(w))) {
      return false;
    }
    if (name.includes('club') && !name.includes('greatclub')) {
      return false;
    }
    if (name.includes('flail') && !name.includes('heavy flail') && !name.includes('dire flail')) {
      return false;
    }

    // Standard D&D 3.5e Two-Handed Weapons (including Turkish names and SRD weapons)
    const twoHandedWeapons = [
      'jovar', 'greatsword', 'greataxe', 'greatclub', 'falchion', 'scythe', 'halberd',
      'heavy flail', 'guisarme', 'glaive', 'ranseur', 'spiked chain',
      'orc double axe', 'gnome hooked hammer', 'two-bladed sword', 'dire flail',
      'longspear', 'quarterstaff', 'longbow', 'composite longbow',
      'shortbow', 'composite shortbow', 'heavy crossbow', 'light crossbow',
      'yay', 'arbalet', 'kundak', 'büyük kılıç', 'büyük balta', 'tırpan', 'asa'
    ];

    if (twoHandedWeapons.some(w => name.includes(w))) {
      return true;
    }

    // Spear is two-handed in 3.5e; shortspear is one-handed
    if ((name.includes('spear') && !name.includes('shortspear')) || (name.includes('mızrak') && !name.includes('kısa mızrak'))) {
      return true;
    }

    const slot = (typeof weapon === 'object' ? (weapon.slot || '') : '').toLowerCase();
    const tags = (typeof weapon === 'object' && Array.isArray(weapon.tags)) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const desc = (typeof weapon === 'object' ? (weapon.desc || weapon.benefit || weapon.description || '') : '').toLowerCase();

    if (typeof weapon === 'object') {
      if (weapon.isTwoHanded || weapon.twoHanded || weapon.category === 'Two-Handed') return true;
    }
    if (tags.some(t => t.includes('two-hand') || t.includes('2-hand') || t.includes('two handed') || t.includes('çift el') || t.includes('iki el'))) return true;
    if (slot.includes('two-hand') || slot.includes('2-hand') || slot.includes('two handed') || slot.includes('çift el') || slot.includes('iki el')) return true;
    if (desc.includes('2-handed') || desc.includes('two-handed') || desc.includes('requires 2 hands') || desc.includes('massive 2-handed')) return true;

    if (db) {
      if (db.isTwoHanded || db.twoHanded || db.category === 'Two-Handed') return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase().includes('two-hand') || String(t).toLowerCase().includes('2-hand'))) return true;
    }

    return false;
  },

  // Check if weapon is Martial according to D&D 3.5e RAW rules
  isMartialWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (this.isExoticWeapon(weapon)) return false;

    if (typeof weapon === 'object') {
      const wProf = weapon.proficiency || weapon.weaponMeta?.proficiency || weapon.category;
      if (wProf === 'Martial' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'martial')) || (weapon.weaponType && weapon.weaponType.toLowerCase().includes('martial'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      const dbProf = db.proficiency || db.weaponMeta?.proficiency || db.category;
      if (dbProf === 'Martial' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'martial')) || (db.weaponType && db.weaponType.toLowerCase().includes('martial'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const standardMartialWeapons = [
      'throwing axe', 'handaxe', 'light hammer', 'light pick', 'sap', 'short sword', 'spiked armor', 'armor spikes',
      'battleaxe', 'flail', 'heavy pick', 'longsword', 'rapier', 'scimitar', 'trident', 'warhammer',
      'falchion', 'glaive', 'greataxe', 'greatclub', 'greatsword', 'guisarme', 'halberd', 'heavy flail',
      'lance', 'ranseur', 'scythe', 'shortbow', 'composite shortbow', 'longbow', 'composite longbow',
      'büyük kılıç', 'büyük balta', 'savaş baltası', 'uzun kılıç', 'uzun yay', 'kısa yay'
    ];
    return standardMartialWeapons.some(mw => baseWepName.includes(mw) || name.includes(mw));
  },

  // Check if weapon is Simple according to D&D 3.5e RAW rules
  isSimpleWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return false;

    if (this.isExoticWeapon(weapon) || this.isMartialWeapon(weapon)) return false;

    if (typeof weapon === 'object') {
      const wProf = weapon.proficiency || weapon.weaponMeta?.proficiency || weapon.category;
      if (wProf === 'Simple' || (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'simple')) || (weapon.weaponType && weapon.weaponType.toLowerCase().includes('simple'))) {
        return true;
      }
    }

    const db = this.getMasterDbEntry(weapon);
    if (db) {
      const dbProf = db.proficiency || db.weaponMeta?.proficiency || db.category;
      if (dbProf === 'Simple' || (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'simple')) || (db.weaponType && db.weaponType.toLowerCase().includes('simple'))) {
        return true;
      }
    }

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const standardSimpleWeapons = [
      'gauntlet', 'spiked gauntlet', 'unarmed strike', 'silahsız', 'dagger', 'punching dagger', 'light mace', 'sickle',
      'club', 'heavy mace', 'morningstar', 'shortspear', 'longspear', 'quarterstaff', 'spear',
      'crossbow', 'heavy crossbow', 'light crossbow', 'dart', 'javelin', 'sling',
      'hançer', 'asa', 'hafif arbalet', 'ağır arbalet', 'sapan', 'mızrak'
    ];
    return standardSimpleWeapons.some(sw => baseWepName.includes(sw) || name.includes(sw));
  },

  // Check if item is a Shield according to D&D 3.5e RAW rules
  isShieldItem(item) {
    if (!item) return false;
    const name = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return false;
    if (typeof item === 'object') {
      if (item.category === 'Shield' || item.type === 'Shield' || (item.slot && item.slot.toLowerCase().includes('shield'))) return true;
    }
    return Object.keys(this.SRD_SHIELDS).some(k => name.includes(k)) || name.includes('shield') || name.includes('kalkan') || name.includes('buckler');
  },

  // Check if item is a Tower Shield according to D&D 3.5e RAW rules
  isTowerShield(item) {
    if (!item) return false;
    const name = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
    return name.includes('tower shield') || name.includes('kule kalkan');
  },

  // Aggregate all character weapon, armor, and shield proficiencies from multiclasses and feats
  getCharacterProficiencies(character, targetLevelIdx = null) {
    const res = {
      weapons: {
        simple: false,
        martial: false,
        exoticAll: false,
        specific: new Set()
      },
      armors: {
        light: false,
        medium: false,
        heavy: false
      },
      shields: {
        shield: false,
        tower: false
      }
    };

    if (!character) return res;

    // 1. Collect classes up to targetLevelIdx (or full character)
    const prog = Array.isArray(character.levelProgression) ? character.levelProgression : [];
    const classNames = new Set();

    if (targetLevelIdx !== null && targetLevelIdx !== undefined) {
      const maxIdx = Math.max(0, Math.min(Number(targetLevelIdx), prog.length - 1));
      for (let i = 0; i <= maxIdx; i++) {
        if (prog[i] && prog[i].className && prog[i].active !== false) {
          classNames.add(prog[i].className.toLowerCase().trim());
        }
      }
    } else if (prog.length > 0) {
      prog.forEach(lvl => {
        if (lvl && lvl.className && lvl.active !== false) {
          classNames.add(lvl.className.toLowerCase().trim());
        }
      });
    }

    // In Level-up Wizard mode, if lvlup-class-select exists in DOM, add it too
    if (typeof document !== 'undefined') {
      const lvlSel = document.getElementById('lvlup-class-select');
      if (lvlSel && lvlSel.value && (targetLevelIdx === null || targetLevelIdx === undefined)) {
        classNames.add(lvlSel.value.toLowerCase().trim());
      }
    }

    // Fallback if classNames is still empty: parse character.classes string
    if (classNames.size === 0 && character.classes) {
      const parts = String(character.classes).split('/');
      parts.forEach(p => {
        const cName = p.replace(/\d+/g, '').trim().toLowerCase();
        if (cName) classNames.add(cName);
      });
    }

    // Default fallback if still empty
    if (classNames.size === 0) {
      classNames.add('fighter');
    }

    // Apply class proficiencies (Union across all multiclasses per RAW)
    classNames.forEach(cName => {
      const profData = this.CLASS_PROFICIENCIES[cName] || this.CLASS_PROFICIENCIES[cName.split(' ')[0]];
      if (profData) {
        if (profData.weapons.simple) res.weapons.simple = true;
        if (profData.weapons.martial) res.weapons.martial = true;
        (profData.weapons.specific || []).forEach(w => res.weapons.specific.add(w.toLowerCase().trim()));
        if (profData.armors.light) res.armors.light = true;
        if (profData.armors.medium) res.armors.medium = true;
        if (profData.armors.heavy) res.armors.heavy = true;
        if (profData.shields.shield) res.shields.shield = true;
        if (profData.shields.tower) res.shields.tower = true;
      } else {
        // Fallback for custom or unrecognized classes using BAB/role
        const def = this.getClassDef(cName) || (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[cName] : null) || {};
        if (def.bab === 1.0) {
          res.weapons.simple = true;
          res.weapons.martial = true;
          res.armors.light = true;
          res.armors.medium = true;
          res.armors.heavy = true;
          res.shields.shield = true;
        } else if (def.bab === 0.75) {
          res.weapons.simple = true;
          res.armors.light = true;
          res.armors.medium = true;
          res.shields.shield = true;
        } else {
          res.weapons.simple = true;
        }
      }
    });

    // 2. Collect learned feats and special abilities
    const learnedFeats = [];
    if (Array.isArray(character.feats)) {
      character.feats.forEach(f => learnedFeats.push(typeof f === 'string' ? f : f?.name || ''));
    }
    if (Array.isArray(character.specialAbilities)) {
      character.specialAbilities.forEach(a => learnedFeats.push(typeof a === 'string' ? a : a?.name || ''));
    }

    // In progression table mode, also collect feats learned up to targetLevelIdx
    if (targetLevelIdx !== null && targetLevelIdx !== undefined && prog.length > 0) {
      const maxIdx = Math.max(0, Math.min(Number(targetLevelIdx), prog.length - 1));
      for (let i = 0; i <= maxIdx; i++) {
        if (prog[i] && prog[i].active !== false && Array.isArray(prog[i].feats)) {
          prog[i].feats.forEach(f => learnedFeats.push(typeof f === 'string' ? f : f?.name || ''));
        }
      }
    }

    // In level up wizard, check prior slot feats if any
    if (typeof levelUpModalFeatSlots !== 'undefined' && Array.isArray(levelUpModalFeatSlots)) {
      levelUpModalFeatSlots.forEach(s => {
        if (s && s.name) learnedFeats.push(s.name);
      });
    }

    // Parse proficiency feats
    learnedFeats.forEach(featStr => {
      if (!featStr) return;
      const clean = featStr.toLowerCase().replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim();

      if (clean.includes('armor proficiency (light)') || clean.includes('hafif zırh ustalığı')) {
        res.armors.light = true;
      }
      if (clean.includes('armor proficiency (medium)') || clean.includes('orta zırh ustalığı')) {
        res.armors.medium = true;
      }
      if (clean.includes('armor proficiency (heavy)') || clean.includes('ağır zırh ustalığı')) {
        res.armors.heavy = true;
      }
      if (clean.includes('tower shield proficiency') || clean.includes('kule kalkanı ustalığı')) {
        res.shields.tower = true;
      }
      if (clean.includes('shield proficiency') || clean.includes('kalkan ustalığı')) {
        res.shields.shield = true;
      }
      if (clean.includes('simple weapon proficiency') || clean.includes('basit silah ustalığı')) {
        res.weapons.simple = true;
      }
      if (clean.includes('martial weapon proficiency') || clean.includes('askeri silah ustalığı')) {
        const match = clean.match(/(?:martial weapon proficiency|askeri silah ustalığı)\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        } else if (clean.includes('all') || clean.includes('tümü')) {
          res.weapons.martial = true;
        } else {
          res.weapons.martial = true;
        }
      }
      if (clean.includes('exotic weapon proficiency') || clean.includes('egzotik silah ustalığı')) {
        const match = clean.match(/(?:exotic weapon proficiency|egzotik silah ustalığı)\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        }
      }
      if (clean.includes('weapon aptitude') || clean.includes('silah yatkınlığı')) {
        if (learnedFeats.some(f => f.toLowerCase().includes('exotic weapon proficiency'))) {
          res.weapons.exoticAll = true;
        }
      }
    });

    return res;
  },

  // Check weapon proficiency
  isProficientWithWeapon(character, weapon, targetLevelIdx = null) {
    if (!weapon) return true;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === 'yok' || name === '-' || name === 'none' || name === 'boş') return true;

    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const prof = this.getCharacterProficiencies(character, targetLevelIdx);

    // 1. Specific weapon proficiencies always qualify
    for (const spec of prof.weapons.specific) {
      if (baseWepName.includes(spec) || name.includes(spec) || spec.includes(baseWepName)) {
        return true;
      }
    }

    // 2. Check Exotic
    if (this.isExoticWeapon(weapon)) {
      if (prof.weapons.exoticAll) return true;
      // Bastard sword / Dwarven waraxe RAW exception (PHB p. 121): Martial when wielded Two-Handed
      const isHandAndAHalf = baseWepName.includes('bastard sword') || baseWepName.includes('dwarven waraxe');
      const gripStr = (typeof weapon === 'object' ? String(weapon.grip || '') : '').toLowerCase();
      if (isHandAndAHalf && (gripStr.includes('2-hand') || gripStr.includes('two-hand') || gripStr.includes('çift el'))) {
        if (prof.weapons.martial) return true;
      }
      return false;
    }

    // 3. Check Martial
    if (this.isMartialWeapon(weapon)) {
      if (prof.weapons.martial) return true;
      // Special Swordsage rule: proficient with all martial melee weapons per RAW
      const prog = Array.isArray(character?.levelProgression) ? character.levelProgression : [];
      const isSwordsage = (character?.classes || '').toLowerCase().includes('swordsage') || prog.some(l => (l.className || '').toLowerCase().includes('swordsage'));
      if (isSwordsage) {
        const isRanged = weapon.grip === 'Ranged' || weapon.isRanged || (weapon.tags && weapon.tags.includes('ranged'));
        if (!isRanged) return true;
      }
      return false;
    }

    // 4. Simple weapon
    if (prof.weapons.simple) return true;

    return false;
  },

  // Check armor proficiency
  isProficientWithArmor(character, armor, targetLevelIdx = null) {
    if (!armor) return true;
    const name = (typeof armor === 'string' ? armor : (armor.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return true;

    const mods = this.parseItemModifiers(armor, (typeof masterDb !== 'undefined' ? masterDb : []));
    const dbArmor = (typeof armor === 'object' && !armor.armorMeta && !armor.armorCategory) ? this.getMasterDbEntry(armor) : null;
    const validWeightCats = ['light', 'medium', 'heavy', 'none'];
    const rawCatCandidates = [
      mods && mods.effectiveArmorCategory,
      typeof armor === 'object' ? armor.effectiveArmorCategory : null,
      typeof armor === 'object' ? armor.armorCategory : null,
      typeof armor === 'object' ? armor.armorMeta?.category : null,
      dbArmor ? dbArmor.effectiveArmorCategory : null,
      dbArmor ? dbArmor.armorCategory : null,
      dbArmor ? dbArmor.armorMeta?.category : null,
      typeof armor === 'object' ? armor.type : null
    ];
    let cat = rawCatCandidates.find(c => c && validWeightCats.includes(String(c).toLowerCase().trim())) || null;

    if (!cat) {
      for (const [key, val] of Object.entries(this.SRD_ARMORS)) {
        if (name.includes(key)) {
          cat = val.type;
          break;
        }
      }
    }

    if (!cat || String(cat).toLowerCase() === 'none') return true; // Robes / unarmored

    const prof = this.getCharacterProficiencies(character, targetLevelIdx);
    const catLower = cat.toLowerCase();
    if (catLower === 'heavy') return Boolean(prof.armors.heavy);
    if (catLower === 'medium') return Boolean(prof.armors.medium);
    if (catLower === 'light') return Boolean(prof.armors.light);
    return true;
  },

  // Check shield proficiency
  isProficientWithShield(character, shield, targetLevelIdx = null) {
    if (!shield) return true;
    const name = (typeof shield === 'string' ? shield : (shield.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none' || name === 'yok' || name === 'boş') return true;

    const prof = this.getCharacterProficiencies(character, targetLevelIdx);
    if (this.isTowerShield(shield)) {
      return Boolean(prof.shields.tower);
    }
    return Boolean(prof.shields.shield);
  },

  // Check if character possesses feat/trait allowing two-handed weapons or oversized weapons in one hand
  hasOversizedWeaponFeat(character) {
    if (!character) return false;
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const abilities = (character.specialAbilities || []).map(a => (typeof a === 'string' ? a : a.name || '').toLowerCase());
    const all = [...feats, ...abilities];
    return all.some(f => 
      f.includes('monkey grip') || 
      f.includes('oversized two-weapon fighting') || 
      f.includes('oversized weapon fighting') || 
      f.includes('oversized weapon') || 
      f.includes('powerful build') ||
      f.includes('jotunbrud') ||
      f.includes('tek elle çift el')
    );
  },

  // Resolve bonus stacking according to D&D 3.5e RAW rules
  resolveBonusStacking(bonusList) {
    const stackingTypes = ['dodge', 'untyped', 'circumstance', 'synergy', 'racial', 'template'];
    const buckets = {};
    let total = 0;

    bonusList.forEach(item => {
      const type = (item.type || 'untyped').toLowerCase();
      const val = Number(item.val) || 0;

      // Penalties always stack in D&D 3.5e
      if (val < 0) {
        total += val;
        return;
      }

      if (stackingTypes.includes(type)) {
        total += val;
      } else {
        if (!buckets[type] || val > buckets[type]) {
          buckets[type] = val;
        }
      }
    });

    Object.values(buckets).forEach(v => {
      total += v;
    });

    return total;
  },

  // Parse modifiers and stat bonuses from a Canonical V2 equipment item (zero heuristic regex guessing per Rule #10.3)
  parseItemModifiers(rawItem, masterDb = [], context = {}) {
    if (!rawItem || !rawItem.name || rawItem.name === '-') return null;

    const item = this.ensureV2Entry(rawItem);
    const dbEntry = this.getMasterDbEntry(item);

    const isArmor = item.type === 'Armor' || item.category === 'Armor' || dbEntry?.type === 'Armor';
    const isShield = item.type === 'Shield' || item.category === 'Shield' || dbEntry?.type === 'Shield';
    const baseCat = item.effectiveWeightCategory || item.armorCategory || (isArmor ? (item.category || dbEntry?.category || 'Light') : null);
    const isMithral = Boolean(
      item.material === 'mat-mithral' ||
      item.ruleFlags?.mithralHeavyAsMedium ||
      item.ruleFlags?.mithralMediumAsLight ||
      dbEntry?.material === 'mat-mithral'
    );

    let effectiveCat = baseCat;
    if (isArmor && isMithral && !item.effectiveWeightCategory) {
      if (effectiveCat === 'Heavy') effectiveCat = 'Medium';
      else if (effectiveCat === 'Medium') effectiveCat = 'Light';
    }

    const res = {
      id: item.id || dbEntry?.id || null,
      name: item.name,
      category: item.category || dbEntry?.category || 'Other',
      armorCategory: baseCat,
      effectiveArmorCategory: effectiveCat,
      isMithral,
      armor: 0,
      shield: 0,
      natural: 0,
      naturalBonusType: 'natural',
      deflection: 0,
      dodge: 0,
      maxDex: item.maxDex !== undefined && item.maxDex !== null && item.maxDex !== ''
        ? Number(item.maxDex)
        : (dbEntry?.maxDex !== undefined && dbEntry?.maxDex !== null && dbEntry?.maxDex !== '' ? Number(dbEntry.maxDex) : null),
      acp: item.checkPenalty !== undefined && item.checkPenalty !== null && item.checkPenalty !== ''
        ? Number(item.checkPenalty)
        : (dbEntry?.checkPenalty !== undefined && dbEntry?.checkPenalty !== null && dbEntry?.checkPenalty !== '' ? Number(dbEntry.checkPenalty) : 0),
      resistance: 0,
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
      attBonus: 0,
      dmgBonus: 0,
      fort: 0,
      ref: 0,
      will: 0,
      speed: 0,
      dr: 0,
      sr: 0,
      bonusType: 'enhancement',
      modifiers: [],
      ruleFlags: Object.assign({}, dbEntry?.ruleFlags || {}, item.ruleFlags || {})
    };

    const rawMods = (Array.isArray(item.modifiers) && item.modifiers.length > 0)
      ? item.modifiers
      : (Array.isArray(dbEntry?.modifiers) ? dbEntry.modifiers : []);

    const evalCtx = Object.assign({
      cl: item.casterLevel || dbEntry?.casterLevel || context.cl || 1,
      enhancement: item.enhancementBonus || dbEntry?.enhancementBonus || 0
    }, context);

    for (let i = 0; i < rawMods.length; i++) {
      const m = rawMods[i];
      if (!m || !m.target) continue;
      const val = this.evaluateFormula(m.formula !== undefined ? m.formula : m.value, evalCtx);
      if (!val) continue;
      const bType = String(m.type || 'untyped').toLowerCase();
      const target = String(m.target).trim();

      res.modifiers.push({
        target,
        value: val,
        type: bType,
        condition: m.condition || null,
        source: item.name
      });

      if (target === 'ac.armor' || target === 'armor') res.armor = Math.max(res.armor, val);
      else if (target === 'ac.shield' || target === 'shield') res.shield = Math.max(res.shield, val);
      else if (target === 'ac.natural' || target === 'natural') {
        res.natural = Math.max(res.natural, val);
        res.naturalBonusType = bType.includes('enh') ? 'Natural_Armor_Ench' : 'Natural';
      }
      else if (target === 'ac.deflection' || target === 'deflection' || ((target === 'ac.total' || target === 'ac') && bType === 'deflection')) res.deflection = Math.max(res.deflection, val);
      else if (target === 'ac.dodge' || target === 'dodge' || ((target === 'ac.total' || target === 'ac') && bType === 'dodge')) res.dodge += val;
      else if ((target === 'ac.total' || target === 'ac') && bType === 'armor') res.armor = Math.max(res.armor, val);
      else if ((target === 'ac.total' || target === 'ac') && bType === 'shield') res.shield = Math.max(res.shield, val);
      else if (target === 'ability.str' || target === 'str') { res.str = Math.max(res.str, val); res.bonusType = bType; }
      else if (target === 'ability.dex' || target === 'dex') { res.dex = Math.max(res.dex, val); res.bonusType = bType; }
      else if (target === 'ability.con' || target === 'con') { res.con = Math.max(res.con, val); res.bonusType = bType; }
      else if (target === 'ability.int' || target === 'int') { res.int = Math.max(res.int, val); res.bonusType = bType; }
      else if (target === 'ability.wis' || target === 'wis') { res.wis = Math.max(res.wis, val); res.bonusType = bType; }
      else if (target === 'ability.cha' || target === 'cha') { res.cha = Math.max(res.cha, val); res.bonusType = bType; }
      else if (target === 'save.all' || target === 'saves.all' || target === 'saves') {
        if (bType === 'resistance') res.resistance = Math.max(res.resistance, val);
        res.fort += val;
        res.ref += val;
        res.will += val;
      }
      else if (target === 'save.fort' || target === 'fort') res.fort += val;
      else if (target === 'save.ref' || target === 'ref') res.ref += val;
      else if (target === 'save.will' || target === 'will') res.will += val;
      else if (target.startsWith('attack') || target === 'meleeattack' || target === 'rangedattack') res.attBonus += val;
      else if (target.startsWith('damage') || target === 'meleedamage' || target === 'rangeddamage') res.dmgBonus += val;
      else if (target.startsWith('speed')) res.speed = Math.max(res.speed, val);
      else if (target === 'dr') res.dr = Math.max(res.dr, val);
      else if (target === 'sr') res.sr = Math.max(res.sr, val);
    }

    // If Armor or Shield has V2 `armorStats.baseAc` and no `ac.armor`/`ac.shield` modifier was present yet
    const baseArmorAc = Number(item.armorStats?.baseAc ?? dbEntry?.armorStats?.baseAc ?? 0) || 0;
    const enhBonus = Number(item.enhancementBonus ?? dbEntry?.enhancementBonus ?? 0) || 0;
    const totalArmorAc = baseArmorAc > 0 ? (baseArmorAc + enhBonus) : 0;
    if (totalArmorAc > 0) {
      if (isShield && res.shield === 0) {
        res.shield = totalArmorAc;
        res.modifiers.push({ target: 'ac.shield', value: totalArmorAc, type: 'shield', condition: null, source: item.name });
      } else if (isArmor && res.armor === 0) {
        res.armor = totalArmorAc;
        res.modifiers.push({ target: 'ac.armor', value: totalArmorAc, type: 'armor', condition: null, source: item.name });
      }
    }

    if (item.dailyCharges || dbEntry?.dailyCharges) {
      res.dailyCharges = JSON.parse(JSON.stringify(item.dailyCharges || dbEntry.dailyCharges));
    }
    if (item.chargeOptions || dbEntry?.chargeOptions) {
      res.chargeOptions = JSON.parse(JSON.stringify(item.chargeOptions || dbEntry.chargeOptions));
    }

    return res;
  },

  // Standard D&D 3.5e Canonical V2 default buffs catalog
  getDefaultBuffs() {
    return [
      {
        id: "buf-mage-armor",
        schemaVersion: 2,
        name: "Mage Armor",
        type: "Buff",
        source: "Spell",
        category: "AC",
        durationCategory: "hour",
        active: false,
        rounds: 50,
        durationText: "1 hr / CL (5 Hours)",
        notes: "+4 Armor bonus to AC (does not stack with worn armor; highest applies)",
        modifiers: [{ target: "ac.armor", value: 4, formula: "4", type: "armor", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-shield",
        schemaVersion: 2,
        name: "Shield (Spell)",
        type: "Buff",
        source: "Spell",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL (5 Min)",
        notes: "+4 Shield bonus to AC; negates Magic Missile attacks",
        modifiers: [{ target: "ac.shield", value: 4, formula: "4", type: "shield", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: { immuneMagicMissile: true }
      },
      {
        id: "buf-bulls-strength",
        schemaVersion: 2,
        name: "Bull's Strength",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL (5 Min)",
        notes: "+4 Enhancement bonus to STR (does not stack with Belt of Giant Strength)",
        modifiers: [{ target: "ability.str", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-cats-grace",
        schemaVersion: 2,
        name: "Cat's Grace",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL (5 Min)",
        notes: "+4 Enhancement bonus to DEX (does not stack with Gloves of Dexterity)",
        modifiers: [{ target: "ability.dex", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-bears-endurance",
        schemaVersion: 2,
        name: "Bear's Endurance",
        type: "Buff",
        source: "Spell / Potion",
        category: "Stat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL",
        notes: "+4 Enhancement bonus to CON (+2 HP/level, +2 Fortitude save)",
        modifiers: [{ target: "ability.con", value: 4, formula: "4", type: "enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-haste",
        schemaVersion: 2,
        name: "Haste",
        type: "Buff",
        source: "Spell",
        category: "Combat",
        durationCategory: "short",
        active: false,
        rounds: 6,
        durationText: "1 rd / CL (6 Rounds)",
        notes: "+1 Attack, +1 Dodge AC, +1 Reflex, +30 ft Speed, +1 extra attack on Full Attack",
        modifiers: [
          { target: "attack.all", value: 1, formula: "1", type: "untyped", condition: null },
          { target: "ac.dodge", value: 1, formula: "1", type: "dodge", condition: null },
          { target: "save.ref", value: 1, formula: "1", type: "dodge", condition: null },
          { target: "speed.all", value: 30, formula: "30", type: "enhancement", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { hasted: true, extraAttackFullAttack: true }
      },
      {
        id: "buf-bless",
        schemaVersion: 2,
        name: "Bless",
        type: "Buff",
        source: "Spell",
        category: "Morale",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL",
        notes: "+1 Morale bonus on attack rolls and saving throws against fear",
        modifiers: [{ target: "attack.all", value: 1, formula: "1", type: "morale", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-prayer-positive",
        schemaVersion: 2,
        name: "Prayer",
        type: "Buff",
        source: "Spell",
        category: "Luck",
        durationCategory: "short",
        active: false,
        rounds: 6,
        durationText: "1 rd / CL",
        notes: "+1 Luck bonus on attack rolls, weapon damage, saves, and skill checks",
        modifiers: [
          { target: "attack.all", value: 1, formula: "1", type: "luck", condition: null },
          { target: "damage.weapon", value: 1, formula: "1", type: "luck", condition: null },
          { target: "save.all", value: 1, formula: "1", type: "luck", condition: null },
          { target: "skill.all", value: 1, formula: "1", type: "luck", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-barkskin",
        schemaVersion: 2,
        name: "Barkskin",
        type: "Buff",
        source: "Spell",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 50,
        durationText: "10 min / CL",
        notes: "+2 to +5 Enhancement bonus to Natural Armor (+1 per 3 CL above 3rd, max +5 at CL 12)",
        modifiers: [{ target: "ac.natural", value: 0, formula: "2 + min(3, max(0, floor((@cl - 3) / 3)))", type: "natural_enhancement", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-shield-of-faith",
        schemaVersion: 2,
        name: "Shield of Faith",
        type: "Buff",
        source: "Spell",
        category: "AC",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min / CL",
        notes: "+2 to +5 Deflection bonus to AC (+1 per 6 CL, max +5 at CL 18)",
        modifiers: [{ target: "ac.deflection", value: 0, formula: "2 + min(3, floor(@cl / 6))", type: "deflection", condition: null }],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-divine-favor",
        schemaVersion: 2,
        name: "Divine Favor",
        type: "Buff",
        source: "Spell",
        category: "Combat",
        durationCategory: "short",
        active: false,
        rounds: 10,
        durationText: "1 min (10 Rounds)",
        notes: "+1 to +3 Luck bonus on attack and weapon damage rolls (+1 per 3 CL, min +1, max +3)",
        modifiers: [
          { target: "attack.all", value: 0, formula: "min(3, max(1, floor(@cl / 3)))", type: "luck", condition: null },
          { target: "damage.weapon", value: 0, formula: "min(3, max(1, floor(@cl / 3)))", type: "luck", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "buf-punishing-stance",
        schemaVersion: 2,
        name: "Punishing Stance",
        type: "Buff",
        source: "Stance",
        category: "Stance",
        durationCategory: "permanent",
        active: true,
        rounds: null,
        durationText: "Continuous",
        dmgDice: "1d6",
        notes: "+1d6 melee weapon damage, -2 penalty to AC",
        modifiers: [{ target: "ac.total", value: -2, formula: "-2", type: "penalty", condition: null }],
        damageParts: [{ dice: "1d6", bonus: 0, type: "Physical", multiplyOnCrit: false, onCritOnly: false, source: "Punishing Stance" }],
        modes: [],
        ruleFlags: {}
      }
    ];
  },

  // Standard D&D 3.5e RAW Canonical V2 default debuffs & conditions catalog
  getDefaultDebuffs() {
    return [
      {
        id: "cnd-energy-drained",
        schemaVersion: 2,
        name: "Energy Drain (-4 Lvl)",
        type: "Condition",
        source: "Spell / Undead",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "Permanent (Requires Restoration)",
        negativeLevels: 4,
        notes: "D&D 3.5e RAW: 4 Negative Levels! -4 Attack, -4 Saving Throws, -4 Skill/Ability Checks, -20 Max/Current HP, -4 Effective Caster Level.",
        modifiers: [
          { target: "attack.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "save.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "skill.all", value: -4, formula: "-4", type: "penalty", condition: null },
          { target: "hp.max", value: -20, formula: "-20", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { actionRestriction: "Energy Drained (-4 Negative Levels): -4 on all attacks, saves, skills, ability checks, -20 Max HP, -4 effective Caster Level." }
      },
      {
        id: "cnd-sickened",
        schemaVersion: 2,
        name: "Sickened",
        type: "Condition",
        source: "Condition",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Rounds",
        notes: "D&D 3.5e RAW: -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "damage.weapon", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "save.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "skill.all", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "cnd-shaken",
        schemaVersion: 2,
        name: "Shaken",
        type: "Condition",
        source: "Condition",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 10,
        durationText: "10 Rounds",
        notes: "D&D 3.5e RAW: Fear condition. -2 penalty on attack rolls, saving throws, skill checks, and ability checks",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "save.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "skill.all", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: {}
      },
      {
        id: "cnd-fatigued",
        schemaVersion: 2,
        name: "Fatigued",
        type: "Condition",
        source: "Condition",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: null,
        durationText: "8 Hours Rest",
        notes: "D&D 3.5e RAW: Cannot run or charge; -2 penalty to STR and DEX.",
        modifiers: [
          { target: "ability.str", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "ability.dex", value: -2, formula: "-2", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { actionRestriction: "Cannot run or charge (-2 Str, -2 Dex). 8 hours complete rest removes Fatigue." }
      },
      {
        id: "cnd-entangled",
        schemaVersion: 2,
        name: "Entangled",
        type: "Condition",
        source: "Condition",
        category: "Debuff",
        durationCategory: "condition",
        isDebuff: true,
        active: false,
        rounds: 5,
        durationText: "5 Rounds",
        notes: "D&D 3.5e RAW: Move at half speed, cannot run or charge, -2 penalty on attack rolls, -4 penalty to DEX (-2 AC and -2 Reflex)",
        modifiers: [
          { target: "attack.all", value: -2, formula: "-2", type: "penalty", condition: null },
          { target: "ability.dex", value: -4, formula: "-4", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { halfSpeed: true, actionRestriction: "Ensnared: moves at half speed, cannot run or charge, Concentration DC 15 + spell level to cast." }
      },
      {
        id: "buf-slow",
        schemaVersion: 2,
        name: "Slow (Spell)",
        type: "Condition",
        source: "Spell",
        category: "Debuff",
        durationCategory: "short",
        isDebuff: true,
        active: false,
        rounds: 6,
        durationText: "1 rd / CL (6 Rounds)",
        notes: "D&D 3.5e RAW: Only a single move or standard action per turn, -1 penalty to AC, attack rolls, and Reflex saves, half speed",
        modifiers: [
          { target: "ac.total", value: -1, formula: "-1", type: "penalty", condition: null },
          { target: "attack.all", value: -1, formula: "-1", type: "penalty", condition: null },
          { target: "save.ref", value: -1, formula: "-1", type: "penalty", condition: null }
        ],
        damageParts: [],
        modes: [],
        ruleFlags: { halfSpeed: true, actionRestriction: "Slowed: Only a single Move or Standard action per turn, moves at half speed." }
      }
    ];
  },

  // Evaluate dynamic scaling bonuses based on character level (e.g. "2+1/4lvl", "+1 per 3 levels", "lvl*2")
  evaluateScalingBonus(formulaOrText, charLvl = 1) {
    if (!formulaOrText) return 0;
    const str = String(formulaOrText).toLowerCase().trim();
    const lvl = Number(charLvl) || 1;

    // 1. "X + 1/Ylvl" or "X + lvl/Y" or "X + 1/Y level" (e.g. "2+1/4lvl", "2 + 1/4 character level")
    const basePlusFraction = str.match(/(\d+)\s*\+\s*(?:1\/(\d+)|(?:lvl|level)\/(\d+))\s*(?:lvl|level)?/i);
    if (basePlusFraction) {
      const base = parseInt(basePlusFraction[1], 10);
      const divisor = parseInt(basePlusFraction[2] || basePlusFraction[3], 10) || 1;
      return base + Math.floor(lvl / divisor);
    }

    // 2. "+N every/per Y levels" or "1/Ylvl" or "1/Y level" (e.g. "1 per 3 levels", "1 every 2 levels", "1/3lvl")
    const fractionOnly = str.match(/(?:(?:\+?(\d+)\s*(?:every|her|per)\s*(\d+)\s*(?:lvl|level|seviye))|1\/(\d+)\s*(?:lvl|level)?)/i);
    if (fractionOnly) {
      const step = parseInt(fractionOnly[1], 10) || 1;
      const divisor = parseInt(fractionOnly[2] || fractionOnly[3], 10) || 1;
      return Math.floor(lvl / divisor) * step;
    }

    // 3. "lvl*X" or "X per level" (e.g. "lvl*2", "1 per level", "equal to character level")
    const perLvl = str.match(/(?:(?:lvl|level)\s*\*\s*(\d+)|(\d+)\s*per\s*level|equal\s*to\s*(?:character\s*)?level)/i);
    if (perLvl) {
      if (str.includes('equal to')) return lvl;
      const mult = parseInt(perLvl[1] || perLvl[2], 10) || 1;
      return lvl * mult;
    }

    // 4. Direct integer "+N" or "N"
    const directInt = str.match(/^\+?(\d+)$/);
    if (directInt) {
      return parseInt(directInt[1], 10);
    }

    return 0;
  },

  // Central Dynamic Spell Scaling Resolver (D&D 3.5e RAW)
  // Calculates dynamic dice formula, projectile counts (missiles/rays), static bonuses, and display tags based on Caster Level (CL)
  resolveSpellDynamicScaling(spell, casterLevel = 1) {
    if (!spell) {
      return {
        scaled: false,
        name: '',
        casterLevel: 1,
        projectiles: 0,
        projectileName: '',
        diceCount: 0,
        dieSides: 0,
        staticBonus: 0,
        diceFormula: '',
        dmgType: '',
        displayText: '',
        descDetail: ''
      };
    }

    const cl = Math.max(1, Number(casterLevel) || 1);
    const rawName = (spell.name || '').trim();
    const cleanName = rawName.toLowerCase();
    const dmgType = spell.dmgType || (cleanName.includes('fire') ? 'Fire' : (cleanName.includes('frost') || cleanName.includes('cold') ? 'Cold' : (cleanName.includes('acid') ? 'Acid' : (cleanName.includes('shock') || cleanName.includes('lightning') ? 'Electricity' : (cleanName.includes('magic missile') ? 'Force' : 'Spell Damage')))));

    // 1. MAGIC MISSILE (PHB p.251): 1 missile at CL 1, +1 missile per 2 levels beyond 1st, max 5 missiles at CL 9+ (1d4+1 per missile)
    if (cleanName.includes('magic missile') || cleanName.includes('büyü füzesi')) {
      const missiles = Math.min(5, Math.max(1, Math.floor((cl + 1) / 2)));
      const diceCount = missiles;
      const dieSides = 4;
      const staticBonus = missiles;
      const diceFormula = `${diceCount}d4+${staticBonus}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: missiles,
        projectileName: 'Missile',
        diceCount,
        dieSides,
        staticBonus,
        diceFormula,
        dmgType: 'Force',
        displayText: `${missiles} Missiles (${diceFormula} Force)`,
        descDetail: `CL ${cl}: Fires ${missiles} missiles (each dealing 1d4+1 Force)`
      };
    }

    // 2. SCORCHING RAY (PHB p.274): 1 ray (4d6 fire), +1 ray per 4 levels above 3rd (2 rays at 7th, 3 rays at 11th, max 3 rays)
    if (cleanName.includes('scorching ray') || cleanName.includes('yakıcı ışın')) {
      const rays = Math.min(3, Math.max(1, 1 + Math.floor(Math.max(0, cl - 3) / 4)));
      const diceCount = rays * 4;
      const dieSides = 6;
      const staticBonus = 0;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: rays,
        projectileName: 'Ray',
        diceCount,
        dieSides,
        staticBonus,
        diceFormula,
        dmgType: 'Fire',
        displayText: `${rays} Rays (${diceFormula} Fire)`,
        descDetail: `CL ${cl}: Fires ${rays} rays (each dealing 4d6 Fire)`
      };
    }

    // 3. SHOCKING GRASP (PHB p.279): 1d6 per level (max 5d6 electricity)
    if (cleanName.includes('shocking grasp')) {
      const diceCount = Math.min(5, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Touch',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Electricity',
        displayText: `${diceFormula} Electricity (+3 vs Metal)`,
        descDetail: `CL ${cl}: ${diceCount}d6 Electricity damage (max 5d6)`
      };
    }

    // 4. FIREBALL (PHB p.231) & LIGHTNING BOLT (PHB p.248): 1d6 per level (max 10d6)
    if (cleanName === 'fireball' || cleanName.includes('lightning bolt') || cleanName === 'alevtoptu') {
      const isWand = (spell.source || '').toLowerCase().includes('wand') || cleanName.includes('wand') || (spell.parent || '').toLowerCase().includes('wand');
      const effectiveCl = isWand ? Math.min(cl, 5) : cl;
      const diceCount = Math.min(10, Math.max(1, effectiveCl));
      const dieSides = 6;
      const fDmgType = cleanName.includes('lightning') ? 'Electricity' : 'Fire';
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Patlama',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: fDmgType,
        displayText: `${diceFormula} ${fDmgType}`,
        descDetail: `CL ${cl}: ${diceCount}d6 ${fDmgType} (Reflex half)`
      };
    }

    // 5. CONE OF COLD (PHB p.212): 1d6 per level (max 15d6 cold)
    if (cleanName.includes('cone of cold')) {
      const diceCount = Math.min(15, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Koni',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Cold',
        displayText: `${diceFormula} Cold`,
        descDetail: `CL ${cl}: ${diceCount}d6 Cold damage`
      };
    }

    // 6. CHAIN LIGHTNING (PHB p.208): 1d6 per level (max 20d6)
    if (cleanName.includes('chain lightning')) {
      const diceCount = Math.min(20, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Bolt',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Electricity',
        displayText: `${diceFormula} Electricity`,
        descDetail: `CL ${cl}: ${diceCount}d6 Electricity damage`
      };
    }

    // 7. DISINTEGRATE (PHB p.222): 2d6 per level (max 40d6)
    if (cleanName.includes('disintegrate')) {
      const diceCount = Math.min(40, Math.max(2, cl * 2));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Ray',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Untyped',
        displayText: `${diceFormula} Disintegration`,
        descDetail: `CL ${cl}: ${diceCount}d6 Disintegration damage (5d6 on successful Fort save)`
      };
    }

    // 8. POLAR RAY (PHB p.262): 1d6 per level (max 25d6 cold)
    if (cleanName.includes('polar ray')) {
      const diceCount = Math.min(25, Math.max(1, cl));
      const dieSides = 6;
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Polar Ray',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Cold',
        displayText: `${diceFormula} Cold`,
        descDetail: `CL ${cl}: ${diceCount}d6 Cold damage`
      };
    }

    // 9. SEARING LIGHT (PHB p.275):
    // Living: 1d8 / 2 CL (max 5d8), Undead: 1d6 / CL (max 10d6) or 1d8 / CL (max 10d8) if light vulnerable, Construct: 1d6 / 2 CL (max 5d6)
    if (cleanName.includes('searing light') || cleanName.includes('kavurucu ışık')) {
      let diceCount = 1, dieSides = 8, capDesc = '';
      if (cleanName.includes('ışığa hassas') || cleanName.includes('vulnerable')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 8;
        capDesc = `${diceCount}d8 (Light-Vulnerable Undead)`;
      } else if (cleanName.includes('undead')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 6;
        capDesc = `${diceCount}d6 (Undead)`;
      } else if (cleanName.includes('construct') || cleanName.includes('cansız')) {
        diceCount = Math.min(5, Math.max(1, Math.floor(cl / 2)));
        dieSides = 6;
        capDesc = `${diceCount}d6 (Construct / Inanimate)`;
      } else {
        diceCount = Math.min(5, Math.max(1, Math.floor(cl / 2)));
        dieSides = 8;
        capDesc = `${diceCount}d8 (Living Target)`;
      }
      const diceFormula = `${diceCount}d${dieSides}`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Divine Ray',
        diceCount,
        dieSides,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Divine / Light',
        displayText: `${diceFormula} Divine Light`,
        descDetail: `CL ${cl}: ${capDesc}`
      };
    }

    // 10. CURE / INFLICT SPELLS (Cure Light/Moderate/Serious/Critical)
    if (cleanName.includes('cure light') || cleanName.includes('inflict light')) {
      const bonus = Math.min(5, cl);
      const diceFormula = `1d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 1,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Healing / Positive' : 'Negative Energy',
        displayText: `${diceFormula} ${isCure ? 'Healing' : 'Damage'}`,
        descDetail: `CL ${cl}: 1d8+${bonus} (max +5)`
      };
    }
    if (cleanName.includes('cure moderate') || cleanName.includes('inflict moderate')) {
      const bonus = Math.min(10, cl);
      const diceFormula = `2d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 2,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Healing / Positive' : 'Negative Energy',
        displayText: `${diceFormula} ${isCure ? 'Healing' : 'Damage'}`,
        descDetail: `CL ${cl}: 2d8+${bonus} (max +10)`
      };
    }
    if (cleanName.includes('cure serious') || cleanName.includes('inflict serious')) {
      const bonus = Math.min(15, cl);
      const diceFormula = `3d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 3,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Healing / Positive' : 'Negative Energy',
        displayText: `${diceFormula} ${isCure ? 'Healing' : 'Damage'}`,
        descDetail: `CL ${cl}: 3d8+${bonus} (max +15)`
      };
    }
    if (cleanName.includes('cure critical') || cleanName.includes('inflict critical')) {
      const bonus = Math.min(20, cl);
      const diceFormula = `4d8+${bonus}`;
      const isCure = cleanName.includes('cure');
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        diceCount: 4,
        dieSides: 8,
        staticBonus: bonus,
        diceFormula,
        dmgType: isCure ? 'Healing / Positive' : 'Negative Energy',
        displayText: `${diceFormula} ${isCure ? 'Healing' : 'Damage'}`,
        descDetail: `CL ${cl}: 4d8+${bonus} (max +20)`
      };
    }

    // 11. RAY OF ENFEEBLEMENT (PHB p.269): 1d6 + 1 per 2 levels (max +5)
    if (cleanName.includes('ray of enfeeblement') || cleanName.includes('güçsüzleştirme')) {
      const bonus = Math.min(5, Math.floor(cl / 2));
      const diceFormula = bonus > 0 ? `1d6+${bonus}` : `1d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Ray',
        diceCount: 1,
        dieSides: 6,
        staticBonus: bonus,
        diceFormula,
        dmgType: 'STR Penalty',
        displayText: `${diceFormula} STR Penalty`,
        descDetail: `CL ${cl}: 1d6 + ${bonus} STR Penalty (max +5)`
      };
    }

    // 12. VAMPIRIC TOUCH (PHB p.298): 1d6 per 2 levels (max 10d6)
    if (cleanName.includes('vampiric touch')) {
      const diceCount = Math.min(10, Math.max(1, Math.floor(cl / 2)));
      const diceFormula = `${diceCount}d6`;
      return {
        scaled: true,
        name: rawName,
        casterLevel: cl,
        projectiles: 1,
        projectileName: 'Touch',
        diceCount,
        dieSides: 6,
        staticBonus: 0,
        diceFormula,
        dmgType: 'Negative / Temp HP',
        displayText: `${diceFormula} Negative Damage & Temp HP`,
        descDetail: `CL ${cl}: ${diceCount}d6 (max 10d6)`
      };
    }

    // 13. CANONICAL V2 DAMAGE PARTS EVALUATOR (spell.damageParts or Compendium entry)
    const dbSpell = (!Array.isArray(spell.damageParts) || spell.damageParts.length === 0)
      ? this.getMasterDbEntry(spell, 'Spell')
      : null;
    const v2DamageParts = (Array.isArray(spell.damageParts) && spell.damageParts.length > 0)
      ? spell.damageParts
      : (dbSpell && Array.isArray(dbSpell.damageParts) ? dbSpell.damageParts : []);

    if (v2DamageParts.length > 0) {
      const primaryPart = v2DamageParts[0];
      const rawDiceExpr = String(primaryPart.dice || '').trim();
      const evaluatedDice = String(this.evaluateFormula(rawDiceExpr, { cl, level: cl }) || rawDiceExpr).trim();
      const evaluatedBonus = Number(this.evaluateFormula(primaryPart.bonus || 0, { cl, level: cl })) || 0;
      const partType = primaryPart.type || dmgType;

      const parsed = evaluatedDice.match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
      if (parsed) {
        const diceCount = parseInt(parsed[1], 10) || 1;
        const dieSides = parseInt(parsed[2], 10) || 6;
        let staticBonus = evaluatedBonus;
        if (parsed[4]) {
          staticBonus += parsed[3] === '-' ? -parseInt(parsed[4], 10) : parseInt(parsed[4], 10);
        }
        const isScaled = rawDiceExpr.includes('@cl') || String(primaryPart.bonus || '').includes('@cl');
        const diceFormula = staticBonus !== 0
          ? `${diceCount}d${dieSides}${staticBonus > 0 ? '+' : ''}${staticBonus}`
          : `${diceCount}d${dieSides}`;
        return {
          scaled: isScaled,
          name: rawName,
          casterLevel: cl,
          projectiles: 1,
          diceCount,
          dieSides,
          staticBonus,
          diceFormula,
          dmgType: partType,
          damageParts: v2DamageParts,
          displayText: `${diceFormula} ${partType}`,
          descDetail: isScaled ? `CL ${cl}: ${diceFormula} ${partType}` : ''
        };
      }
    }

    return {
      scaled: false,
      name: rawName,
      casterLevel: cl,
      projectiles: 0,
      diceCount: 0,
      dieSides: 0,
      staticBonus: 0,
      diceFormula: '',
      dmgType,
      displayText: '',
      descDetail: ''
    };
  },

  // Evaluate or roll a Temp HP formula (supports flat numbers, @cl formulas, and dice like `1d8 + min(10, @cl)`)
  rollOrEvaluateTempHp(formulaOrVal, evalCtx = { cl: 1, level: 1, bab: 0, chaMod: 0 }) {
    if (formulaOrVal === undefined || formulaOrVal === null || formulaOrVal === '') {
      return { total: 0, rollDesc: '', isDice: false };
    }
    const rawStr = String(formulaOrVal).trim();
    if (!/\d*d\d+/i.test(rawStr)) {
      const flatVal = Math.max(0, Number(this.evaluateFormula(rawStr, evalCtx)) || parseInt(rawStr, 10) || 0);
      return { total: flatVal, rollDesc: flatVal > 0 ? `+${flatVal} Temp HP` : '', isDice: false };
    }
    const rolls = [];
    const replaced = rawStr.replace(/(\d*)d(\d+)/gi, (_, countStr, sidesStr) => {
      const cnt = Math.max(1, parseInt(countStr || '1', 10) || 1);
      const sides = Math.max(2, parseInt(sidesStr, 10) || 6);
      let sum = 0;
      const dieResults = [];
      for (let i = 0; i < cnt; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        sum += r;
        dieResults.push(r);
      }
      rolls.push(`${cnt}d${sides}[${dieResults.join(',')}]`);
      return String(sum);
    });
    const total = Math.max(0, Number(this.evaluateFormula(replaced, evalCtx)) || parseInt(replaced, 10) || 0);
    return {
      total,
      rollDesc: `${rolls.join(' + ')} ➔ +${total} Temp HP`,
      isDice: true
    };
  },

  // Format a single V2 modifier into a human-readable D&D 3.5e label
  formatBuffModifierLabel(mod, evalCtx = { cl: 1, level: 1, bab: 0, chaMod: 0 }) {
    if (!mod || !mod.target) return '';
    const hasFormula = mod.formula !== undefined && mod.formula !== null && String(mod.formula).trim() !== '';
    const rawExpr = hasFormula ? mod.formula : mod.value;
    const val = Number(this.evaluateFormula(rawExpr, evalCtx)) || Number(mod.value) || 0;
    if (val === 0) return '';
    const sign = val >= 0 ? `+${val}` : `${val}`;
    const bType = mod.type && mod.type !== 'untyped' && mod.type !== 'penalty'
      ? ` ${String(mod.type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
      : '';
    const t = String(mod.target).toLowerCase().trim();
    const targetLabelMap = {
      'ability.str': 'STR', 'str': 'STR',
      'ability.dex': 'DEX', 'dex': 'DEX',
      'ability.con': 'CON', 'con': 'CON',
      'ability.int': 'INT', 'int': 'INT',
      'ability.wis': 'WIS', 'wis': 'WIS',
      'ability.cha': 'CHA', 'cha': 'CHA',
      'ac.armor': 'Armor AC', 'ac.shield': 'Shield AC', 'ac.natural': 'Natural Armor',
      'ac.deflection': 'Deflection AC', 'ac.dodge': 'Dodge AC', 'ac.total': 'AC', 'ac': 'AC',
      'save.all': 'All Saves', 'saves.all': 'All Saves',
      'save.fort': 'Fortitude', 'save.ref': 'Reflex', 'save.will': 'Will',
      'attack.all': 'Attack', 'attack': 'Attack', 'attack.melee': 'Melee Attack', 'attack.ranged': 'Ranged Attack',
      'damage.weapon': 'Weapon Damage', 'damage.all': 'Damage', 'damage.melee': 'Melee Damage', 'damage.ranged': 'Ranged Damage',
      'initiative': 'Initiative', 'init': 'Initiative',
      'speed.land': 'ft Speed', 'speed': 'ft Speed', 'speed.fly': 'ft Fly Speed',
      'skill.all': 'All Skills', 'skills.all': 'All Skills',
      'hp.temp': 'Temp HP', 'hp.max': 'Max HP', 'casterlevel': 'Caster Level'
    };
    let tLabel = targetLabelMap[t];
    if (!tLabel) {
      if ( t.startsWith('skill.') || t.startsWith('skills.')) {
        tLabel = t.replace(/^skills?\./, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } else {
        tLabel = t.toUpperCase();
      }
    }
    const condSuffix = mod.condition ? ` (${String(mod.condition).trim()})` : '';
    return `${sign}${bType} ${tLabel}${condSuffix}`;
  },

  // Splatbook Buff Spells migrated to database/srd_spells.json (Canonical V2 Compendium)
  SPLATBOOK_BUFF_SPELLS: [],

  // Canonical V2 Spell Caster Level Bonus Resolver (Cleric Domains, Feats, Items & Buffs with `casterLevel.*` modifiers)
  getSpellCasterLevelBonus(spell, character = null) {
    if (!spell || !character) return { bonus: 0, sources: [] };

    const rawSpellName = String(typeof spell === 'string' ? spell : (spell.name || '')).trim();
    const baseLookupName = rawSpellName.replace(/\s*\((?:fire|cold|acid|electricity|sonic)\)\s*$/i, '').trim();
    const cleanName = baseLookupName.toLowerCase();
    const spellObj = typeof spell === 'object' ? spell : { name: rawSpellName };
    const dbEntry = this.getMasterDbEntry(spellObj, 'Spell') || this.getMasterDbEntry({ name: baseLookupName }, 'Spell') || {};

    // 1. Collect spell's school, subschool, and descriptors from V2 fields + built-in fallback sets
    const schoolStr = String(spellObj.school || spellObj.category || dbEntry.school || dbEntry.category || '').toLowerCase();
    const subschoolStr = String(spellObj.subschool || dbEntry.subschool || '').toLowerCase();
    const rawDesc = [
      Array.isArray(spellObj.descriptors) ? spellObj.descriptors.join(', ') : (spellObj.descriptors || ''),
      Array.isArray(dbEntry.descriptors) ? dbEntry.descriptors.join(', ') : (dbEntry.descriptors || ''),
      Array.isArray(spellObj.tags) ? spellObj.tags.join(', ') : '',
      Array.isArray(dbEntry.tags) ? dbEntry.tags.join(', ') : ''
    ].join(', ').toLowerCase();

    const descriptorSet = new Set();
    rawDesc.split(/[,;/|]+/).forEach(token => {
      const t = token.replace(/[\[\]()]/g, '').trim();
      if (t) descriptorSet.add(t);
    });

    // Extract bracketed descriptor or parenthesized subschool from school string if present (e.g. "Abjuration [Chaotic]", "Conjuration (Healing)")
    const bracketMatch = schoolStr.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      bracketMatch[1].split(/[,;/]+/).forEach(t => {
        const cleanT = t.trim();
        if (cleanT) descriptorSet.add(cleanT);
      });
    }
    let effectiveSubschool = subschoolStr;
    const parenMatch = schoolStr.match(/\(([^)]+)\)/);
    if (parenMatch && !effectiveSubschool) {
      effectiveSubschool = parenMatch[1].trim().toLowerCase();
    }

    // Built-in D&D 3.5e RAW fallback mapping in case character copy lacks descriptors/subschool before Compendium finishes loading
    const CHAOTIC_SPELLS = new Set(['protection from law', 'magic circle against law', 'chaos hammer', 'word of chaos', 'cloak of chaos', 'dispel law', 'summon monster (chaotic)']);
    const LAWFUL_SPELLS = new Set(['protection from chaos', 'magic circle against chaos', "order's wrath", 'dictum', 'shield of law', 'dispel chaos', 'calm emotions']);
    const GOOD_SPELLS = new Set(['protection from evil', 'magic circle against evil', 'aid', 'holy smite', 'holy word', 'holy aura', 'dispel evil', 'bless water', 'consecrate', 'hallow']);
    const EVIL_SPELLS = new Set(['protection from good', 'magic circle against good', 'unholy blight', 'blasphemy', 'unholy aura', 'dispel good', 'curse water', 'desecrate', 'unhallow', 'death knell', 'animate dead', 'create undead', 'create greater undead']);
    if (CHAOTIC_SPELLS.has(cleanName) || /\bagainst law\b/i.test(cleanName)) descriptorSet.add('chaotic');
    if (LAWFUL_SPELLS.has(cleanName) || /\bagainst chaos\b/i.test(cleanName)) descriptorSet.add('lawful');
    if (GOOD_SPELLS.has(cleanName) || /\bagainst evil\b/i.test(cleanName)) descriptorSet.add('good');
    if (EVIL_SPELLS.has(cleanName) || /\bagainst good\b/i.test(cleanName)) descriptorSet.add('evil');
    if (/^(cure|mass cure|heal|mass heal|regenerate|delay poison|neutralize poison|remove|restoration|lesser restoration|greater restoration)\b/i.test(cleanName) && !effectiveSubschool) {
      effectiveSubschool = 'healing';
    }

    // Check if Animate Objects is prepared via Chaos Domain (gets [Chaotic] descriptor per PHB p.186)
    if (cleanName === 'animate objects' && String(spellObj.domainSource || '').toLowerCase() === 'chaos') {
      descriptorSet.add('chaotic');
    }

    // 2. Harvest character's active Cleric Domains
    const domainNames = new Set();
    if (Array.isArray(character?.spellcasting?.domains)) {
      character.spellcasting.domains.forEach(d => {
        const cleanD = String(d || '').replace(/^Domain:\s*/i, '').trim();
        if (cleanD) domainNames.add(cleanD);
      });
    }
    const progList = Array.isArray(character?.levelProgression) ? character.levelProgression : [];
    const activeMaxLvl = Number(character?.level) || 0;
    progList.forEach((row, idx) => {
      if (!row || row.isPlanned || row.active === false) return;
      const rowLvl = Number(row.level) || (idx + 1);
      if (activeMaxLvl > 0 && rowLvl > activeMaxLvl) return;
      const combined = [
        ...(Array.isArray(row.specialAbilities) ? row.specialAbilities : []),
        ...(Array.isArray(row.feats) ? row.feats : [])
      ];
      combined.forEach(entry => {
        const m = String(entry || '').match(/^Domain:\s*(.+)$/i);
        if (m && m[1]) domainNames.add(m[1].trim());
      });
    });

    // Built-in Canonical V2 fallback modifiers for the 8 SRD domains that grant Caster Level bonuses
    const BUILTIN_DOMAIN_CL_MODS = {
      chaos: [{ target: 'casterLevel.chaotic', value: 1, type: 'untyped' }],
      evil: [{ target: 'casterLevel.evil', value: 1, type: 'untyped' }],
      good: [{ target: 'casterLevel.good', value: 1, type: 'untyped' }],
      law: [{ target: 'casterLevel.lawful', value: 1, type: 'untyped' }],
      healing: [{ target: 'casterLevel.healing', value: 1, type: 'untyped' }],
      knowledge: [{ target: 'casterLevel.divination', value: 1, type: 'untyped' }],
      artifice: [{ target: 'casterLevel.creation', value: 1, type: 'untyped' }],
      creation: [{ target: 'casterLevel.creation', value: 2, type: 'untyped' }]
    };

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const candidateModifiers = [];
    domainNames.forEach(domName => {
      const domLower = domName.toLowerCase();
      const srdDom = (comp && typeof comp.getDomain === 'function')
        ? comp.getDomain(domName)
        : null;
      const mods = (srdDom && Array.isArray(srdDom.modifiers) && srdDom.modifiers.length > 0)
        ? srdDom.modifiers
        : (BUILTIN_DOMAIN_CL_MODS[domLower] || []);
      const displayDom = domName.charAt(0).toUpperCase() + domName.slice(1);
      mods.forEach(mod => {
        if (mod && String(mod.target || '').startsWith('casterLevel')) {
          candidateModifiers.push({ ...mod, _sourceLabel: `${displayDom} Domain` });
        }
      });
    });

    // Also harvest any `casterLevel.*` V2 modifiers from active character feats, equipped items, and active buffs
    const extraSources = [
      ...(Array.isArray(character?.feats) ? character.feats.filter(f => f && f.active !== false).map(f => ({ entry: f, label: f.name || 'Feat' })) : []),
      ...(Array.isArray(character?.buffs) ? character.buffs.filter(b => b && b.active !== false).map(b => ({ entry: b, label: b.name || 'Buff' })) : [])
    ];
    extraSources.forEach(({ entry, label }) => {
      const dbFeat = (!Array.isArray(entry.modifiers) || entry.modifiers.length === 0)
        ? (this.getMasterDbEntry(entry) || {})
        : {};
      const mods = (Array.isArray(entry.modifiers) && entry.modifiers.length > 0)
        ? entry.modifiers
        : (Array.isArray(dbFeat.modifiers) ? dbFeat.modifiers : []);
      mods.forEach(mod => {
        if (mod && String(mod.target || '').startsWith('casterLevel')) {
          candidateModifiers.push({ ...mod, _sourceLabel: label });
        }
      });
    });

    // 3. Evaluate which `casterLevel.*` modifiers match this spell
    let totalBonus = 0;
    const matchedSources = [];
    candidateModifiers.forEach(mod => {
      const target = String(mod.target || '').trim().toLowerCase();
      const val = Number(mod.value) || 0;
      if (val === 0) return;

      let matches = false;
      if (target === 'casterlevel' || target === 'casterlevel.all') {
        matches = true;
      } else if (target === 'casterlevel.chaotic' || target === 'casterlevel.chaos') {
        matches = descriptorSet.has('chaotic') || descriptorSet.has('chaos');
      } else if (target === 'casterlevel.lawful' || target === 'casterlevel.law') {
        matches = descriptorSet.has('lawful') || descriptorSet.has('law');
      } else if (target === 'casterlevel.good') {
        matches = descriptorSet.has('good');
      } else if (target === 'casterlevel.evil') {
        matches = descriptorSet.has('evil');
      } else if (target === 'casterlevel.healing') {
        matches = effectiveSubschool.includes('healing') || descriptorSet.has('healing');
      } else if (target === 'casterlevel.creation') {
        matches = effectiveSubschool.includes('creation') || descriptorSet.has('creation');
      } else if (target === 'casterlevel.divination') {
        matches = schoolStr.includes('divination');
      } else if (target.startsWith('casterlevel.')) {
        const subKey = target.slice('casterlevel.'.length);
        matches = descriptorSet.has(subKey) || effectiveSubschool.includes(subKey) || schoolStr.includes(subKey);
      }

      if (matches) {
        totalBonus += val;
        matchedSources.push(`${mod._sourceLabel} (${val >= 0 ? '+' : ''}${val} CL)`);
      }
    });

    return { bonus: totalBonus, sources: matchedSources };
  },

  getSpellEffectiveCasterLevel(spell, character = null, baseCl = null) {
    const rawBase = Math.max(1, Number(baseCl || spell?.casterLevel || spell?.cl || character?.level) || 1);
    const { bonus } = this.getSpellCasterLevelBonus(spell, character);
    return Math.max(1, rawBase + bonus);
  },

  // Canonical V2 Active Cleric Domains Harvester (with Built-in Fallback for all 36 SRD Domains)
  getCharacterActiveDomainEntries(character = null) {
    if (!character) return [];
    const domainNames = new Set();
    if (Array.isArray(character?.spellcasting?.domains)) {
      character.spellcasting.domains.forEach(d => {
        const cleanD = String(d || '').replace(/^[⚜️\s]*Domain:\s*/i, '').trim();
        if (cleanD) domainNames.add(cleanD);
      });
    }
    const progList = Array.isArray(character?.levelProgression) ? character.levelProgression : [];
    const activeMaxLvl = Number(character?.level) || 0;
    progList.forEach((row, idx) => {
      if (!row || row.isPlanned || row.active === false) return;
      const rowLvl = Number(row.level) || (idx + 1);
      if (activeMaxLvl > 0 && rowLvl > activeMaxLvl) return;
      const combined = [
        ...(Array.isArray(row.specialAbilities) ? row.specialAbilities : []),
        ...(Array.isArray(row.feats) ? row.feats : [])
      ];
      combined.forEach(entry => {
        const rawEntry = typeof entry === 'string' ? entry : (entry?.name || '');
        const m = String(rawEntry || '').match(/Domain:\s*([^\n,;()]+)/i);
        if (m && m[1]) domainNames.add(m[1].trim());
      });
    });

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const entries = [];
    domainNames.forEach(domName => {
      const mdbDom = this.getMasterDbEntry(domName, 'Domain');
      const compDom = (comp && typeof comp.getDomain === 'function') ? comp.getDomain(domName) : null;
      const srdDom = mdbDom || compDom;
      entries.push({
        name: srdDom?.name || domName,
        modifiers: Array.isArray(srdDom?.modifiers) ? srdDom.modifiers : [],
        ruleFlags: { ...(srdDom?.ruleFlags || {}) },
        spellLikeAbilities: Array.isArray(srdDom?.grantedPower?.spellLikeAbilities)
          ? srdDom.grantedPower.spellLikeAbilities
          : [],
        description: srdDom?.grantedPower?.description || srdDom?.description || ''
      });
    });
    return entries;
  },

  // Canonical V2 Active Character Templates Harvester (`srd_templates.json` + Master DB)
  getCharacterActiveTemplateEntries(character = null) {
    if (!character) return [];
    const rawList = Array.isArray(character.templates)
      ? character.templates
      : (character.template ? [character.template] : []);
    if (rawList.length === 0) return [];

    const seenIds = new Set();
    const resolved = [];

    rawList.forEach(item => {
      if (!item) return;
      if (typeof item === 'object' && item.active === false) return;
      const query = typeof item === 'object' ? (item.id || item.name || '') : String(item).trim();
      if (!query) return;

      let tmpl = null;
      if (typeof window !== 'undefined' && window.SrdCompendium && typeof window.SrdCompendium.getTemplate === 'function') {
        tmpl = window.SrdCompendium.getTemplate(query);
      } else if (typeof SrdCompendium !== 'undefined' && typeof SrdCompendium.getTemplate === 'function') {
        tmpl = SrdCompendium.getTemplate(query);
      }
      if (!tmpl) {
        tmpl = this.getMasterDbEntry(item, 'Template') || this.getMasterDbEntry(query, 'Template');
      }
      if (!tmpl && typeof item === 'object' && Array.isArray(item.modifiers)) {
        tmpl = this.ensureV2Entry(item);
      }
      if (!tmpl) return;

      const key = String(tmpl.id || tmpl.name || query).toLowerCase();
      if (seenIds.has(key)) return;
      seenIds.add(key);
      resolved.push(tmpl);
    });

    return resolved;
  },

  // Canonical V2 Turn/Rebuke Undead, Elemental Turning & Cleric Domain Active Powers Resolver
  getTurnUndeadAndDomainPowers(character = null) {
    if (!character) return { hasTurnUndead: false, activeDomainPowers: [], elementalTurningPools: [] };
    const chaMod = this.getAbilityMod(character?.abilities?.cha || 10);
    const progList = Array.isArray(character?.levelProgression) ? character.levelProgression.filter(p => p && !p.isPlanned && p.active !== false) : [];
    let clericLvl = 0;
    let paladinLvl = 0;
    let dreadNecroLvl = 0;
    progList.forEach(p => {
      const cn = String(p.className || p.class || '').toLowerCase().trim();
      if (cn.includes('cleric') || cn.includes('rahip')) clericLvl++;
      else if (cn.includes('paladin')) paladinLvl++;
      else if (cn.includes('dread necromancer')) dreadNecroLvl++;
    });
    if (clericLvl > 0 && clericLvl === progList.length && Number(character.level) > progList.length) {
      clericLvl = Number(character.level);
    }
    if (clericLvl === 0 && paladinLvl === 0 && dreadNecroLvl === 0) {
      const cStr = String(character.classes || character.class || '').toLowerCase();
      if (cStr.includes('cleric') || cStr.includes('rahip')) clericLvl = Number(character.level) || 1;
      else if (cStr.includes('paladin')) paladinLvl = Number(character.level) || 1;
    }

    const allFeatsAndAbilities = [
      ...(Array.isArray(character.feats) ? character.feats : []),
      ...(Array.isArray(character.specialAbilities) ? character.specialAbilities : []),
      ...progList.flatMap(p => [...(p.feats || []), ...(p.specialAbilities || [])])
    ];

    const hasExplicitTurn = allFeatsAndAbilities.some(f => {
      const n = String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase();
      return n.includes('turn undead') || n.includes('rebuke undead');
    });
    const hasTurnUndead = clericLvl >= 1 || paladinLvl >= 4 || dreadNecroLvl >= 1 || hasExplicitTurn;
    const effectiveTurningLevel = clericLvl > 0
      ? clericLvl
      : (dreadNecroLvl > 0 ? dreadNecroLvl : (paladinLvl >= 4 ? (paladinLvl - 3) : (Number(character.level) || 1)));
    const domainCasterLvl = Math.max(1, clericLvl || Number(character.level) || 1);

    // Count Extra Turning (+4 uses per feat) from V2 `turnUndead` modifier or feat name
    let extraTurningUses = 0;
    const seenExtraTurning = new Set();
    (Array.isArray(character.feats) ? character.feats : []).forEach((f, idx) => {
      if (!f || f.active === false) return;
      const fName = String(typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim();
      const mods = Array.isArray(f.modifiers) ? f.modifiers : (this.getMasterDbEntry(f, 'Feat')?.modifiers || []);
      const turnMod = (mods || []).find(m => m && String(m.target || '').toLowerCase() === 'turnundead');
      if (turnMod) {
        extraTurningUses += Number(turnMod.value) || 4;
        seenExtraTurning.add(idx);
      } else if (fName.includes('extra turning')) {
        extraTurningUses += 4;
        seenExtraTurning.add(idx);
      }
    });
    if (extraTurningUses === 0) {
      progList.forEach(p => {
        (p.feats || []).forEach(f => {
          const fName = String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase().trim();
          if (fName.includes('extra turning')) extraTurningUses += 4;
        });
      });
    }

    // Active Domains: Check Glory (+2 turning check, +1d6 turning damage), Madness, and active 1/day powers
    const activeDomains = this.getCharacterActiveDomainEntries(character);
    let turningCheckBonus = 0;
    let turningDamageDiceBonus = 0;
    const turningBonusSources = [];

    // Knowledge (religion) 5+ ranks grants +2 Synergy bonus on Turn/Rebuke Undead checks (PHB p. 159)
    const knowRelSkill = (Array.isArray(character.skills) ? character.skills : []).find(sk => {
      const k = String(sk?.key || sk?.name || '').toLowerCase();
      return k.includes('religion') || k === 'knowledge_religion';
    });
    if (knowRelSkill && Number(knowRelSkill.ranks) >= 5) {
      turningCheckBonus += 2;
      turningBonusSources.push('Knowledge (Religion) 5+ Ranks (+2 Synergy)');
    }

    const elementalTurningPools = [];
    const activeDomainPowers = [];

    activeDomains.forEach(dom => {
      const domName = dom.name;
      (dom.modifiers || []).forEach(mod => {
        const t = String(mod?.target || '').toLowerCase();
        const v = Number(mod?.value) || 0;
        if (t === 'turning.check' && v !== 0) {
          turningCheckBonus += v;
          turningBonusSources.push(`${domName} Domain (+${v} Check)`);
        } else if (t === 'turning.damagedice' && v !== 0) {
          turningDamageDiceBonus += v;
          turningBonusSources.push(`${domName} Domain (+${v}d6 Damage)`);
        }
      });

      const rf = dom.ruleFlags || {};
      if (rf.turnEarth || rf.rebukeAir) {
        elementalTurningPools.push({ id: 'turn_air_domain', domain: domName, label: 'Turn Earth / Rebuke Air', icon: '🌪️', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }
      if (rf.turnAir || rf.rebukeEarth) {
        elementalTurningPools.push({ id: 'turn_earth_domain', domain: domName, label: 'Turn Air / Rebuke Earth', icon: '🪨', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }
      if (rf.turnWater || rf.rebukeFire) {
        elementalTurningPools.push({ id: 'turn_fire_domain', domain: domName, label: 'Turn Water / Rebuke Fire', icon: '🔥', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }
      if (rf.turnFire || rf.rebukeWater) {
        elementalTurningPools.push({ id: 'turn_water_domain', domain: domName, label: 'Turn Fire / Rebuke Water', icon: '🌊', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }
      if (rf.rebukePlant) {
        elementalTurningPools.push({ id: 'turn_plant_domain', domain: domName, label: 'Rebuke / Command Plants', icon: '🌿', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }
      if (rf.rebukeScalykind) {
        elementalTurningPools.push({ id: 'turn_scalykind_domain', domain: domName, label: 'Rebuke Reptiles & Snakes', icon: '🐍', maxUses: Math.max(1, 3 + chaMod + extraTurningUses) });
      }

      if (rf.featOfStrength) {
        activeDomainPowers.push({
          id: 'dom_strength_feat',
          domain: domName,
          name: 'Feat of Strength',
          icon: '💪',
          actionType: 'Free Action',
          maxUses: 1,
          durationText: '1 round',
          summary: `+${domainCasterLvl} Enhancement to STR for 1 round`,
          kind: 'buff',
          modifiers: [{ target: 'ability.str', value: domainCasterLvl, formula: String(domainCasterLvl), type: 'Enhancement', condition: null }]
        });
      }
      if (rf.protectiveWard) {
        activeDomainPowers.push({
          id: 'dom_protection_ward',
          domain: domName,
          name: 'Protective Ward',
          icon: '🛡️',
          actionType: 'Standard Action',
          maxUses: 1,
          durationText: '1 hour (next save)',
          summary: `+${domainCasterLvl} Resistance bonus on next saving throw`,
          kind: 'buff',
          modifiers: [{ target: 'save.all', value: domainCasterLvl, formula: String(domainCasterLvl), type: 'Resistance', condition: null }]
        });
      }
      if (rf.smiteAttack) {
        activeDomainPowers.push({
          id: 'dom_destruction_smite',
          domain: domName,
          name: 'Destruction Smite',
          icon: '⚔️',
          actionType: 'Free Action (Declare)',
          maxUses: 1,
          durationText: '1 round (single melee attack)',
          summary: `+4 Attack and +${domainCasterLvl} Damage on single melee attack`,
          kind: 'buff',
          modifiers: [
            { target: 'attack.all', value: 4, formula: '4', type: 'Untyped', condition: null },
            { target: 'damage.weapon', value: domainCasterLvl, formula: String(domainCasterLvl), type: 'Untyped', condition: null }
          ]
        });
      }
      if (rf.boostChaBy4OncePerDay) {
        activeDomainPowers.push({
          id: 'dom_charm_boost',
          domain: domName,
          name: 'Charm Boost (+4 CHA)',
          icon: '✨',
          actionType: 'Free Action',
          maxUses: 1,
          durationText: '1 min',
          summary: '+4 Untyped bonus to CHA for 1 minute',
          kind: 'buff',
          modifiers: [{ target: 'ability.cha', value: 4, formula: '4', type: 'Untyped', condition: null }]
        });
      }
      if (rf.freedomOfMovementRoundsPerDay) {
        activeDomainPowers.push({
          id: 'dom_travel_fom',
          domain: domName,
          name: 'Freedom of Movement (Travel)',
          icon: '🪽',
          actionType: 'Automatic / Free',
          maxUses: domainCasterLvl,
          unitLabel: 'rds/day',
          durationText: '1 round',
          summary: `Act normally regardless of magical impediments (${domainCasterLvl} rds/day)`,
          kind: 'buff',
          modifiers: [],
          ruleFlags: { freedomOfMovement: true }
        });
      }
      if (rf.goodFortuneReroll) {
        activeDomainPowers.push({
          id: 'dom_luck_reroll',
          domain: domName,
          name: 'Good Fortune (Reroll)',
          icon: '🍀',
          actionType: 'Immediate / Free',
          maxUses: 1,
          durationText: 'Instantaneous',
          summary: 'Reroll one roll just made before DM declares success or failure',
          kind: 'reroll'
        });
      }
      if (rf.deathTouch) {
        activeDomainPowers.push({
          id: `dom_${domName.toLowerCase()}_deathtouch`,
          domain: domName,
          name: `Death Touch (${domName})`,
          icon: '💀',
          actionType: 'Standard Action (Melee Touch)',
          maxUses: 1,
          durationText: 'Instantaneous',
          summary: `Roll ${domainCasterLvl}d6; if total >= target current HP, it dies (no save)`,
          kind: 'roll',
          formula: `${domainCasterLvl}d6`
        });
      }
      if (rf.greaterTurning) {
        activeDomainPowers.push({
          id: 'dom_sun_greater_turning',
          domain: domName,
          name: 'Greater Turning',
          icon: '☀️',
          actionType: 'Standard Action',
          maxUses: 1,
          durationText: 'Instantaneous',
          summary: 'Undead creatures that would be turned are destroyed instead (1/day)',
          kind: 'greater_turning'
        });
      }

      (dom.spellLikeAbilities || []).forEach(sla => {
        const slaName = String(sla?.name || '').trim();
        if (!slaName) return;
        const usesStr = String(sla?.uses || '1/day').trim();
        const usesLower = usesStr.toLowerCase();
        const wisScore = Number(abilityScores?.wis?.total ?? character?.stats?.wis?.score ?? 10);
        const wisMod = this.getAbilityModifier(wisScore);
        let parsedMaxUses = 1;
        let unitLabel = '/day';
        if (usesLower.includes('at will')) {
          parsedMaxUses = 99;
          unitLabel = 'At Will';
        } else if (usesLower.includes('cha')) {
          const baseNum = parseInt(usesLower, 10) || 3;
          parsedMaxUses = Math.max(1, baseNum + chaMod);
        } else if (usesLower.includes('wis')) {
          const baseNum = parseInt(usesLower, 10) || 3;
          parsedMaxUses = Math.max(1, baseNum + wisMod);
        } else if (usesLower.includes('level') || usesLower.includes('cleric')) {
          parsedMaxUses = Math.max(1, domainCasterLvl);
        } else {
          const numM = usesLower.match(/(\d+)/);
          if (numM) parsedMaxUses = Math.max(1, parseInt(numM[1], 10));
        }

        if (domName.toLowerCase() === 'nobility' || slaName.toLowerCase().includes('inspire allies')) {
          const durRds = Math.max(1, chaMod);
          activeDomainPowers.push({
            id: 'dom_nobility_inspire',
            domain: domName,
            name: 'Inspire Allies',
            icon: '👑',
            actionType: 'Standard Action',
            maxUses: parsedMaxUses,
            durationText: `${durRds} round${durRds > 1 ? 's' : ''}`,
            summary: `+2 Morale bonus on saving throws, attack rolls, ability/skill checks, and weapon damage (${durRds} rds)`,
            kind: 'buff',
            modifiers: [
              { target: 'save.all', value: 2, formula: '2', type: 'Morale', condition: null },
              { target: 'attack.all', value: 2, formula: '2', type: 'Morale', condition: null },
              { target: 'damage.weapon', value: 2, formula: '2', type: 'Morale', condition: null },
              { target: 'skill.all', value: 2, formula: '2', type: 'Morale', condition: null }
            ]
          });
        } else {
          const slaEntry = this.getMasterDbEntry(slaName, 'Special Ability') || this.getMasterDbEntry(slaName, 'Spell') || this.getMasterDbEntry(slaName, 'Feat');
          activeDomainPowers.push({
            id: `dom_${domName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_sla_${slaName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            domain: domName,
            name: `${slaName} (Sp)`,
            icon: '🔮',
            actionType: slaEntry?.action || 'Standard Action',
            maxUses: parsedMaxUses,
            unitLabel: unitLabel,
            durationText: slaEntry?.duration || `CL ${domainCasterLvl}`,
            summary: sla?.desc || slaEntry?.shortDescription || slaEntry?.benefit || slaEntry?.description || dom.description || `${domName} Domain Active Power (${usesStr} at CL ${domainCasterLvl})`,
            kind: (Array.isArray(slaEntry?.modifiers) && slaEntry.modifiers.length > 0) ? 'buff' : 'sla',
            modifiers: Array.isArray(slaEntry?.modifiers) ? JSON.parse(JSON.stringify(slaEntry.modifiers)) : [],
            damageParts: Array.isArray(slaEntry?.damageParts) ? JSON.parse(JSON.stringify(slaEntry.damageParts)) : [],
            spellName: slaName
          });
        }
      });
    });

    const maxDailyTurns = Math.max(1, 3 + chaMod + extraTurningUses);
    const totalCheckMod = chaMod + turningCheckBonus;
    const turningCheckFormula = `1d20${totalCheckMod >= 0 ? '+' + totalCheckMod : totalCheckMod}`;
    const totalDmgMod = effectiveTurningLevel + chaMod;
    const turningDamageFormula = `${2 + turningDamageDiceBonus}d6${totalDmgMod >= 0 ? '+' + totalDmgMod : totalDmgMod}`;

    return {
      hasTurnUndead,
      effectiveTurningLevel,
      domainCasterLvl,
      chaMod,
      extraTurningUses,
      turningCheckBonus,
      turningDamageDiceBonus,
      turningBonusSources,
      maxDailyTurns,
      turningCheckFormula,
      turningDamageFormula,
      elementalTurningPools,
      activeDomainPowers
    };
  },

  // Universal Canonical V2 Spell Buff Resolver (SRD + Splatbooks + Dynamic NLP Fallback)
  resolveSpellBuffSpec(spell, character = null, customCl = null) {
    if (!spell) return { isBuffSpell: false };
    const charLvl = Number(character?.level) || 1;
    const cl = (customCl !== null && customCl !== undefined)
      ? Math.max(1, Number(customCl) || 1)
      : this.getSpellEffectiveCasterLevel(spell, character, Number(spell.casterLevel || spell.cl || charLvl) || 1);
    const chaMod = this.getAbilityMod(character?.abilities?.cha || 10);
    const evalCtx = { cl, level: charLvl, bab: Number(character?.bab) || 0, chaMod };

    // Strip any appended energy choice suffix like "(Fire)" when looking up the canonical base spell
    const rawSpellName = String(spell.name || '').trim();
    const baseLookupName = rawSpellName.replace(/\s*\((?:fire|cold|acid|electricity|sonic)\)\s*$/i, '').trim();

    // 1. Merge with Canonical Compendium / Master DB Entry if character copy lacks V2 buff fields
    const dbEntry = this.getMasterDbEntry(spell, 'Spell') || this.getMasterDbEntry({ name: baseLookupName }, 'Spell') || {};
    const rawName = String(rawSpellName || dbEntry.name || '').trim();
    const cleanName = baseLookupName.toLowerCase();

    let modifiers = (Array.isArray(spell.modifiers) && spell.modifiers.length > 0)
      ? spell.modifiers
      : (Array.isArray(dbEntry.modifiers) && dbEntry.modifiers.length > 0 ? dbEntry.modifiers : []);
    let sizeModifier = spell.sizeModifier || dbEntry.sizeModifier || null;
    let tempHpFormula = spell.tempHpFormula || dbEntry.tempHpFormula || null;
    let ruleFlags = { ...(dbEntry.ruleFlags || {}), ...(spell.ruleFlags || {}) };
    let targetMode = spell.buffTargetMode || dbEntry.buffTargetMode || null;

    // 2.Determine Target Mode ('self', 'single', 'party', 'weapon') if not explicitly set
    const rangeRaw = String(spell.range || dbEntry.range || '').toLowerCase();
    const targetRaw = String(spell.target || dbEntry.target || spell.area || dbEntry.area || '').toLowerCase();
    if (!targetMode) {
      if (sizeModifier?.targetType === 'weapon' || targetRaw.includes('weapon')) {
        targetMode = 'weapon';
      } else if (rangeRaw.includes('personal') || targetRaw === 'you') {
        targetMode = 'self';
      } else if (targetRaw.includes('allies') || targetRaw.includes('one creature/level') || cleanName.includes('mass')) {
        targetMode = 'party';
      } else {
        targetMode = 'single';
      }
    }

    const hasBuffFlags = Boolean(
      ruleFlags.extraAttackFullAttack ||
      ruleFlags.babEqualsLevel ||
      ruleFlags.keen ||
      ruleFlags.primalSpell ||
      ruleFlags.heartSpell ||
      ruleFlags.energyChoice ||
      ruleFlags.energyResistanceFormula ||
      ruleFlags.energyProtectionPoolFormula ||
      ruleFlags.energyImmunity ||
      ruleFlags.concealment ||
      ruleFlags.missChance ||
      ruleFlags.rangedMissChance ||
      ruleFlags.mirrorImage ||
      ruleFlags.invisible ||
      ruleFlags.drAdamantine ||
      ruleFlags.drRangedMagic ||
      ruleFlags.drEvilOrGood ||
      ruleFlags.immuneFear ||
      ruleFlags.immuneDeathEffects ||
      ruleFlags.immuneMindAffecting ||
      ruleFlags.immuneMagicMissile ||
      ruleFlags.wardAlignment ||
      ruleFlags.sanctuary ||
      ruleFlags.spellImmunityLevel ||
      ruleFlags.freedomOfMovement ||
      ruleFlags.sr ||
      ruleFlags.srFormula ||
      ruleFlags.uncannyDodge ||
      ruleFlags.lowLightVision ||
      ruleFlags.seeInvisibility ||
      ruleFlags.trueSeeing ||
      ruleFlags.darkvision ||
      ruleFlags.flySpeed ||
      ruleFlags.airWalk ||
      ruleFlags.waterWalk ||
      ruleFlags.waterBreathing ||
      ruleFlags.passiveDefenseLabel
    );

    const isBuffSpell = (Array.isArray(modifiers) && modifiers.length > 0) || Boolean(sizeModifier) || Boolean(tempHpFormula) || hasBuffFlags;
    if (!isBuffSpell) {
      return { isBuffSpell: false };
    }

    // 4. Evaluate human-readable summary labels at current Caster Level
    const evaluatedLabels = [];
    modifiers.forEach(mod => {
      const lbl = this.formatBuffModifierLabel(mod, evalCtx);
      if (lbl) evaluatedLabels.push(lbl);
    });
    if (ruleFlags.babEqualsLevel) evaluatedLabels.push(`BAB = +${charLvl}`);
    if (ruleFlags.extraAttackFullAttack) evaluatedLabels.push('+1 Extra Attack');
    if (ruleFlags.keen) evaluatedLabels.push('Keen (2x Crit Range)');

    // Energy Choice Spells (Resist Energy, Protection from Energy, Energy Immunity)
    const chosenEnergy = spell.chosenEnergy || null;
    const energyLabel = chosenEnergy || 'Chosen Energy';
    let evaluatedEnergyRes = 0;
    let evaluatedProtectionPool = 0;
    if (ruleFlags.energyResistanceFormula) {
      evaluatedEnergyRes = cl >= 11 ? 30 : (cl >= 7 ? 20 : 10);
      evaluatedLabels.push(`Resist ${energyLabel} ${evaluatedEnergyRes}`);
    }
    if (ruleFlags.energyProtectionPoolFormula) {
      evaluatedProtectionPool = Math.min(120, cl * 12);
      evaluatedLabels.push(`Absorb ${energyLabel} (${evaluatedProtectionPool} HP)`);
    }
    if (ruleFlags.energyImmunity) {
      evaluatedLabels.push(`Immune to ${energyLabel}`);
    }

    // Damage Reduction Spells (Stoneskin, Protection from Arrows, Righteous Might, Iron Body)
    if (ruleFlags.drAdamantine) {
      const drPool = ruleFlags.drPoolFormula ? Math.min(150, cl * 10) : 0;
      if (drPool > 0) evaluatedProtectionPool = drPool;
      evaluatedLabels.push(drPool > 0 ? `DR ${ruleFlags.drAdamantine}/Adamantine (${drPool} HP)` : `DR ${ruleFlags.drAdamantine}/Adamantine`);
    }
    if (ruleFlags.drRangedMagic) {
      const drPool = ruleFlags.drPoolFormula ? Math.min(100, cl * 10) : 0;
      if (drPool > 0) evaluatedProtectionPool = drPool;
      evaluatedLabels.push(drPool > 0 ? `DR ${ruleFlags.drRangedMagic}/Magic vs Ranged (${drPool} HP)` : `DR ${ruleFlags.drRangedMagic}/Magic vs Ranged`);
    }
    if (ruleFlags.drEvilOrGood) {
      const drVal = cl >= 15 ? 9 : (cl >= 12 ? 6 : (cl >= 9 ? 3 : 0));
      if (drVal > 0) evaluatedLabels.push(`DR ${drVal}/Evil or Good`);
    }

    // Concealment, Miss Chance & Wards
    if (ruleFlags.concealment && !ruleFlags.passiveDefenseLabel) evaluatedLabels.push(`${ruleFlags.concealment}% Concealment`);
    if (ruleFlags.rangedMissChance) evaluatedLabels.push(`${ruleFlags.rangedMissChance}% Ranged Miss Chance`);
    if (ruleFlags.srFormula || ruleFlags.sr) {
      const srVal = ruleFlags.srFormula ? (12 + cl) : Number(ruleFlags.sr);
      if (srVal > 0) evaluatedLabels.push(`SR ${srVal}`);
    }
    if (ruleFlags.freedomOfMovement) evaluatedLabels.push('Freedom of Movement');
    if (ruleFlags.immuneDeathEffects) evaluatedLabels.push('Immune: Death & Neg. Energy');
    if (ruleFlags.immuneMagicMissile) evaluatedLabels.push('Immune: Magic Missile');
    if (ruleFlags.wardAlignment) evaluatedLabels.push(`Ward vs. ${ruleFlags.wardAlignment}`);
    if (ruleFlags.uncannyDodge) evaluatedLabels.push('Uncanny Dodge');
    if (ruleFlags.lowLightVision) evaluatedLabels.push('Low-Light Vision');
    if (ruleFlags.passiveDefenseLabel && !evaluatedLabels.includes(ruleFlags.passiveDefenseLabel)) {
      evaluatedLabels.push(ruleFlags.passiveDefenseLabel);
    }

    if (sizeModifier?.targetType === 'weapon') {
      const steps = sizeModifier.scaling?.type === 'per_caster_level'
        ? Math.min(sizeModifier.scaling.maxSteps || 5, Math.floor(cl / (sizeModifier.scaling.clDivisor || 4)))
        : (sizeModifier.scaling?.steps || 1);
      evaluatedLabels.push(`+${steps} Weapon Size Step(s)`);
    } else if (sizeModifier?.targetType === 'creature') {
      const steps = sizeModifier.scaling?.steps || 1;
      evaluatedLabels.push(`${steps > 0 ? '+' : ''}${steps} Creature Size`);
    }
    let evaluatedTempHp = 0;
    if (tempHpFormula) {
      if (!/\d*d\d+/i.test(String(tempHpFormula))) {
        evaluatedTempHp = Math.max(0, Number(this.evaluateFormula(tempHpFormula, evalCtx)) || 0);
        if (evaluatedTempHp > 0 && !evaluatedLabels.some(l => l.includes('Temp HP'))) {
          evaluatedLabels.push(`+${evaluatedTempHp} Temp HP`);
        }
      } else {
        const diceMatch = String(tempHpFormula).match(/(\d*d\d+)/i);
        const dicePart = diceMatch ? diceMatch[1] : '1d8';
        const restExpr = String(tempHpFormula).replace(/(\d*d\d+)/i, '0');
        const bonusVal = Math.max(0, Number(this.evaluateFormula(restExpr, evalCtx)) || 0);
        const previewDiceLabel = bonusVal > 0 ? `+${dicePart}+${bonusVal} Temp HP` : `+${dicePart} Temp HP`;
        if (!evaluatedLabels.some(l => l.includes('Temp HP'))) {
          evaluatedLabels.push(previewDiceLabel);
        }
      }
    }

    // 5. Evaluate Duration string at Caster Level
    const TEN_MIN_PER_LVL = new Set(['resist energy', 'resist energy, mass', 'mass resist energy', 'protection from energy', 'protection from energy, mass', 'mass protection from energy', 'barkskin', 'stoneskin', 'freedom of movement', 'heroism', 'air walk', 'water walk', 'magic circle against evil', 'magic circle against good', 'magic circle against law', 'magic circle against chaos', 'conviction', 'conviction, mass', 'mass conviction', 'see invisibility']);
    const ONE_HR_PER_LVL = new Set(['mage armor', 'greater mighty wallop', 'mighty wallop, greater', 'magic weapon, greater', 'greater magic weapon', 'magic vestment', 'protection from arrows', 'overland flight', 'darkvision', 'heart of air', 'heart of water', 'heart of earth', 'heart of fire']);
    const TWENTY_FOUR_HR = new Set(['primal hunter', 'primal instinct', 'primal senses', 'primal sense', 'primal speed', 'endure elements', 'energy immunity', 'mind blank', 'resistance, greater', 'greater resistance', 'resistance, superior', 'superior resistance', 'moment of prescience']);
    const fallbackDur = TWENTY_FOUR_HR.has(cleanName)
      ? '24 hours'
      : (ONE_HR_PER_LVL.has(cleanName) ? '1 hour/level' : (TEN_MIN_PER_LVL.has(cleanName) ? '10 min./level' : '1 min./level'));
    const rawDur = String(spell.duration || dbEntry.duration || fallbackDur).trim();
    let durationText = rawDur;
    if (/10\s*min\.?\/level/i.test(rawDur)) durationText = `${cl * 10} min`;
    else if (/\b1\s*min\.?\/level/i.test(rawDur)) durationText = `${cl} min`;
    else if (/24\s*hours?/i.test(rawDur)) durationText = '24 hr';
    else if (/\b1\s*(?:hour|hr)\.?\/level/i.test(rawDur)) durationText = `${cl} hr`;
    else if (/\b1\s*round\/level/i.test(rawDur)) durationText = `${cl} rounds`;

    return {
      isBuffSpell: true,
      id: spell.id || dbEntry.id || `buff-${cleanName.replace(/[^a-z0-9]+/g, '-')}`,
      name: baseLookupName || rawName,
      casterLevel: cl,
      targetMode,
      modifiers: JSON.parse(JSON.stringify(modifiers)),
      sizeModifier: sizeModifier ? JSON.parse(JSON.stringify(sizeModifier)) : null,
      tempHpFormula,
      evaluatedTempHp,
      evaluatedEnergyRes,
      evaluatedProtectionPool,
      ruleFlags: JSON.parse(JSON.stringify(ruleFlags)),
      evaluatedLabels,
      summaryText: evaluatedLabels.join(', ') || (spell.shortDescription || dbEntry.shortDescription || 'Active Spell Buff'),
      durationText
    };
  },

  // Central Recalculation Engine for Character State (Abilities, AC, Saves, Speed, Buffs) - Canonical V2
  recalculateCharacter(character, masterDb = [], tacticalOptions = {}) {
    if (!character) return;
    const options = tacticalOptions || {};

    // 0. Gatekeeper: Ensure Character Data is Canonical V2
    if (character.schemaVersion !== 2 && typeof window !== 'undefined' && window.SchemaMigrator) {
      window.SchemaMigrator.upgradeCharacterToV2(character);
    }

    const charLvl = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => l.active !== false).length : 1) || 1;
    const bab = Number(character.bab) || 0;
    const chaModForCtx = this.getAbilityMod(character.abilities?.cha || character.baseAbilities?.cha || 10);
    const evalContext = this.buildFormulaContext(character, { cl: charLvl, level: charLvl, bab, chaMod: chaModForCtx });

    const resolveStacks = (val) => (val !== undefined && val !== null && val !== '' && !Number.isNaN(Number(val))) ? Number(val) : 1;

    // V2.5 Unified Composable Lego Evaluation Pre-Pass (Synergy Auto-Unlocks, Entity Selector Mutations, Defenses, Resources, Modes)
    const rawPool = Array.isArray(masterDb) && masterDb.length > 0 ? masterDb : (Array.isArray(character.customDb) ? character.customDb : []);
    const explicitGrantTargetIds = new Set();
    const scanExplicitGrants = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (!item || typeof item !== 'object' || !Array.isArray(item.grants)) return;
        item.grants.forEach(g => {
          if (g && g.grantType === 'entity' && g.targetId) {
            const tid = String(g.targetId).toLowerCase().trim();
            explicitGrantTargetIds.add(tid);
            explicitGrantTargetIds.add(tid.split(':').pop());
          }
        });
      });
    };
    scanExplicitGrants(character.feats);
    scanExplicitGrants(character.specialAbilities);
    scanExplicitGrants(character.legoEntries);
    scanExplicitGrants(character.classFeatures);

    const candidatePool = rawPool.filter(e => {
      if (!e || typeof e !== 'object') return false;
      const eid = String(e.id || '').toLowerCase().trim();
      const eshort = eid.split(':').pop();
      if (eid && (explicitGrantTargetIds.has(eid) || (eshort && explicitGrantTargetIds.has(eshort)))) {
        return true;
      }
      if (!e.requires) return false;
      const catStr = String(e.type || e.category || e.sourceCategory || '').toLowerCase().trim();
      return Boolean(
        e.autoUnlock === true
        || e.isSynergy === true
        || e.isSynergyGrant === true
        || catStr === 'synergy'
      );
    });
    let legoEval = this.evaluateLegoCharacter(character, candidatePool);
    character.legoEvaluation = legoEval;
    character.evaluatedDefenses = legoEval.defenses;
    character.evaluatedResources = legoEval.resources;
    character.evaluatedModes = legoEval.modes;
    character.grantedCapabilities = legoEval.grantedCapabilities;

    const mutatedLegoMap = new Map();
    const activeLegoIdSet = new Set();
    const activeLegoNameSet = new Set();
    (legoEval.entries || []).forEach(le => {
      if (!le) return;
      if (le.id) {
        activeLegoIdSet.add(String(le.id).toLowerCase());
        activeLegoIdSet.add(String(le.id).toLowerCase().split(':').pop());
      }
      if (le.name) activeLegoNameSet.add(String(le.name).toLowerCase().trim());
      if (le._mutated || (Array.isArray(le.modifiers) && le.modifiers.length > 0)) {
        if (le.id) {
          mutatedLegoMap.set(String(le.id).toLowerCase(), le);
          mutatedLegoMap.set(String(le.id).toLowerCase().split(':').pop(), le);
        }
        if (le.name) mutatedLegoMap.set(String(le.name).toLowerCase().trim(), le);
      }
    });

    // 1. Ensure Base Abilities
    if (!character.baseAbilities) {
      character.baseAbilities = {
        str: character.abilities?.str || 10,
        dex: character.abilities?.dex || 10,
        con: character.abilities?.con || 10,
        int: character.abilities?.int || 10,
        wis: character.abilities?.wis || 10,
        cha: character.abilities?.cha || 10
      };
      if (character.bodySlots?.belt?.active && character.bodySlots.belt.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.str = Math.max(8, character.baseAbilities.str - 2);
      }
      if (character.bodySlots?.gloves?.active && character.bodySlots.gloves.name?.toLowerCase().includes('+2')) {
        character.baseAbilities.dex = Math.max(8, character.baseAbilities.dex - 2);
      }
    } else if (!character.hasCustomBaseAbilities) {
      if (character.bodySlots?.belt?.active && (character.bodySlots.belt.name || '').toLowerCase().includes('+2') && character.baseAbilities.str === 14) {
        character.baseAbilities.str = 12;
      }
      if (character.bodySlots?.gloves?.active && (character.bodySlots.gloves.name || '').toLowerCase().includes('+2') && character.baseAbilities.dex === 16) {
        character.baseAbilities.dex = 14;
      }
    }

    if (!Array.isArray(character.buffs)) {
      character.buffs = [];
    }

    // 2. Initialize Aggregation Buckets
    const armorBonuses = [];
    const shieldBonuses = [];
    const naturalBonuses = [];
    const deflectionBonuses = [];
    const dodgeBonuses = [];
    const saveBonusBuckets = {
      fort: [],
      ref: [],
      will: []
    };
    const abilityBuckets = {
      str: [],
      dex: [],
      con: [],
      int: [],
      wis: [],
      cha: []
    };
    const initBonusBuckets = [];

    let hasSteadfastDetermination = false;
    let hasShieldWard = false;
    let minMaxDex = null;
    let totalAcp = 0;
    let resistBonus = 0;
    let itemSpeedBonus = 0;
    let buffSpeedBonus = 0;
    let buffSpeedPenalty = 0;
    let swimSpeed = 0;
    let climbSpeed = 0;
    let flySpeed = 0;
    let bonusPowerPoints = 0;
    let grappleModBonus = 0;
    const bonusSpellSlotsByLevel = {};
    const conditionalAcBonuses = [];
    const conditionalSaveBonuses = [];
    let buffAcPenalty = 0;
    let buffSkillBonus = 0;
    let debuffHpPenalty = 0;
    let draconicToughnessHp = 0;
    let conditionLoseDexToAC = false;
    let conditionEffectiveDexZero = false;
    let conditionHalfSpeed = false;
    let activePrimalCount = 0;
    let activeHeartCount = 0;
    const activeConditionWarnings = [];

    // Universal Canonical V2 Modifiers Processor
    const applyV2Modifiers = (modifiers, sourceName, sourceCategory = 'item', customCtx = null) => {
      if (!Array.isArray(modifiers)) return;
      const ctx = customCtx || evalContext;

      modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const target = String(mod.target).trim().toLowerCase();
        if (mod.selector || target.startsWith('entity.')) return;
        const modWhen = mod.when || (mod.condition && typeof mod.condition === 'object' ? mod.condition : null);
        if (modWhen && !this.evaluatePredicate(modWhen, character, ctx)) return;
        const hasFormula = mod.formula !== undefined && mod.formula !== null && String(mod.formula).trim() !== '';
        const rawExpr = hasFormula ? mod.formula : mod.value;
        let val = Number(this.evaluateFormula(rawExpr, ctx)) || Number(mod.value) || 0;
        if (mod.cap !== undefined && mod.cap !== null && mod.cap !== '') {
          const capVal = Number(this.evaluateFormula(mod.cap, ctx));
          if (!Number.isNaN(capVal)) val = Math.min(val, capVal);
        }
        if (val === 0) return;
        const strCondition = (typeof mod.condition === 'string' && mod.condition.trim()) ? mod.condition.trim() : null;

        const mType = String(mod.type || (val < 0 ? 'penalty' : 'untyped')).trim();
        const mTypeLower = mType.toLowerCase();

        // Ability Scores (both `ability.str` and `str`)
        const statKey = target.startsWith('ability.') ? target.slice(8) : target;
        if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(statKey)) {
          const statType = (mTypeLower === 'untyped' && sourceCategory === 'item') ? 'Enhancement' : mType;
          abilityBuckets[statKey].push({ val, type: statType, source: sourceName });
          return;
        }

        // Armor Class (both `ac.*` and `ac` / `armor` / `shield` / `natural` / `deflection` / `dodge`)
        const acSub = target.startsWith('ac.') ? target.slice(3) : target;
        if (acSub === 'abilitymod' || acSub === 'base' || acSub === 'total') {
          return;
        }
        if (target === 'ac' || target.startsWith('ac.') || ['armor', 'shield', 'natural', 'deflection', 'dodge'].includes(acSub)) {
          if (sourceCategory === 'feat' && (acSub === 'shield' || mTypeLower === 'shield')) {
            const baseShield = shieldBonuses.find(b => (b.type || '').toLowerCase() === 'shield');
            const cleanSrc = sourceName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim() || sourceName;
            const targetMatch = cleanSrc.toLowerCase().match(/\((.*?)\)/);
            const targetShield = targetMatch ? targetMatch[1].trim().toLowerCase() : '';
            const baseSrcLower = baseShield ? String(baseShield.source || '').toLowerCase() : '';
            const shieldTypeMatches = Boolean(baseShield) && (
              !targetShield ||
              baseSrcLower.includes(targetShield) ||
              (targetShield.includes('heavy') && baseSrcLower.includes('heavy')) ||
              (targetShield.includes('light') && baseSrcLower.includes('light')) ||
              (targetShield.includes('buckler') && baseSrcLower.includes('buckler'))
            );
            if (shieldTypeMatches && (!mod.condition || /shield|buckler|wield/i.test(String(mod.condition)))) {
              const normSrc = cleanSrc.toLowerCase().startsWith('shield specialization') ? 'Shield Specialization' : cleanSrc;
              if (!shieldBonuses.some(b => b.source && b.source.toLowerCase() === normSrc.toLowerCase())) {
                shieldBonuses.push({ val, source: normSrc, type: 'untyped' });
              }
              return;
            }
            if (!mod.condition) {
              return;
            }
          }
          if (strCondition) {
            const acTypeLabel = acSub === 'deflection' || mTypeLower === 'deflection'
              ? 'Deflection'
              : (acSub === 'dodge' || mTypeLower === 'dodge'
                ? 'Dodge'
                : (acSub === 'natural' || mTypeLower.includes('natural')
                  ? 'Natural'
                  : (acSub === 'shield' || mTypeLower === 'shield'
                    ? 'Shield'
                    : (acSub === 'armor' || mTypeLower === 'armor' ? 'Armor' : (mType.charAt(0).toUpperCase() + mType.slice(1))))));
            conditionalAcBonuses.push({
              target: 'AC',
              val,
              type: acTypeLabel,
              condition: strCondition,
              source: sourceName
            });
            return;
          }
          if (val < 0 || mTypeLower === 'penalty') {
            buffAcPenalty += Math.abs(val);
          } else if (acSub === 'shield' || mTypeLower === 'shield') {
            shieldBonuses.push({ val, source: sourceName, type: 'Shield' });
          } else if (acSub === 'deflection' || mTypeLower === 'deflection') {
            deflectionBonuses.push({ val, source: sourceName, type: 'Deflection' });
          } else if (acSub === 'natural' || mTypeLower === 'natural' || mTypeLower === 'natural_armor_ench' || mTypeLower === 'natural_enhancement') {
            const natType = sourceCategory === 'template'
              ? 'template'
              : ((mTypeLower.includes('ench') || sourceName.toLowerCase().includes('barkskin') || sourceName.toLowerCase().includes('amulet of natural armor'))
                ? 'Natural_Armor_Ench'
                : 'Natural');
            naturalBonuses.push({ val, source: sourceName, type: natType });
          } else if (acSub === 'dodge' || mTypeLower === 'dodge' || mTypeLower === 'haste' || mTypeLower === 'insight' || mTypeLower === 'luck' || mTypeLower === 'sacred' || mTypeLower === 'profane' || mTypeLower === 'divine') {
            dodgeBonuses.push({ val, source: sourceName, type: mTypeLower === 'dodge' ? 'Dodge' : mType });
          } else {
            armorBonuses.push({ val, source: sourceName, type: 'Armor' });
          }
          return;
        }

        // Saving Throws (`save.all`, `saves.all`, `save.fort`, `fort`, etc.)
        const saveSub = target.replace(/^saves?\./, '');
        if (saveSub === 'all' || target === 'saves' || target === 'all_saves' || saveSub === 'fort' || saveSub === 'ref' || saveSub === 'will') {
          if (strCondition) {
            conditionalSaveBonuses.push({
              target: saveSub === 'all' || target === 'saves' || target === 'all_saves' ? 'All Saves' : saveSub.toUpperCase(),
              val,
              type: mType.charAt(0).toUpperCase() + mType.slice(1),
              condition: strCondition,
              source: sourceName
            });
            return;
          }
          if (saveSub === 'all' || target === 'saves' || target === 'all_saves') {
            saveBonusBuckets.fort.push({ val, type: mType, source: sourceName });
            saveBonusBuckets.ref.push({ val, type: mType, source: sourceName });
            saveBonusBuckets.will.push({ val, type: mType, source: sourceName });
            if (mTypeLower === 'resistance' && val > resistBonus) resistBonus = val;
            return;
          }
          saveBonusBuckets[saveSub].push({ val, type: mType, source: sourceName });
          return;
        }

        // Speed (`speed.swim`, `speed.climb`, `speed.fly` vs Land Speed `speed`, `speed.land`, `speed.all`)
        if (target === 'speed.swim') {
          if (val > swimSpeed) swimSpeed = val;
          return;
        }
        if (target === 'speed.climb') {
          if (val > climbSpeed) climbSpeed = val;
          return;
        }
        if (target === 'speed.fly') {
          if (val > flySpeed) flySpeed = val;
          return;
        }
        if (target === 'speed' || target.startsWith('speed.')) {
          if (val < 0 || mTypeLower === 'penalty') {
            buffSpeedPenalty += Math.abs(val);
          } else if (sourceCategory === 'item') {
            if (val > itemSpeedBonus) itemSpeedBonus = val;
          } else {
            if (val > buffSpeedBonus) buffSpeedBonus = val;
          }
          return;
        }

        // Psionic Power Points (`psionic.powerPoints`, `psionic`, `powerpoints`)
        if (target === 'psionic.powerpoints' || target === 'psionic' || target === 'powerpoints') {
          bonusPowerPoints += val;
          return;
        }

        // Bonus Spell Slots (`spellSlot.level1` .. `spellSlot.level9`)
        if (target.startsWith('spellslot.level')) {
          const slotLvl = parseInt(target.replace('spellslot.level', ''), 10);
          if (!isNaN(slotLvl) && slotLvl >= 0 && slotLvl <= 11) {
            bonusSpellSlotsByLevel[slotLvl] = (bonusSpellSlotsByLevel[slotLvl] || 0) + val;
          }
          return;
        }

        // Combat Maneuver / Grapple (`cmb`, `grapple`, `opposed.grapple`)
        if (target === 'cmb' || target === 'grapple' || target === 'opposed.grapple') {
          if (val > grappleModBonus) grappleModBonus = val;
          return;
        }

        // Initiative (`initiative`, `init`)
        if (target === 'initiative' || target === 'init') {
          initBonusBuckets.push({ val, type: mType, source: sourceName });
          return;
        }

        // Global Skill Modifiers
        if (target === 'skill.all' || target === 'skills.all' || target === 'skills') {
          buffSkillBonus += val;
          return;
        }

        // Max HP / Negative Level HP Adjustment
        if (target === 'hp.max' || target === 'hp') {
          if (val < 0) debuffHpPenalty += Math.abs(val);
          else draconicToughnessHp += val;
        }
      });
    };

    // 2.5. Collect Equipment Bonuses from active bodySlots
    let twoHandedConflict = null;
    let offHandSuppressed = false;
    let equippedArmorCategory = 'None';

    if (character.bodySlots && typeof character.bodySlots === 'object') {
      const mh = character.bodySlots.mainHand;
      const oh = character.bodySlots.offHand;
      const isDoubleValidPair = mh && oh && this.isDoubleWeapon(mh) && this.isOffHandWeaponHead(oh);
      const isMhTwoHand = mh && mh.name && mh.name !== '-' && this.isTwoHandedWeapon(mh) && !isDoubleValidPair;
      const isOhOccupied = oh && oh.active !== false && oh.name && oh.name !== '-';

      if (isMhTwoHand && isOhOccupied) {
        offHandSuppressed = true;
        twoHandedConflict = {
          mainHand: mh.name,
          offHand: oh.name,
          message: `⚠️ "${mh.name}" is a Two-Handed weapon! Per D&D 3.5e RAW, two-handed weapons require both hands to wield, so off-hand equipment ("${oh.name}") cannot be used simultaneously. Off-hand effects have been disabled.`
        };
      }
      character.twoHandedConflict = twoHandedConflict;

      Object.entries(character.bodySlots).forEach(([slotKey, slotData]) => {
        if (!slotData || slotData.active === false || !slotData.name || slotData.name === '-') return;
        if (slotKey === 'offHand' && offHandSuppressed) return;

        const mods = this.parseItemModifiers(slotData, masterDb, evalContext);
        if (!mods) return;

        if (slotKey === 'armor' || (mods.armor > 0 && mods.effectiveArmorCategory)) {
          equippedArmorCategory = mods.effectiveArmorCategory || 'Light';
        }

        if (mods.armor > 0) armorBonuses.push({ val: mods.armor, source: slotData.name, type: 'Armor' });
        if (mods.shield > 0) shieldBonuses.push({ val: mods.shield, source: slotData.name, type: 'Shield' });
        if (mods.natural > 0) naturalBonuses.push({ val: mods.natural, source: slotData.name, type: mods.naturalBonusType || mods.bonusType || 'Natural' });
        if (mods.deflection > 0) deflectionBonuses.push({ val: mods.deflection, source: slotData.name, type: 'Deflection' });
        if (mods.dodge > 0) dodgeBonuses.push({ val: mods.dodge, source: slotData.name, type: 'Dodge' });

        if (mods.maxDex !== null && mods.maxDex !== undefined) {
          if (minMaxDex === null || mods.maxDex < minMaxDex) minMaxDex = mods.maxDex;
        }
        if (mods.acp) totalAcp += mods.acp;
        if (mods.resistance > 0) {
          saveBonusBuckets.fort.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          saveBonusBuckets.ref.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          saveBonusBuckets.will.push({ val: mods.resistance, source: slotData.name, type: 'Resistance' });
          if (mods.resistance > resistBonus) resistBonus = mods.resistance;
        }
        if (mods.speed > 0 && mods.speed > itemSpeedBonus) itemSpeedBonus = mods.speed;

        const abilityBonusType = (mods.bonusType && mods.bonusType.toLowerCase() !== 'untyped') ? mods.bonusType : 'Enhancement';
        if (mods.str !== 0) abilityBuckets.str.push({ val: mods.str, type: abilityBonusType, source: slotData.name });
        if (mods.dex !== 0) abilityBuckets.dex.push({ val: mods.dex, type: abilityBonusType, source: slotData.name });
        if (mods.con !== 0) abilityBuckets.con.push({ val: mods.con, type: abilityBonusType, source: slotData.name });
        if (mods.int !== 0) abilityBuckets.int.push({ val: mods.int, type: abilityBonusType, source: slotData.name });
        if (mods.wis !== 0) abilityBuckets.wis.push({ val: mods.wis, type: abilityBonusType, source: slotData.name });
        if (mods.cha !== 0) abilityBuckets.cha.push({ val: mods.cha, type: abilityBonusType, source: slotData.name });
      });
    }

    // 3. Collect Active Buffs & Debuffs / Conditions (Canonical V2 modifiers & ruleFlags)
    const processedLegoSourceIds = new Set();
    const processedLegoSourceNames = new Set();
    const combinedBuffList = [
      ...(Array.isArray(character.buffs) ? character.buffs.filter(b => Boolean(b && b.active)) : []),
      ...(Array.isArray(character.activeLegoBuffs)
        ? character.activeLegoBuffs.filter(lb => lb && lb.active !== false && !character.buffs.some(b => b && (b.id === lb.id || (b.name && lb.name && b.name.toLowerCase() === lb.name.toLowerCase()))))
        : [])
    ];
    combinedBuffList.forEach(rawBuff => {
      if (!rawBuff) return;
      const buff = this.ensureV2Entry(rawBuff);
      if (buff.id) {
        processedLegoSourceIds.add(String(buff.id).toLowerCase());
        processedLegoSourceIds.add(String(buff.id).toLowerCase().split(':').pop());
      }
      if (buff.name) processedLegoSourceNames.add(String(buff.name).toLowerCase().trim());
      const buffCl = Number(buff.casterLevel || buff.cl || charLvl) || charLvl;
      const buffCtx = { ...evalContext, cl: buffCl, self: { stacks: resolveStacks(rawBuff.stacks !== undefined ? rawBuff.stacks : buff.stacks), invested: Number(buff.invested) || 0 } };

      // Auto-hydrate V2 modifiers & ruleFlags from canonical spell spec if missing or using legacy static/off-by-one formulas on a scaling or ward spell buff
      const isScalingSpellBuff = /^(divine favor|barkskin|shield of faith|conviction|mass conviction|conviction, mass|magic vestment|greater magic weapon|magic weapon, greater|greater magic fang|magic fang, greater)$/i.test(String(buff.name || '').trim());
      const isWardSpellBuff = /^(protection from (?:evil|good|law|chaos)|magic circle against (?:evil|good|law|chaos))$/i.test(String(buff.name || '').trim());
      const lacksFormulaOnScalingSpell = isScalingSpellBuff && Array.isArray(buff.modifiers) && buff.modifiers.some(m => !m || !String(m.formula || '').includes('@cl') || String(m.formula || '').includes('1 + floor(@cl / 3)'));
      const lacksConditionOnWardSpell = isWardSpellBuff && Array.isArray(buff.modifiers) && buff.modifiers.some(m => m && !m.condition);
      if (((!Array.isArray(buff.modifiers) || buff.modifiers.length === 0) || lacksFormulaOnScalingSpell || lacksConditionOnWardSpell) && !buff.negativeLevels && !buff.isCondition) {
        const cleanSpellQuery = { name: buff.name, id: String(buff.id || '').startsWith('spl-') ? buff.id : undefined };
        const resolvedSpec = this.resolveSpellBuffSpec(cleanSpellQuery, character, buffCl);
        if (resolvedSpec && resolvedSpec.isBuffSpell) {
          if (Array.isArray(resolvedSpec.modifiers) && resolvedSpec.modifiers.length > 0) {
            buff.modifiers = resolvedSpec.modifiers;
            rawBuff.modifiers = resolvedSpec.modifiers;
          }
          if (resolvedSpec.ruleFlags) {
            buff.ruleFlags = { ...(buff.ruleFlags || {}), ...resolvedSpec.ruleFlags };
            rawBuff.ruleFlags = buff.ruleFlags;
          }
          if (resolvedSpec.evaluatedTempHp > 0 && !rawBuff.grantedTempHp) {
            rawBuff.grantedTempHp = resolvedSpec.evaluatedTempHp;
            buff.grantedTempHp = resolvedSpec.evaluatedTempHp;
          }
        }
      }

      // Ensure active buff Temp HP is synced to character.hp.temp if not yet synced
      const buffTempHp = Number(rawBuff.grantedTempHp) || Number(buff.ruleFlags?.tempHp) || Number((buff.modifiers || []).find(m => m && String(m.target || '').toLowerCase() === 'hp.temp')?.value) || 0;
      if (buffTempHp > 0 && !rawBuff._tempHpSynced && character.hp) {
        rawBuff.grantedTempHp = buffTempHp;
        rawBuff._tempHpSynced = true;
        character.hp.temp = Math.max(Number(character.hp.temp) || 0, buffTempHp);
        character.hp._lastPlayerChangeTs = Math.max(Date.now(), (Number(character.hp?._lastDmUpdateTs) || 0) + 100);
      }

      if (buff.negativeLevels) {
        const negLvls = Number(buff.negativeLevels) || 0;
        if (negLvls > 0 && (!Array.isArray(buff.modifiers) || buff.modifiers.length === 0)) {
          debuffHpPenalty += negLvls * 5;
          saveBonusBuckets.fort.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          saveBonusBuckets.ref.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          saveBonusBuckets.will.push({ val: -negLvls, type: 'penalty', source: `${buff.name} (-${negLvls} Lvl)` });
          buffSkillBonus -= negLvls;
        }
      }

      // Weapon-targeted buffs (e.g. Greater Magic Weapon, Keen Edge on a specific weapon) apply in evaluateWeaponAttack
      if (!buff.targetWeapon) {
        applyV2Modifiers(buff.modifiers, buff.name || 'Buff', 'buff', buffCtx);
      }

      const rf = buff.ruleFlags || {};
      const bNameLower = String(buff.name || '').toLowerCase();
      if (rf.primalSpell || /^primal (hunter|instinct|senses?|speed)$/i.test(bNameLower)) {
        activePrimalCount++;
      }
      if (rf.heartSpell || /^heart of (air|water|earth|fire)$/i.test(bNameLower)) {
        activeHeartCount++;
      }
      if (rf.loseDexToAC) conditionLoseDexToAC = true;
      if (rf.effectiveDexZero) {
        conditionEffectiveDexZero = true;
        conditionLoseDexToAC = true;
      }
      if (rf.halfSpeed) conditionHalfSpeed = true;
      if (rf.actionRestriction || buff.isCondition || buff.isDebuff) {
        activeConditionWarnings.push({
          id: buff.id || buff.name,
          name: buff.name,
          icon: buff.icon || '⚠️',
          actionRestriction: rf.actionRestriction || null,
          summary: buff.summary || ''
        });
      }
    });
    character.activeConditionWarnings = activeConditionWarnings;
    character.primalSynergy = activePrimalCount >= 4
      ? 'Improved Uncanny Dodge (4/4 Primal Spells)'
      : (activePrimalCount >= 2 ? `Uncanny Dodge (${activePrimalCount}/4 Primal Spells)` : null);
    character.heartSynergy = activeHeartCount >= 4
      ? 'Moderate Fortification 50% (4/4 Heart Spells)'
      : (activeHeartCount >= 2 ? `Light Fortification 25% (${activeHeartCount}/4 Heart Spells)` : null);

    // 3.5. Evaluate Feats, Special Abilities & DM Boons (Canonical V2)
    const activeProgRows = Array.isArray(character.levelProgression)
      ? character.levelProgression.filter(r => r && r.active !== false)
      : [];
    const inactiveProgRows = Array.isArray(character.levelProgression)
      ? character.levelProgression.filter(r => r && r.active === false)
      : [];
    const stripFeatTag = (s) => String(s || '')
      .replace(/^(?:[\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F\s]+|\[.*?\]\s*)+/g, '')
      .toLowerCase()
      .trim();
    const activeProgFeatSet = new Set(activeProgRows.flatMap(r => [...(r.feats || []), ...(r.specialAbilities || [])].map(f => stripFeatTag(typeof f === 'string' ? f : (f?.name || '')))).filter(Boolean));
    const inactiveOnlyFeatSet = new Set(
      inactiveProgRows
        .flatMap(r => [...(r.feats || []), ...(r.specialAbilities || [])].map(f => stripFeatTag(typeof f === 'string' ? f : (f?.name || ''))))
        .filter(n => n && !activeProgFeatSet.has(n))
    );

    const allAbilitiesAndFeats = [
      ...(character.feats || []),
      ...(character.specialAbilities || [])
    ];
    const existingFeatNames = new Set(allAbilitiesAndFeats.map(f => stripFeatTag(typeof f === 'string' ? f : (f?.name || ''))).filter(Boolean));
    activeProgRows.forEach(r => {
      [...(r.feats || []), ...(r.specialAbilities || [])].forEach(fStr => {
        const clean = stripFeatTag(typeof fStr === 'string' ? fStr : (fStr?.name || ''));
        if (!clean || clean.startsWith('+1 stat') || clean.includes('stat:') || clean.includes('cl = level')) return;
        if (!existingFeatNames.has(clean)) {
          existingFeatNames.add(clean);
          allAbilitiesAndFeats.push(typeof fStr === 'string' ? { name: fStr, category: String(fStr).includes('Boon') ? 'DM Boon' : 'Feat' } : fStr);
        }
      });
    });

    allAbilitiesAndFeats.forEach(rawFeat => {
      if (!rawFeat) return;
      const featObj = typeof rawFeat === 'string' ? { name: rawFeat, category: 'Feat' } : this.ensureV2Entry(rawFeat);
      const rawName = String(featObj.name || '').trim();
      if (!rawName || rawName.startsWith('↳')) return;

      const cleanName = stripFeatTag(rawName);
      if (inactiveOnlyFeatSet.has(cleanName)) return;
      const dbEntry = this.getMasterDbEntry(featObj) || this.getMasterDbEntry(cleanName);
      const fIdLower = String(featObj.id || dbEntry?.id || '').toLowerCase();
      if (fIdLower) {
        processedLegoSourceIds.add(fIdLower);
        processedLegoSourceIds.add(fIdLower.split(':').pop());
      }
      processedLegoSourceNames.add(cleanName);
      processedLegoSourceNames.add(rawName.toLowerCase());

      // Check if Stage-2 Lego entity mutation modified this entry's modifiers
      const mutatedEntry = (fIdLower && (mutatedLegoMap.get(fIdLower) || mutatedLegoMap.get(fIdLower.split(':').pop()))) || mutatedLegoMap.get(cleanName);

      // Apply V2 modifiers from mutated Lego entry, feat object, or compendium entry
      let featMods = (mutatedEntry && Array.isArray(mutatedEntry.modifiers) && mutatedEntry.modifiers.length > 0)
        ? mutatedEntry.modifiers
        : ((Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0)
          ? featObj.modifiers
          : (dbEntry && Array.isArray(dbEntry.modifiers) ? dbEntry.modifiers : []));

      // Auto-hydrate legacy DM Boon entries (e.g. "DM Boon: HP +20", "DM Boon: Ride +4", "DM Boon: Natural Armor AC (+2 (+1/4 Lvl))") if saved without V2 modifiers or missing scaling formula
      const needsScalingFormulaHydration = (cleanName.includes('boon') || cleanName.includes('grant') || String(featObj.category || '').toLowerCase().includes('boon'))
        && /([+-]?\d+)\s*(?:\/|\bper\b|\bevery\b)\s*(\d+)?\s*(?:lvl|level|cl)s?\b/i.test(`${cleanName} ${featObj.benefit || featObj.description || ''}`)
        && !featMods.some(m => m && m.formula);
      if ((featMods.length === 0 || needsScalingFormulaHydration) && (cleanName.includes('boon') || cleanName.includes('grant') || String(featObj.category || '').toLowerCase().includes('boon'))) {
        if (typeof window !== 'undefined' && typeof window.synthesizeDmBoonFromQuery === 'function') {
          const synth = window.synthesizeDmBoonFromQuery(cleanName, featObj.benefit || featObj.description || '', 'DM Boon');
          if (synth && Array.isArray(synth.modifiers) && synth.modifiers.length > 0) {
            featMods = synth.modifiers;
          }
        }
        if (featMods.length === 0) {
          const hpBoonMatch = `${cleanName} ${featObj.benefit || ''}`.match(/\b(?:hit\s*points|hp)\b.*?([+-]?\d+)|([+-]?\d+)\s*(?:bonus\s*)?(?:hit\s*points|hp)\b/i);
          if (hpBoonMatch && !/=/.test(cleanName)) {
            const hpVal = parseInt(hpBoonMatch[1] || hpBoonMatch[2], 10);
            if (!isNaN(hpVal) && hpVal !== 0) {
              featMods = [{ target: 'hp', value: hpVal, type: 'untyped', condition: null }];
            }
          }
        }
        if (featMods.length > 0) {
          if (typeof rawFeat === 'object') rawFeat.modifiers = featMods;
          if (dbEntry && (!Array.isArray(dbEntry.modifiers) || dbEntry.modifiers.length === 0)) {
            dbEntry.modifiers = featMods;
          }
        }
      }

      // Avoid double-counting standard Toughness (+3 HP) when levelProgression already includes Toughness in character.hp.baseMax
      const modsToApply = (cleanName === 'toughness' && activeProgRows.length > 0)
        ? featMods.filter(m => !m || !['hp', 'hp.max'].includes(String(m.target || '').toLowerCase()))
        : featMods;
      const rawStacksVal = featObj.stacks !== undefined ? featObj.stacks : mutatedEntry?.stacks;
      const featSelfCtx = { ...evalContext, self: { stacks: resolveStacks(rawStacksVal), invested: Number(featObj.invested || mutatedEntry?.invested) || 0 } };
      applyV2Modifiers(modsToApply, rawName, 'feat', featSelfCtx);

      const rf = { ...(dbEntry?.ruleFlags || {}), ...(featObj.ruleFlags || {}) };
      const featTextLower = `${cleanName} ${featObj.benefit || featObj.description || dbEntry?.benefit || dbEntry?.description || ''}`.toLowerCase();
      if (rf.conToWillSave || cleanName.includes('steadfast determination') || (featTextLower.includes('constitution modifier') && featTextLower.includes('will save') && featTextLower.includes('instead of') && featTextLower.includes('wisdom'))) {
        hasSteadfastDetermination = true;
      }
      if ((rf.hpPerLevel || cleanName.includes('draconic toughness')) && !featMods.some(m => m && ['hp', 'hp.max'].includes(String(m.target || '').toLowerCase()))) {
        draconicToughnessHp += charLvl;
      }
      if (rf.dodgeBonus || cleanName === 'dodge') {
        if (!conditionalAcBonuses.some(c => (c.source || '').toLowerCase() === 'dodge')) {
          conditionalAcBonuses.push({
            target: 'AC',
            val: Number(rf.dodgeBonus) || 1,
            type: 'Dodge',
            condition: 'vs. Designated Opponent',
            source: 'Dodge'
          });
        }
      }
      if (rf.mobilityBonus || cleanName === 'mobility') {
        if (!conditionalAcBonuses.some(c => (c.source || '').toLowerCase() === 'mobility')) {
          conditionalAcBonuses.push({
            target: 'AC',
            val: Number(rf.mobilityBonus) || 4,
            type: 'Dodge',
            condition: 'vs. AoO from Movement',
            source: 'Mobility'
          });
        }
      }
      if (rf.shieldSpecialization || cleanName.startsWith('shield specialization')) {
        const baseShield = shieldBonuses.find(b => (b.type || '').toLowerCase() === 'shield');
        if (baseShield) {
          const targetMatch = cleanName.match(/\((.*?)\)/);
          const targetShield = targetMatch ? targetMatch[1].trim().toLowerCase() : '';
          const baseSrcLower = String(baseShield.source || '').toLowerCase();
          const isMatch = !targetShield
            || baseSrcLower.includes(targetShield)
            || (targetShield.includes('heavy') && baseSrcLower.includes('heavy'))
            || (targetShield.includes('light') && baseSrcLower.includes('light'))
            || (targetShield.includes('buckler') && baseSrcLower.includes('buckler'));
          if (isMatch && !shieldBonuses.some(b => b.source && b.source.toLowerCase().includes('shield specialization'))) {
            shieldBonuses.push({ val: 1, source: 'Shield Specialization', type: 'untyped' });
          }
          if (isMatch) {
            for (let i = conditionalAcBonuses.length - 1; i >= 0; i--) {
              if ((conditionalAcBonuses[i].source || '').toLowerCase().includes('shield specialization')) {
                conditionalAcBonuses.splice(i, 1);
              }
            }
          }
        }
      }
      if (rf.shieldToTouchAc || cleanName.startsWith('shield ward')) {
        hasShieldWard = true;
      }

      // Dynamic scaling natural armor boons (e.g. "Nat AC 2+1/4lvl") if not already in V2 modifiers
      if (featMods.length === 0 && (cleanName.includes('nat ac') || cleanName.includes('natural armor') || cleanName.includes('doğal zırh'))) {
        const desc = String(featObj.benefit || featObj.desc || featObj.description || dbEntry?.benefit || dbEntry?.description || '').toLowerCase();
        let natVal = this.evaluateScalingBonus(cleanName, charLvl) || this.evaluateScalingBonus(desc, charLvl);
        if (natVal > 0) {
          naturalBonuses.push({ val: natVal, source: rawName, type: 'Natural' });
        }
      }
    });

    // 3.6. Apply remaining V2.5 Lego entries (`character.legoEntries`, `classFeatures`, and Stage-1 `_autoUnlocked` synergies) not already processed above
    Object.values(character.bodySlots || {}).forEach(s => {
      if (s && s.active !== false) {
        if (s.id) {
          processedLegoSourceIds.add(String(s.id).toLowerCase());
          processedLegoSourceIds.add(String(s.id).toLowerCase().split(':').pop());
        }
        if (s.name) processedLegoSourceNames.add(String(s.name).toLowerCase().trim());
      }
    });
    (legoEval.entries || []).forEach(le => {
      if (!le) return;
      if (le._legoSource !== 'legoEntries' && le._legoSource !== 'classFeatures' && le._autoUnlocked !== true) {
        return;
      }
      const leId = String(le.id || '').toLowerCase();
      const leShort = leId.split(':').pop();
      const leName = stripFeatTag(le.name || '');
      if ((leId && (processedLegoSourceIds.has(leId) || (leShort && processedLegoSourceIds.has(leShort)))) || (leName && processedLegoSourceNames.has(leName))) {
        return;
      }
      if (leId) {
        processedLegoSourceIds.add(leId);
        if (leShort) processedLegoSourceIds.add(leShort);
      }
      if (leName) processedLegoSourceNames.add(leName);
      const leStacks = (le.stacks !== undefined && le.stacks !== null && le.stacks !== '' && !Number.isNaN(Number(le.stacks))) ? Number(le.stacks) : 1;
      const leInvested = (le.invested !== undefined && le.invested !== null && le.invested !== '' && !Number.isNaN(Number(le.invested))) ? Number(le.invested) : 0;
      const leCtx = { ...evalContext, self: { stacks: leStacks, invested: leInvested } };
      if (Array.isArray(le.modifiers) && le.modifiers.length > 0) {
        applyV2Modifiers(le.modifiers, le.name || le.id || 'Lego Entry', 'feat', leCtx);
      }
      (le.modes || []).forEach(mode => {
        if (mode && (String(mode.actionType || '').toLowerCase() === 'passive' || mode.isPassive) && Array.isArray(mode.modifiers) && mode.modifiers.length > 0) {
          applyV2Modifiers(mode.modifiers, le.name || le.id || 'Lego Entry', 'feat', leCtx);
        }
      });
    });

    // 3.8. Collect Slotless or Wondrous Gear Pool Items (e.g. Stone of Good Luck, Pale Green Ioun Stone)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(rawItem => {
        if (!rawItem || !rawItem.name) return;
        const item = this.ensureV2Entry(rawItem);
        const dbEntry = this.getMasterDbEntry(item);
        const isSlotless = (item.slot || dbEntry?.slot || '').toLowerCase().includes('slotless')
          || (item.category || '').toLowerCase() === 'other';
        if (!item.isEquipped && !item.equipped && !isSlotless) return;

        const itemMods = (Array.isArray(item.modifiers) && item.modifiers.length > 0)
          ? item.modifiers
          : (dbEntry && Array.isArray(dbEntry.modifiers) ? dbEntry.modifiers : []);
        // Only apply save/ability/luck modifiers for slotless/gearPool items that aren't already in bodySlots
        const inBodySlot = character.bodySlots && Object.values(character.bodySlots).some(s => s && s.active !== false && (s.id === item.id || s.name === item.name));
        if (!inBodySlot && itemMods.length > 0) {
          applyV2Modifiers(itemMods, item.name, 'item', evalContext);
        }
      });
    }

    // 3.9. Collect Racial Modifiers from Canonical V2 Race Entry (D&D 3.5e RAW)
    if (character.race) {
      const raceObj = this.getMasterDbEntry(character.race, 'Race');
      if (raceObj && Array.isArray(raceObj.modifiers)) {
        const raceLabel = `${raceObj.name || character.race} (Race)`;
        applyV2Modifiers(raceObj.modifiers, raceLabel, 'race', evalContext);
      }
      const rLower = String(character.race).toLowerCase();
      if (rLower.includes('dwarf')) {
        if (!conditionalAcBonuses.some(c => c.condition === 'vs. Giants')) {
          conditionalAcBonuses.push({ target: 'AC', val: 4, type: 'Dodge', condition: 'vs. Giants', source: `${character.race} (Race)` });
        }
        if (!conditionalSaveBonuses.some(c => c.condition === 'vs. Poison' && (c.source || '').includes('Race'))) {
          conditionalSaveBonuses.push({ target: 'All Saves', val: 2, type: 'Racial', condition: 'vs. Poison', source: `${character.race} (Race)` });
        }
        if (!conditionalSaveBonuses.some(c => c.condition === 'vs. Spells & Spell-Like Effects' && (c.source || '').includes('Race'))) {
          conditionalSaveBonuses.push({ target: 'All Saves', val: 2, type: 'Racial', condition: 'vs. Spells & Spell-Like Effects', source: `${character.race} (Race)` });
        }
      } else if (rLower.includes('gnome')) {
        if (!conditionalAcBonuses.some(c => c.condition === 'vs. Giants')) {
          conditionalAcBonuses.push({ target: 'AC', val: 4, type: 'Dodge', condition: 'vs. Giants', source: `${character.race} (Race)` });
        }
        if (!conditionalSaveBonuses.some(c => c.condition === 'vs. Illusions' && (c.source || '').includes('Race'))) {
          conditionalSaveBonuses.push({ target: 'All Saves', val: 2, type: 'Racial', condition: 'vs. Illusions', source: `${character.race} (Race)` });
        }
      } else if (rLower.includes('halfling')) {
        if (!conditionalSaveBonuses.some(c => c.condition === 'vs. Fear' && (c.source || '').includes('Race'))) {
          conditionalSaveBonuses.push({ target: 'All Saves', val: 2, type: 'Morale', condition: 'vs. Fear', source: `${character.race} (Race)` });
        }
      } else if (rLower.includes('elf') || rLower.includes('elven')) {
        if (!conditionalSaveBonuses.some(c => c.condition === 'vs. Enchantment Spells & Effects' && (c.source || '').includes('Race'))) {
          conditionalSaveBonuses.push({ target: 'All Saves', val: 2, type: 'Racial', condition: 'vs. Enchantment Spells & Effects', source: `${character.race} (Race)` });
        }
      }
    }

    // 3.92. Collect Character Template Modifiers (Canonical V2 `srd_templates.json`)
    const activeTemplateEntries = this.getCharacterActiveTemplateEntries(character);
    let totalLevelAdjustment = Number(this.getMasterDbEntry(character.race, 'Race')?.levelAdjustment) || 0;
    const templateSummary = {
      activeCount: activeTemplateEntries.length,
      names: [],
      ids: [],
      levelAdjustment: 0,
      crIncrease: 0,
      creatureType: null,
      hitDieOverride: null,
      dr: [],
      sr: 0,
      fastHealing: 0,
      turnResistance: 0,
      vision: [],
      immunities: [],
      resistances: [],
      specialAttacks: [],
      specialQualities: [],
      bonusFeats: [],
      damageParts: []
    };

    if (activeTemplateEntries.length > 0) {
      // Pre-compute template ability score adjustments so @chaMod in template modifiers (e.g. Ghost Deflection AC) reflects the new score
      let preCha = Number(character.baseAbilities?.cha || 10) + this.resolveBonusStacking(abilityBuckets.cha);
      activeTemplateEntries.forEach(tmpl => {
        if (!Array.isArray(tmpl?.modifiers)) return;
        tmpl.modifiers.forEach(m => {
          const t = String(m?.target || '').toLowerCase().trim();
          if ((t === 'ability.cha' || t === 'cha') && !m.condition) {
            preCha += Number(m.value) || 0;
          }
        });
      });
      const tmplEvalCtx = { ...evalContext, chaMod: this.getAbilityMod(preCha) };

      activeTemplateEntries.forEach(tmpl => {
        if (!tmpl) return;
        const tmplLabel = `${tmpl.name} (Template)`;
        templateSummary.names.push(tmpl.name);
        if (tmpl.id) templateSummary.ids.push(tmpl.id);
        const la = Number(tmpl.levelAdjustment ?? tmpl.ruleFlags?.levelAdjustment) || 0;
        const cr = Number(tmpl.crIncrease ?? tmpl.ruleFlags?.crIncrease) || 0;
        templateSummary.levelAdjustment += la;
        templateSummary.crIncrease += cr;
        totalLevelAdjustment += la;
        if (tmpl.creatureType) templateSummary.creatureType = tmpl.creatureType;
        if (tmpl.hitDieOverride) templateSummary.hitDieOverride = tmpl.hitDieOverride;
        if (tmpl.dr && !templateSummary.dr.includes(tmpl.dr)) templateSummary.dr.push(tmpl.dr);
        if (tmpl.sr || tmpl.ruleFlags?.srFormula) {
          const srExpr = tmpl.ruleFlags?.srFormula || tmpl.sr;
          const srVal = Number(this.evaluateFormula(srExpr, tmplEvalCtx)) || parseInt(srExpr, 10) || 0;
          if (srVal > templateSummary.sr) templateSummary.sr = srVal;
        }
        if (Number(tmpl.fastHealing) > templateSummary.fastHealing) {
          templateSummary.fastHealing = Number(tmpl.fastHealing);
        }
        if (Number(tmpl.turnResistance) > 0) {
          templateSummary.turnResistance += Number(tmpl.turnResistance);
        }
        if (Array.isArray(tmpl.vision)) {
          tmpl.vision.forEach(v => { if (v && !templateSummary.vision.includes(v)) templateSummary.vision.push(v); });
        }
        if (Array.isArray(tmpl.immunities)) {
          tmpl.immunities.forEach(im => { if (im && !templateSummary.immunities.includes(im)) templateSummary.immunities.push(im); });
        }
        if (Array.isArray(tmpl.resistances)) {
          tmpl.resistances.forEach(rs => { if (rs && !templateSummary.resistances.includes(rs)) templateSummary.resistances.push(rs); });
        }
        if (Array.isArray(tmpl.specialAttacks)) {
          tmpl.specialAttacks.forEach(sa => { if (sa && !templateSummary.specialAttacks.includes(sa)) templateSummary.specialAttacks.push(sa); });
        }
        if (Array.isArray(tmpl.specialQualities)) {
          tmpl.specialQualities.forEach(sq => { if (sq && !templateSummary.specialQualities.includes(sq)) templateSummary.specialQualities.push(sq); });
        }
        if (Array.isArray(tmpl.bonusFeats)) {
          tmpl.bonusFeats.forEach(bf => { if (bf && !templateSummary.bonusFeats.includes(bf)) templateSummary.bonusFeats.push(bf); });
        }
        if (Array.isArray(tmpl.damageParts)) {
          tmpl.damageParts.forEach(dp => { if (dp) templateSummary.damageParts.push(dp); });
        }
        if (Array.isArray(tmpl.modifiers) && tmpl.modifiers.length > 0) {
          applyV2Modifiers(tmpl.modifiers, tmplLabel, 'template', tmplEvalCtx);
        }
      });
    }
    character.levelAdjustment = totalLevelAdjustment;
    character.ecl = charLvl + totalLevelAdjustment;
    character.templateSummary = templateSummary;

    // 3.95. Collect Active Cleric Domain Modifiers (Canonical V2 `srd_domains.json`)
    const activeDomainEntries = this.getCharacterActiveDomainEntries(character);
    activeDomainEntries.forEach(dom => {
      if (dom && Array.isArray(dom.modifiers) && dom.modifiers.length > 0) {
        applyV2Modifiers(dom.modifiers, `${dom.name} Domain`, 'domain', evalContext);
      }
    });

    // 4. Resolve Stacking for Abilities (RAW: Same types take Math.max, untyped/dodge/racial stack)
    if (!character.abilities) character.abilities = {};
    character.abilitySources = abilityBuckets;
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
      const base = character.baseAbilities[stat] || 10;
      const bonusItems = abilityBuckets[stat];
      const netBonus = this.resolveBonusStacking(bonusItems);
      character.abilities[stat] = base + netBonus;
    });

    // BL2: Re-evaluate V2.5 Lego pipeline with post-Step-4 final abilities so abilityMod substitutions (Force of Personality, Canny Defense, etc.) use item/buff-modified ability scores
    legoEval = this.evaluateLegoCharacter(character, candidatePool, { precomputedAbilities: character.abilities });
    character.legoEvaluation = legoEval;
    character.evaluatedDefenses = legoEval.defenses;
    character.evaluatedResources = legoEval.resources;
    character.evaluatedModes = legoEval.modes;
    character.grantedCapabilities = legoEval.grantedCapabilities;

    // 4.5. Resolve Dynamic Hit Points (HP) based on Constitution Changes, Feats/Boons, Flaws, and Debuff Penalties
    const charFeatNames = [
      ...(character.feats || [])
        .map(f => stripFeatTag(typeof f === 'string' ? f : (f.name || '')))
        .filter(n => n && !inactiveOnlyFeatSet.has(n)),
      ...Array.from(activeProgFeatSet)
    ];
    const totalHD = Number(character.level) || (activeProgRows.length > 0 ? activeProgRows.length : 1);
    const hasFrail = charFeatNames.some(f => f.includes('flaw: frail') || f.includes('[flaw] frail') || f === 'frail' || f.endsWith(' frail'));
    const flawHpPenalty = hasFrail ? totalHD : 0;

    if (character.hp) {
      const effectiveConMod = this.getAbilityMod(character.abilities?.con || 10);
      const newConBonusHp = effectiveConMod * totalHD;

      if (character.hp.baseMax === undefined || character.hp.baseMax === null) {
        character.hp.baseMax = Math.max(1, (Number(character.hp.max) || 45) - (Number(character.hp.conBonusHp) || 0) - (Number(character.hp.bonusFeatHp) || 0) + flawHpPenalty + (Number(character.hp.debuffHpPenalty) || 0));
      }
      if (character.hp.conBonusHp === undefined || character.hp.conBonusHp === null) {
        character.hp.conBonusHp = newConBonusHp;
      }

      const prevConBonusHp = Number(character.hp.conBonusHp) || 0;
      const prevDebuffHp = Number(character.hp.debuffHpPenalty) || 0;
      const prevBonusHp = Number(character.hp.bonusFeatHp) || 0;
      const prevFlawPenalty = Number(character.hp.flawHpPenalty) || 0;
      const conHpDiff = newConBonusHp - prevConBonusHp;
      const debuffHpDiff = debuffHpPenalty - prevDebuffHp;
      const bonusHpDiff = draconicToughnessHp - prevBonusHp;
      const flawHpDiff = flawHpPenalty - prevFlawPenalty;
      const expectedMax = Math.max(1, Number(character.hp.baseMax) + newConBonusHp + draconicToughnessHp - flawHpPenalty - debuffHpPenalty);

      if (conHpDiff !== 0 || debuffHpDiff !== 0 || bonusHpDiff !== 0 || flawHpDiff !== 0 || character.hp._appliedFrail !== hasFrail || character.hp.max !== expectedMax) {
        const wasAtFullHp = (character.hp.max !== undefined && Number(character.hp.current) >= Number(character.hp.max));
        character.hp.conBonusHp = newConBonusHp;
        character.hp.debuffHpPenalty = debuffHpPenalty;
        character.hp.bonusFeatHp = draconicToughnessHp;
        character.hp.flawHpPenalty = flawHpPenalty;
        character.hp._appliedFrail = hasFrail;
        character.hp.max = expectedMax;
        if (wasAtFullHp && bonusHpDiff > 0 && conHpDiff === 0 && debuffHpDiff === 0 && flawHpDiff === 0) {
          character.hp.current = character.hp.max;
        } else {
          character.hp.current = Math.min(character.hp.max, (Number(character.hp.current) || character.hp.max) + conHpDiff + bonusHpDiff - flawHpDiff - debuffHpDiff);
        }
        if (character.hp.current < -10) {
          character.hp.current = -10;
        }
      }
    }

    // 5. Resolve AC Stacking
    const effectiveArmor = this.resolveBonusStacking(armorBonuses);
    const effectiveShield = this.resolveBonusStacking(shieldBonuses);
    const effectiveNatural = this.resolveBonusStacking(naturalBonuses);
    const effectiveDeflection = this.resolveBonusStacking(deflectionBonuses);
    let effectiveDodge = this.resolveBonusStacking(dodgeBonuses);

    // Tactical stance / combat mode dodge bonuses
    const combatExpertise = tacticalOptions.combatExpertise || 0;
    const fightingDefensively = tacticalOptions.fightingDefensively || false;
    const totalDefense = tacticalOptions.totalDefense || false;
    const charge = tacticalOptions.charge || false;

    // D&D 3.5e RAW (PHB p. 84, Tumble): 5+ ranks in Tumble increases Fighting Defensively dodge bonus to +3 and Total Defense to +6
    const skillList = Array.isArray(character.skills) ? character.skills : Object.values(character.skills || {});
    const tumbleSkill = skillList.find(s => s && s.name && s.name.toLowerCase() === 'tumble');
    const tumbleRanks = tumbleSkill ? (Number(tumbleSkill.ranks) || 0) : 0;
    const fightingDefDodge = tumbleRanks >= 5 ? 3 : 2;
    const totalDefDodge = tumbleRanks >= 5 ? 6 : 4;

    const maxAllowedCE = Math.min(5, bab);
    const effectiveCE = Math.min(maxAllowedCE, Math.max(0, combatExpertise));
    if (effectiveCE > 0) effectiveDodge += effectiveCE;
    if (fightingDefensively) effectiveDodge += fightingDefDodge;
    if (totalDefense) effectiveDodge += totalDefDodge;

    // Dex to AC capped by Max Dex & Condition Flags (Helpless / Paralyzed / Blinded / Stunned / Grappled)
    const fullDexMod = conditionEffectiveDexZero ? -5 : this.getAbilityMod(character.abilities.dex || 10);
    let effectiveDex = minMaxDex !== null ? Math.min(fullDexMod, minMaxDex) : fullDexMod;
    if (conditionLoseDexToAC) {
      effectiveDex = Math.min(0, effectiveDex);
      effectiveDodge = 0; // RAW D&D 3.5e: Any condition that makes you lose Dex bonus to AC also makes you lose Dodge bonuses
    }

    // AC Penalties
    let totalPenalty = buffAcPenalty;
    if (charge) totalPenalty += 2;
    if (charFeatNames.some(f => f.includes('flaw: vulnerable') || f === 'vulnerable')) {
      totalPenalty += 1;
    }

    const baseAC = 10;
    const sizeBonus = character.acBreakdown?.size || 0;

    // Reconcile V2.5 `ac.abilityMod` sub-component bonus / substitution (e.g. Canny Defense, Monk/Swordsage AC Bonus)
    let legoAcAbilityDelta = 0;
    const hasLegoAcAbiMod = (legoEval.entries || []).some(e =>
      (e.modifiers || []).concat((e.modes || []).filter(m => m && (m.actionType === 'passive' || m.isPassive)).flatMap(m => m.modifiers || []))
        .some(m => m && String(m.target || '').toLowerCase() === 'ac.abilitymod')
    );
    if (hasLegoAcAbiMod && legoEval.ac && typeof legoEval.ac.abilityMod === 'number') {
      legoAcAbilityDelta = Math.max(0, legoEval.ac.abilityMod - fullDexMod);
    }

    let totalAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + effectiveDex + legoAcAbilityDelta + effectiveDodge;
    let touchAC = baseAC + (hasShieldWard ? effectiveShield : 0) + effectiveDeflection + sizeBonus + effectiveDex + legoAcAbilityDelta + effectiveDodge;

    // Flat-footed AC (RAW: retain negative Dex penalty even when flat-footed; retain Dex & Dodge if Uncanny Dodge unless immobilized/helpless)
    const hasUncannyDodge = !conditionEffectiveDexZero && (
      activePrimalCount >= 2 ||
      (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge')) ||
      (character.buffs || []).some(b => b && b.active && b.ruleFlags?.uncannyDodge)
    );
    const flatDex = hasUncannyDodge ? (effectiveDex + legoAcAbilityDelta) : Math.min(0, fullDexMod);
    const flatDodge = hasUncannyDodge ? effectiveDodge : 0;
    let flatAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + flatDex + flatDodge;

    // BL1: Reconcile V2.5 `ac.base` / `ac.total` replacements BEFORE subtracting totalPenalty, respecting `rep.affects`
    if (legoEval.ac && Array.isArray(legoEval.ac.replacements) && legoEval.ac.replacements.length > 0) {
      legoEval.ac.replacements.forEach(rep => {
        const aff = Array.isArray(rep.affects) ? rep.affects : ['normal', 'touch', 'flatFooted'];
        const v = Number(rep.value) || 0;
        if (rep.op === 'replace' || rep.op === 'set') {
          if (aff.includes('normal')) totalAC = v;
          if (aff.includes('touch')) touchAC = v;
          if (aff.includes('flatFooted')) flatAC = v;
        } else if (rep.op === 'max') {
          if (aff.includes('normal')) totalAC = Math.max(totalAC, v);
          if (aff.includes('touch')) touchAC = Math.max(touchAC, v);
          if (aff.includes('flatFooted')) flatAC = Math.max(flatAC, v);
        }
      });
    }

    totalAC -= totalPenalty;
    touchAC -= totalPenalty;
    flatAC -= totalPenalty;

    character.acBreakdown = {
      armor: effectiveArmor,
      shield: effectiveShield,
      natural: effectiveNatural,
      deflection: effectiveDeflection,
      size: sizeBonus,
      dodge: effectiveDodge,
      effectiveDex: effectiveDex,
      maxDex: minMaxDex,
      acp: totalAcp,
      penalty: totalPenalty,
      total: totalAC,
      touch: touchAC,
      flat: flatAC,
      flatFooted: flatAC,
      armorCategory: equippedArmorCategory,
      loseDexToAC: conditionLoseDexToAC,
      effectiveDexZero: conditionEffectiveDexZero,
      sources: {
        armor: armorBonuses,
        shield: shieldBonuses,
        natural: naturalBonuses,
        deflection: deflectionBonuses,
        dodge: dodgeBonuses
      },
      conditionalBonuses: conditionalAcBonuses
    };
    character.conditionalAcBonuses = conditionalAcBonuses;

    if (character.isNpc && character.ac && character.ac.total) {
      character.acBreakdown.total = character.ac.total;
      character.acBreakdown.touch = character.ac.touch !== undefined ? character.ac.touch : character.ac.total;
      character.acBreakdown.flat = character.ac.flatFooted !== undefined ? character.ac.flatFooted : character.ac.total;
    }

    // 6. Resolve Saving Throws
    const conMod = this.getAbilityMod(character.abilities.con || 10);
    const dexMod = conditionEffectiveDexZero ? -5 : this.getAbilityMod(character.abilities.dex || 10);
    const wisMod = this.getAbilityMod(character.abilities.wis || 10);
    const intMod = this.getAbilityMod(character.abilities.int || 10);

    const baseFort = character.baseSaves?.fort || 0;
    const baseRef = character.baseSaves?.ref || 0;
    const baseWill = character.baseSaves?.will || 0;

    if (!character.saveBonuses) character.saveBonuses = {};
    character.saveBonuses.resistance = resistBonus;

    // Ensure Great Fortitude / Lightning Reflexes / Iron Will apply even if stored as plain strings
    if (charFeatNames.some(f => f.includes('great fortitude')) && !saveBonusBuckets.fort.some(b => (b.source || '').toLowerCase().includes('great fortitude'))) {
      saveBonusBuckets.fort.push({ val: 2, type: 'Untyped', source: 'Great Fortitude' });
    }
    if (charFeatNames.some(f => f.includes('lightning reflexes')) && !saveBonusBuckets.ref.some(b => (b.source || '').toLowerCase().includes('lightning reflexes'))) {
      saveBonusBuckets.ref.push({ val: 2, type: 'Untyped', source: 'Lightning Reflexes' });
    }
    if (charFeatNames.some(f => f.includes('iron will')) && !saveBonusBuckets.will.some(b => (b.source || '').toLowerCase().includes('iron will'))) {
      saveBonusBuckets.will.push({ val: 2, type: 'Untyped', source: 'Iron Will' });
    }
    if (charFeatNames.some(f => f.includes('flaw: poor reflexes') || f === 'poor reflexes')) {
      saveBonusBuckets.ref.push({ val: -2, type: 'penalty', source: 'Flaw: Poor Reflexes' });
    }

    const miscSaveBonus = (character.saveBonuses?.bonus || 0) + (character.saveBonuses?.misc || 0);
    if (miscSaveBonus > 0) {
      saveBonusBuckets.fort.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.ref.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
      saveBonusBuckets.will.push({ val: miscSaveBonus, type: 'Untyped', source: 'Misc Save Bonus' });
    }

    // Battle Clarity (Warblade 1): Add INT modifier (max Warblade lvl) to Reflex saves when not flat-footed
    const charClassNames = (character.classes || '').toLowerCase();
    const isWarblade = charClassNames.includes('warblade') || (Array.isArray(character.levelProgression) && character.levelProgression.some(l => (l.className || '').toLowerCase().includes('warblade')));
    const hasBattleClarity = (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : (a.name || '')).toLowerCase().includes('battle clarity')) || isWarblade;
    const warbladeLvl = (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => (l.className || '').toLowerCase().includes('warblade')).length : 0) || (isWarblade ? 1 : 0);
    const battleClarityBonus = (hasBattleClarity && !conditionLoseDexToAC) ? Math.min(warbladeLvl, Math.max(0, intMod)) : 0;

    const netBonusFort = this.resolveBonusStacking(saveBonusBuckets.fort);
    const netBonusRef = this.resolveBonusStacking(saveBonusBuckets.ref) + battleClarityBonus;
    const netBonusWill = this.resolveBonusStacking(saveBonusBuckets.will);

    if (charFeatNames.some(f => f.includes('steadfast determination'))) {
      hasSteadfastDetermination = true;
    }

    const hasLegoSaveAbiMod = (saveKey) => (legoEval.entries || []).some(e =>
      (e.modifiers || []).concat((e.modes || []).filter(m => m && (m.actionType === 'passive' || m.isPassive)).flatMap(m => m.modifiers || []))
        .some(m => m && String(m.target || '').toLowerCase() === `save.${saveKey}.abilitymod`)
    );

    const fortStatMod = (hasLegoSaveAbiMod('fort') && legoEval.saves?.abilityMods?.fort !== undefined)
      ? legoEval.saves.abilityMods.fort
      : conMod;
    const refStatMod = (hasLegoSaveAbiMod('ref') && legoEval.saves?.abilityMods?.ref !== undefined)
      ? legoEval.saves.abilityMods.ref
      : dexMod;
    const willStatMod = (hasLegoSaveAbiMod('will') && legoEval.saves?.abilityMods?.will !== undefined)
      ? legoEval.saves.abilityMods.will
      : (hasSteadfastDetermination ? conMod : wisMod);

    const finalFort = baseFort + fortStatMod + netBonusFort;
    const finalRef = baseRef + refStatMod + netBonusRef;
    const finalWill = baseWill + willStatMod + netBonusWill;

    character.evaluatedSaves = {
      fort: finalFort,
      ref: finalRef,
      will: finalWill,
      bonusFort: netBonusFort,
      bonusRef: netBonusRef,
      bonusWill: netBonusWill,
      battleClarityBonus: battleClarityBonus,
      hasSteadfastDetermination: hasSteadfastDetermination,
      willAbility: hasSteadfastDetermination ? 'CON' : 'WIS',
      willAbilityMod: willStatMod
    };

    if (!character.isNpc) {
      if (!character.saves || typeof character.saves !== 'object') character.saves = {};
      character.saves.fort = { ...(character.saves.fort || {}), base: baseFort, ability: fortStatMod, magic: resistBonus, misc: netBonusFort - resistBonus, total: finalFort };
      character.saves.ref = { ...(character.saves.ref || {}), base: baseRef, ability: refStatMod, magic: resistBonus, misc: netBonusRef - resistBonus, total: finalRef };
      character.saves.will = { ...(character.saves.will || {}), base: baseWill, ability: willStatMod, abilityKey: hasSteadfastDetermination ? 'con' : 'wis', magic: resistBonus, misc: netBonusWill - resistBonus, total: finalWill };
    } else if (character.saves) {
      if (character.saves.fort?.total !== undefined) character.evaluatedSaves.fort = character.saves.fort.total;
      if (character.saves.ref?.total !== undefined) character.evaluatedSaves.ref = character.saves.ref.total;
      if (character.saves.will?.total !== undefined) character.evaluatedSaves.will = character.saves.will.total;
    }

    // 7. Resolve Effective Speed (RAW D&D 3.5e Table 8-2: Armor and Speed + Condition Half-Speed)
    const baseSpeed = character.baseSpeed || 30;
    const isDwarf = (character.race || '').toLowerCase().includes('dwarf');
    let armorSpeedPenalty = 0;
    if (!isDwarf && (equippedArmorCategory === 'Medium' || equippedArmorCategory === 'Heavy')) {
      armorSpeedPenalty = (baseSpeed > 20) ? 10 : 5;
    }
    let calcSpeed = Math.max(5, baseSpeed - armorSpeedPenalty + itemSpeedBonus + buffSpeedBonus - buffSpeedPenalty);
    if (conditionHalfSpeed) {
      calcSpeed = Math.max(5, Math.floor(calcSpeed / 10) * 5 || 5);
    }
    character.effectiveSpeed = calcSpeed;
    character.swimSpeed = swimSpeed;
    character.climbSpeed = climbSpeed;
    character.flySpeed = flySpeed;
    character.bonusPowerPoints = bonusPowerPoints;
    character.bonusSpellSlotsByLevel = bonusSpellSlotsByLevel;
    character.conditionalSaveBonuses = conditionalSaveBonuses;
    character.effectiveArmorCategory = equippedArmorCategory;
    character.buffSkillBonus = buffSkillBonus;
    character.buffInitiativeBonus = this.resolveBonusStacking(initBonusBuckets);
    character.initiativeBreakdown = initBonusBuckets;

    // 8. Resolve Rule Flags & Action Economy
    character.ruleFlags = this.evaluateRuleFlags(character);
    if (grappleModBonus > (character.ruleFlags?.opposedCheckBonus?.grapple || 0)) {
      if (!character.ruleFlags.opposedCheckBonus) character.ruleFlags.opposedCheckBonus = {};
      character.ruleFlags.opposedCheckBonus.grapple = grappleModBonus;
    }
    character.grappleBonus = (Number(character.bab) || 0) + this.getAbilityMod(character.abilities?.str || 10) + (character.ruleFlags?.opposedCheckBonus?.grapple || 0);
    character.actionEconomy = this.evaluateActionEconomy(character, options);

    return {
      ac: character.acBreakdown,
      abilities: character.abilities,
      saves: character.evaluatedSaves,
      ruleFlags: character.ruleFlags,
      actionEconomy: character.actionEconomy,
      activeConditionWarnings: character.activeConditionWarnings
    };
  },

  // D&D 3.5e & DM House Rules Dynamic Threat Range Calculator
  evaluateCritThreatRange(weapon, character = null, houseRules = null) {
    if (!weapon) return { critMin: 20, critMult: 2, threatRangeCount: 1, threatRangeDisplay: '20', isKeen: false, hasImpCrit: false };

    const hr = houseRules || character?.houseRules || {};
    const critCapMin = Number(hr.critCapMin) || 15;
    const stackingMode = hr.keenImpCritStacking || 'stack_diminishing'; // 'none' (RAW), 'stack_diminishing', 'full'

    let baseMin = Number(weapon.baseCritMin !== undefined ? weapon.baseCritMin : weapon.critMin);
    let critMult = Number(weapon.critMult);

    // Parse from string like "18-20/x2" or "19-20" if baseMin or critMult is missing
    const critStr = String(weapon.crit || weapon.critical || '');
    if ((isNaN(baseMin) || baseMin <= 0) && critStr) {
      const match = critStr.match(/(\d+)(?:-(\d+))?(?:\/x(\d+))?/i);
      if (match) {
        baseMin = match[2] ? parseInt(match[1], 10) : (match[1] ? parseInt(match[1], 10) : 20);
        if (match[3] && (isNaN(critMult) || critMult <= 0)) {
          critMult = parseInt(match[3], 10);
        }
      }
    }
    if (isNaN(baseMin) || baseMin <= 0 || baseMin > 20) baseMin = 20;
    if (isNaN(critMult) || critMult <= 0) critMult = 2;

    // Base threat range span: 20 -> 1, 19-20 -> 2, 18-20 -> 3
    const baseSpan = Math.max(1, 21 - baseMin);

    // Check Keen property (Weapon property or active Keen Edge buff)
    const wepName = (weapon.name || '').toLowerCase();
    const wepTags = Array.isArray(weapon.tags) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const wepDesc = (weapon.benefit || weapon.desc || weapon.summary || '').toLowerCase();
    const hasKeenBuff = Boolean(character && Array.isArray(character.buffs) && character.buffs.some(b => {
      if (!b || !b.active) return false;
      const isKeenSpell = Boolean(b.ruleFlags?.keen || (b.name || '').toLowerCase().includes('keen edge'));
      if (!isKeenSpell) return false;
      if (!b.targetWeapon) return true;
      const tw = String(b.targetWeapon).toLowerCase().trim();
      return tw === wepName || wepName.includes(tw) || tw.includes(wepName);
    }));
    const isKeen = !!weapon.isKeen || !!weapon.ruleFlags?.keen || wepTags.includes('keen') || wepName.includes('keen') || wepDesc.includes('keen') || hasKeenBuff;

    // Check Improved Critical Feat
    let hasImpCrit = false;
    if (character && Array.isArray(character.feats)) {
      const cleanWepName = wepName.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
      hasImpCrit = character.feats.some(f => {
        const fn = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        if (!fn.includes('improved critical')) return false;
        if (fn.includes('all') || fn === 'improved critical') return true;
        const targetWep = fn.replace('improved critical', '').replace(/[\(\)]/g, '').trim();
        return cleanWepName.includes(targetWep) || targetWep.includes(cleanWepName);
      });
    }

    let finalSpan = baseSpan;
    if (isKeen && hasImpCrit) {
      if (stackingMode === 'none') {
        // RAW D&D 3.5e: Does not stack
        finalSpan = baseSpan * 2;
      } else if (stackingMode === 'stack_diminishing') {
        // DM House Rule: Keen doubles threat span, Improved Critical adds +1
        finalSpan = (baseSpan * 2) + 1;
      } else if (stackingMode === 'full') {
        // Full stacking: 4x base span
        finalSpan = baseSpan * 4;
      }
    } else if (isKeen || hasImpCrit) {
      finalSpan = baseSpan * 2;
    }

    let calculatedMin = 21 - finalSpan;

    // Apply House Rule Crit Cap (e.g. min 15)
    let capped = false;
    if (calculatedMin < critCapMin) {
      calculatedMin = critCapMin;
      capped = true;
    }

    const threatRangeCount = 21 - calculatedMin;
    const threatRangeDisplay = calculatedMin === 20 ? '20' : `${calculatedMin}-20`;

    return {
      critMin: calculatedMin,
      critMult,
      baseMin,
      baseSpan,
      finalSpan,
      threatRangeCount,
      threatRangeDisplay,
      isKeen,
      hasImpCrit,
      stackingMode,
      critCapMin,
      capped
    };
  },

  // Evaluate Passive / Rule Flags across feats, abilities and buffs (Canonical V2)
  evaluateRuleFlags(character) {
    if (!character) return {};
    const progFeats = Array.isArray(character.levelProgression)
      ? character.levelProgression.filter(r => r && r.active !== false).flatMap(r => [...(r.feats || []), ...(r.specialAbilities || [])])
      : [];
    const feats = [...(character.feats || []), ...(character.specialAbilities || []), ...progFeats]
      .map(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase());
    const hasSteadfast = feats.some(f => f.includes('steadfast determination'));
    const hasAgileShield = feats.some(f => f.includes('agile shield fighter') || f.includes('agile shiled fighter'));

    const flags = {
      allowFlatFootedAoO: feats.some(f => f.includes('combat reflexes')),
      disabledAtNegativeHp: feats.some(f => f.includes('diehard')),
      castInWildShape: feats.some(f => f.includes('natural spell')),
      hasMultiattack: feats.some(f => f.includes('multiattack')),
      hasImprovedMultiattack: feats.some(f => f.includes('improved multiattack')),
      hasCombatReflexes: feats.some(f => f.includes('combat reflexes')),
      hasDiehard: feats.some(f => f.includes('diehard')),
      hasManyshot: feats.some(f => f.includes('manyshot')),
      hasSpiritedCharge: feats.some(f => f.includes('spirited charge')),
      hasRideByAttack: feats.some(f => f.includes('ride-by attack') || f.includes('ride by attack')),
      hasMountedCombat: feats.some(f => f.includes('mounted combat')),
      hasSteadfastDetermination: hasSteadfast,
      conToWillSave: hasSteadfast,
      noAutoFailFortSaveOnNat1: hasSteadfast,
      agileShieldFighter: hasAgileShield,
      loseDexToAC: false,
      effectiveDexZero: false,
      halfSpeed: false,
      extraAttackFullAttack: false,
      actionRestriction: null,
      opposedCheckBonus: {
        trip: feats.some(f => f.includes('improved trip')) ? 4 : 0,
        disarm: feats.some(f => f.includes('improved disarm')) ? 4 : 0,
        sunder: feats.some(f => f.includes('improved sunder')) ? 4 : 0,
        grapple: feats.some(f => f.includes('improved grapple')) ? 4 : 0,
        bullrush: feats.some(f => f.includes('improved bull rush')) ? 4 : 0,
        overrun: feats.some(f => f.includes('improved overrun')) ? 4 : 0
      }
    };

    const mergeFlags = (rf) => {
      if (!rf || typeof rf !== 'object') return;
      Object.entries(rf).forEach(([k, v]) => {
        if (k === 'opposedCheckBonus' && typeof v === 'object') {
          Object.assign(flags.opposedCheckBonus, v);
        } else if (v !== undefined && v !== null && v !== false) {
          flags[k] = v;
        }
      });
    };

    // Merge declarative ruleFlags from character feats & Compendium entries
    (character.feats || []).forEach(f => {
      if (typeof f === 'object' && f && f.ruleFlags) mergeFlags(f.ruleFlags);
      const dbFeat = this.getMasterDbEntry(f, 'Feat');
      if (dbFeat && dbFeat.ruleFlags) mergeFlags(dbFeat.ruleFlags);
    });

    // Merge declarative ruleFlags from active buffs & conditions
    (character.buffs || []).forEach(b => {
      if (!b || !b.active) return;
      const v2Buff = this.ensureV2Entry(b);
      if (v2Buff.ruleFlags) mergeFlags(v2Buff.ruleFlags);
    });

    return flags;
  },

  // Evaluate Action Economy Budget (Standard, Move, Full-Round, Swift, Immediate, Free)
  evaluateActionEconomy(character, options = {}) {
    const tactical = character?.tactical || {};
    const spentActions = options.spentActions || tactical.spentActions || {};
    
    const standardSpent = !!spentActions.standard;
    const moveSpent = !!spentActions.move;
    const fullRoundSpent = !!spentActions.fullRound || (standardSpent && moveSpent);
    const swiftSpent = !!spentActions.swift;
    const immediateSpent = !!spentActions.immediate;

    return {
      standard: standardSpent ? 'spent' : 'available',
      move: moveSpent ? 'spent' : 'available',
      fullRound: fullRoundSpent ? 'spent' : (standardSpent || moveSpent ? 'unavailable' : 'available'),
      swift: swiftSpent ? 'spent' : (immediateSpent ? 'consumed_by_immediate' : 'available'),
      immediate: immediateSpent ? 'spent' : (swiftSpent ? 'consumed_by_swift' : 'available'),
      free: 'unlimited',
      spentActions: {
        standard: standardSpent,
        move: moveSpent,
        fullRound: fullRoundSpent,
        swift: swiftSpent,
        immediate: immediateSpent
      }
    };
  },

  // Evaluate Charge & Spirited Charge Multipliers
  evaluateChargeDamage(weapon, character, options = {}) {
    const isCharge = !!(options.charge !== undefined ? options.charge : character?.tactical?.charge);
    if (!isCharge) return { isCharge: false, multiplier: 1, isLance: false, hasSpiritedCharge: false, desc: 'Normal' };

    const wepName = (weapon?.name || '').toLowerCase();
    const wepTags = Array.isArray(weapon?.tags) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const isLance = wepName.includes('lance') || wepName.includes('kargı') || wepTags.includes('lance');

    const feats = (character?.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const hasSpiritedCharge = feats.some(f => f.includes('spirited charge'));

    let multiplier = 1;
    if (hasSpiritedCharge) {
      multiplier = isLance ? 3 : 2;
    } else if (isLance && (options.mounted || wepTags.includes('mounted'))) {
      multiplier = 2;
    }

    return {
      isCharge: true,
      multiplier,
      isLance,
      hasSpiritedCharge,
      desc: multiplier > 1 ? `Charge ${multiplier}x (${hasSpiritedCharge ? 'Spirited Charge' : 'Mounted Lance'})` : 'Charge (+2 Atk / -2 AC)'
    };
  },

  // Calculate Armor Class (Normal, Touch, Flat-Footed)
  evaluateAC(character, options = {}) {
    if (!character) return { total: 10, touch: 10, flat: 10, dodgeBonus: 0, effectiveDex: 0, breakdown: {} };
    
    // Always trigger dynamic recalculation
    this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []), options);

    const bd = character.acBreakdown || {};
    return {
      total: bd.total ?? 10,
      touch: bd.touch ?? 10,
      flat: bd.flat ?? 10,
      dodgeBonus: bd.dodge ?? 0,
      effectiveDex: bd.effectiveDex ?? 0,
      breakdown: {
        armor: bd.armor || 0,
        shield: bd.shield || 0,
        dex: bd.effectiveDex ?? 0,
        natural: bd.natural || 0,
        deflection: bd.deflection || 0,
        dodge: bd.dodge || 0,
        penalty: bd.penalty ? -Math.abs(bd.penalty) : 0
      }
    };
  },

  // Calculate Saving Throws
  evaluateSaves(character) {
    if (!character) return { fort: 0, ref: 0, will: 0, bonusFort: 0, bonusRef: 0, bonusWill: 0, battleClarityBonus: 0, hasSteadfastDetermination: false, willAbility: 'WIS', willAbilityMod: 0 };
    this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []));
    return character.evaluatedSaves || { fort: 0, ref: 0, will: 0, bonusFort: 0, bonusRef: 0, bonusWill: 0, battleClarityBonus: 0, hasSteadfastDetermination: false, willAbility: 'WIS', willAbilityMod: 0 };
  },

  // D&D 3.5e RAW Damage Dice Stepping Progression (DMG p. 28, FAQ & Rules Compendium)
  stepDamageDice(baseDiceStr, steps = 0) {
    if (!baseDiceStr || steps === 0) return baseDiceStr;
    const cleanStr = String(baseDiceStr).trim().toLowerCase().replace(/\s+/g, '');

    // Canonical D&D 3.5e Size Damage Progression Ladders
    const ladders = [
      // Standard d6/d8 ladder: 1d2 -> 1d3 -> 1d4 -> 1d6 -> 1d8 -> 2d6 -> 3d6 -> 4d6 -> 6d6 -> 8d6 -> 12d6 -> 16d6
      ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // d10 / d8 ladder: 1d10 -> 2d8 -> 3d8 -> 4d8 -> 6d8 -> 8d8 -> 12d8
      ['1d10', '2d8', '3d8', '4d8', '6d8', '8d8', '12d8'],
      // 1d12 ladder
      ['1d12', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d4 ladder (e.g., Spiked Chain)
      ['2d4', '2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d6 ladder (e.g., Greatsword, Jovar)
      ['2d6', '3d6', '4d6', '6d6', '8d6', '12d6', '16d6'],
      // 2d8 ladder
      ['2d8', '3d8', '4d8', '6d8', '8d8', '12d8'],
      // 2d10 ladder
      ['2d10', '4d8', '6d8', '8d8', '12d8']
    ];

    for (const ladder of ladders) {
      const idx = ladder.indexOf(cleanStr);
      if (idx !== -1) {
        const targetIdx = Math.max(0, Math.min(ladder.length - 1, idx + steps));
        return ladder[targetIdx];
      }
    }

    // Generic fallback for any unrecognized die formula
    const match = cleanStr.match(/^(\d+)d(\d+)$/);
    if (match) {
      let count = parseInt(match[1], 10);
      const die = parseInt(match[2], 10);
      count = Math.max(1, count + steps);
      return `${count}d${die}`;
    }

    return baseDiceStr;
  },

  // Evaluate Weapon Attack Modifiers, Embedded Modes & Canonical V2 DamageParts
  evaluateWeaponAttack(character, rawWeapon, options = {}) {
    if (!character || !rawWeapon) return {};

    // 0. Ensure Weapon is Canonical V2 & Resolve Active Embedded Mode
    const v2Weapon = this.ensureV2Entry(rawWeapon);
    const dbWeapon = this.getMasterDbEntry(v2Weapon, 'Weapon');
    const modes = Array.isArray(v2Weapon.modes) && v2Weapon.modes.length > 0
      ? v2Weapon.modes
      : (dbWeapon && Array.isArray(dbWeapon.modes) ? dbWeapon.modes : []);

    const activeModeId = options.modeId !== undefined ? options.modeId : v2Weapon.activeModeId;
    const activeMode = (activeModeId && modes.length > 0)
      ? (modes.find(m => m && (m.id === activeModeId || m.name === activeModeId)) || null)
      : null;

    // Effective weapon merges active mode overrides onto parent V2 weapon
    const weapon = activeMode ? {
      ...v2Weapon,
      grip: activeMode.grip || v2Weapon.grip,
      isRanged: activeMode.isRanged !== undefined ? activeMode.isRanged : v2Weapon.isRanged,
      range: activeMode.range !== undefined ? activeMode.range : v2Weapon.range,
      damageParts: (Array.isArray(activeMode.damageParts) && activeMode.damageParts.length > 0)
        ? activeMode.damageParts
        : v2Weapon.damageParts,
      modifiers: [
        ...(Array.isArray(v2Weapon.modifiers) ? v2Weapon.modifiers : []),
        ...(Array.isArray(activeMode.modifiers) ? activeMode.modifiers : [])
      ]
    } : v2Weapon;

    const isTwoHand = this.isTwoHandedWeapon(weapon);
    let resolvedGrip = options.grip || weapon.grip || (isTwoHand ? '2-Hand' : '1-Hand');

    // Two-handed weapon MUST be wielded with 2-Hand grip per D&D 3.5e RAW (unless in a thrown/ranged mode)
    if (isTwoHand && resolvedGrip !== '2-Hand' && resolvedGrip !== 'Ranged') {
      resolvedGrip = '2-Hand';
    }

    const {
      grip = resolvedGrip,
      powerAttack = 0,
      flanking = false,
      charge = false,
      higherGround = false,
      activeStance = character.activeStance || 'None',
      customModifiers = [],
      manyshot = false,
      manyshotArrows: optManyshotArrows = 0
    } = options;

    const charLvl = Number(character.level) || 1;
    const rawBab = Number(character.bab) || 0;
    const hasBabEqualsLevel = Boolean(Array.isArray(character.buffs) && character.buffs.some(b => b && b.active && (b.ruleFlags?.babEqualsLevel || /^(divine power|transformation)$/i.test(String(b.name || '').trim()))));
    const bab = hasBabEqualsLevel ? Math.max(rawBab, charLvl) : rawBab;
    const strMod = this.getAbilityMod(character.abilities?.str || 10);
    const dexMod = this.getAbilityMod(character.abilities?.dex || 10);
    const evalCtx = {
      cl: charLvl,
      level: charLvl,
      bab,
      strMod,
      dexMod,
      enhancement: Number(weapon.enhancementBonus) || 0
    };

    const houseRules = options.houseRules || character?.houseRules || {};
    const critData = this.evaluateCritThreatRange(weapon, character, houseRules);
    const chargeData = this.evaluateChargeDamage(weapon, character, options);
    const ruleFlags = this.evaluateRuleFlags(character);

    // Feat detections (match via baseItemId or stripped weapon name)
    const baseWepName = (weapon.baseItemId || weapon.name || '').toLowerCase().replace(/^wep_/, '').replace(/_/g, ' ').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const feats = (character.feats || []).map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const hasWeaponFinesse = feats.some(f => f.includes('weapon finesse'));
    const hasShadowBlade = feats.some(f => f.includes('shadow blade'));
    const hasWeaponFocus = feats.some(f => f.includes('weapon focus') && !f.includes('greater weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponFocus = feats.some(f => f.includes('greater weapon focus') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasWeaponSpec = feats.some(f => f.includes('weapon specialization') && !f.includes('greater weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));
    const hasGreaterWeaponSpec = feats.some(f => f.includes('greater weapon specialization') && ((baseWepName && f.includes(baseWepName)) || f.includes((weapon.name || '').toLowerCase()) || f.includes('all')));

    const isRangedWep = grip === 'Ranged' || weapon.isRanged || (Array.isArray(weapon.tags) && weapon.tags.includes('ranged')) || (weapon.weaponStats && weapon.weaponStats.category === 'Ranged');

    // 1. Attack Stat Calculation
    let attackStatMod = isRangedWep ? dexMod : strMod;
    let attackStatName = isRangedWep ? 'DEX (Ranged)' : 'STR';

    if (!isRangedWep && hasWeaponFinesse && this.isFinessable(weapon) && dexMod > strMod) {
      attackStatMod = dexMod;
      attackStatName = 'DEX (Weapon Finesse)';
    }

    // Power attack penalty: cannot exceed BAB
    const effectivePA = Math.min(bab, Math.max(0, Number(powerAttack) || 0));

    const attackBonusItems = [
      { type: 'untyped', val: bab, source: 'BAB' },
      { type: 'untyped', val: attackStatMod, source: attackStatName },
      { type: 'untyped', val: -effectivePA, source: 'Power Attack Penalty' }
    ];

    // Combat Expertise penalty (cannot exceed BAB and cannot exceed 5 per RAW D&D 3.5e)
    const maxAllowedCE = Math.min(5, bab);
    const combatExpertise = Math.min(maxAllowedCE, Math.max(0, Number(options.combatExpertise !== undefined ? options.combatExpertise : (character.tactical?.combatExpertise || 0))));
    if (combatExpertise > 0) {
      attackBonusItems.push({ type: 'untyped', val: -combatExpertise, source: 'Combat Expertise Penalty' });
    }

    // Weapon Proficiency Check (RAW D&D 3.5e: -4 attack penalty if non-proficient)
    const isWepProf = this.isProficientWithWeapon(character, weapon);
    if (!isWepProf) {
      attackBonusItems.push({ type: 'penalty', val: -4, source: 'Non-Proficient Weapon Penalty (-4 Att)' });
    }

    // Armor Non-Proficiency Check
    if (character.bodySlots && character.bodySlots.armor) {
      const armorItem = character.bodySlots.armor;
      if (armorItem && armorItem.name && armorItem.name !== '-' && armorItem.active !== false) {
        const isArmorProf = this.isProficientWithArmor(character, armorItem);
        if (!isArmorProf) {
          const armorMods = this.parseItemModifiers(armorItem, (typeof masterDb !== 'undefined' ? masterDb : []), evalCtx);
          const armorAcp = armorMods ? armorMods.acp : 0;
          if (armorAcp < 0) {
            attackBonusItems.push({
              type: 'penalty',
              val: armorAcp,
              source: `Non-Proficient Armor Penalty (${armorItem.name} ACP ${armorAcp})`
            });
          }
        }
      }
    }

    // Shield Non-Proficiency Check
    if (character.bodySlots && character.bodySlots.offHand) {
      const offHandItem = character.bodySlots.offHand;
      if (offHandItem && offHandItem.name && offHandItem.name !== '-' && offHandItem.active !== false) {
        if (this.isShieldItem(offHandItem)) {
          const isShieldProf = this.isProficientWithShield(character, offHandItem);
          if (!isShieldProf) {
            const shieldMods = this.parseItemModifiers(offHandItem, (typeof masterDb !== 'undefined' ? masterDb : []), evalCtx);
            const shieldAcp = shieldMods ? shieldMods.acp : 0;
            if (shieldAcp < 0) {
              attackBonusItems.push({
                type: 'penalty',
                val: shieldAcp,
                source: `Non-Proficient Shield Penalty (${offHandItem.name} ACP ${shieldAcp})`
              });
            }
          }
        }
      }
    }

    // Fighting Defensively penalty (-4 to all attack rolls)
    const fightingDefensively = options.fightingDefensively !== undefined ? options.fightingDefensively : (character.tactical?.fightingDefensively || false);
    if (fightingDefensively) {
      attackBonusItems.push({ type: 'untyped', val: -4, source: 'Fighting Defensively Penalty' });
    }

    // Monkey Grip penalty: -2 on attack rolls when wielding an oversized weapon
    const hasMonkeyGrip = feats.some(f => f.includes('monkey grip'));
    const isOversizedWeapon = weapon.isOversized || weapon.oversized || (Array.isArray(weapon.tags) && weapon.tags.includes('oversized'));
    if (isOversizedWeapon && hasMonkeyGrip) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Monkey Grip (-2 Att)' });
    }

    // Flaw: Noncombatant (-2 Melee) & Flaw: Shaky (-2 Ranged)
    if (!isRangedWep && feats.some(f => f.includes('flaw: noncombatant') || f === 'noncombatant')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Noncombatant (-2 Melee)' });
    }
    if (isRangedWep && feats.some(f => f.includes('flaw: shaky') || f === 'shaky')) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Shaky (-2 Ranged)' });
    }

    // Manyshot penalty: 2 arrows -> -2, 3 arrows -> -4, 4 arrows -> -6
    const effectiveManyshotArrows = isRangedWep && manyshot ? Math.min(4, Math.max(2, Number(optManyshotArrows || manyshot) || 2)) : 0;
    if (effectiveManyshotArrows > 0) {
      const penalty = (effectiveManyshotArrows - 1) * 2;
      attackBonusItems.push({ type: 'untyped', val: -penalty, source: `Manyshot (${effectiveManyshotArrows} Ok / -${penalty} Atk)` });
    }

    const isAtkTargetMatch = (t) => (
      t === 'attack' || t === 'attack.all' ||
      ((t === 'meleeattack' || t === 'attack.melee') && !isRangedWep) ||
      ((t === 'rangedattack' || t === 'attack.ranged') && isRangedWep)
    );
    const isDmgTargetMatch = (t) => (
      t === 'damage' || t === 'damage.all' || t === 'damage.weapon' ||
      ((t === 'meleedamage' || t === 'damage.melee') && !isRangedWep) ||
      ((t === 'rangeddamage' || t === 'damage.ranged') && isRangedWep)
    );
    const evalModExpr = (mObj, ctxObj) => {
      const hasFormula = mObj.formula !== undefined && mObj.formula !== null && String(mObj.formula).trim() !== '';
      const raw = hasFormula ? mObj.formula : mObj.value;
      return Number(this.evaluateFormula(raw, ctxObj)) || Number(mObj.value) || 0;
    };
    const isBuffMatchingWeapon = (bObj) => {
      if (!bObj || !bObj.targetWeapon) return true;
      const tw = String(bObj.targetWeapon).toLowerCase().trim();
      const wn = String(weapon.name || '').toLowerCase().trim();
      return tw === wn || wn.includes(tw) || tw.includes(wn) || (weapon.id && bObj.targetWeaponId === weapon.id);
    };

    // Weapon V2 Attack Modifiers & Enhancement Bonus
    const wepMods = Array.isArray(weapon.modifiers) ? weapon.modifiers : [];
    let hasExplicitWepAtkMod = false;
    wepMods.forEach(m => {
      if (!m || !m.target) return;
      const t = String(m.target).toLowerCase();
      if (isAtkTargetMatch(t)) {
        const val = evalModExpr(m, evalCtx);
        if (val !== 0) {
          attackBonusItems.push({ type: (m.type || 'enhancement').toLowerCase(), val, source: m.source || 'Weapon Enhancement' });
          hasExplicitWepAtkMod = true;
        }
      }
    });
    if (!hasExplicitWepAtkMod && Number(weapon.enhancementBonus) > 0) {
      attackBonusItems.push({ type: 'enhancement', val: Number(weapon.enhancementBonus), source: 'Weapon Enhancement' });
    } else if (!hasExplicitWepAtkMod && weapon.isMasterwork) {
      attackBonusItems.push({ type: 'enhancement', val: 1, source: 'Masterwork Weapon' });
    }

    if (hasWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Weapon Focus' });
    }
    if (hasGreaterWeaponFocus) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Greater Weapon Focus' });
    }
    if (flanking) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Flanking' });
    }
    if (charge) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Charge' });
    }
    if (higherGround) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Higher Ground' });
    }

    // External custom modifiers
    customModifiers.forEach(m => {
      if (!m) return;
      if (Array.isArray(m.modifiers)) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isAtkTargetMatch(t)) {
            const v = evalModExpr(mod, evalCtx);
            if (v !== 0) attackBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
      } else if (m.bonusAtk) {
        attackBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusAtk, source: m.name });
      }
    });

    // Active Character Templates V2 Attack Modifiers
    const activeTemplatesForAtk = this.getCharacterActiveTemplateEntries(character);
    activeTemplatesForAtk.forEach(tmpl => {
      if (!tmpl || !Array.isArray(tmpl.modifiers)) return;
      tmpl.modifiers.forEach(mod => {
        if (!mod || !mod.target || mod.condition) return;
        const t = String(mod.target).toLowerCase();
        if (isAtkTargetMatch(t)) {
          const v = evalModExpr(mod, evalCtx);
          if (v !== 0) attackBonusItems.push({ type: mod.type || 'template', val: v, source: `${tmpl.name} (Template)` });
        }
      });
    });

    // Active Buffs & Conditions V2 Attack Modifiers
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        if (!isBuffMatchingWeapon(b)) return;
        const bCl = Number(b.casterLevel || b.cl || charLvl) || charLvl;
        const isScalingAtkBuff = /^(divine favor|greater magic weapon|magic weapon, greater|greater magic fang|magic fang, greater)$/i.test(String(b.name || '').trim());
        if (isScalingAtkBuff && (!Array.isArray(b.modifiers) || b.modifiers.some(m => !m || !String(m.formula || '').includes('@cl') || String(m.formula || '').includes('1 + floor(@cl / 3)')))) {
          const cleanSpellQuery = { name: b.name, id: String(b.id || '').startsWith('spl-') ? b.id : undefined };
          const resolvedSpec = this.resolveSpellBuffSpec(cleanSpellQuery, character, bCl);
          if (resolvedSpec && Array.isArray(resolvedSpec.modifiers) && resolvedSpec.modifiers.length > 0) {
            b.modifiers = resolvedSpec.modifiers;
            rawBuff.modifiers = resolvedSpec.modifiers;
          }
        }
        const bCtx = { ...evalCtx, cl: bCl };
        let appliedNegLvlAtk = false;
        if (Array.isArray(b.modifiers)) {
          b.modifiers.forEach(mod => {
            if (!mod || !mod.target) return;
            const t = String(mod.target).toLowerCase();
            if (isAtkTargetMatch(t)) {
              const val = evalModExpr(mod, bCtx);
              if (val !== 0) {
                attackBonusItems.push({
                  type: mod.type || (b.isDebuff || val < 0 ? 'penalty' : 'untyped'),
                  val,
                  source: b.name
                });
                if (b.negativeLevels && val < 0) appliedNegLvlAtk = true;
              }
            }
          });
        }
        if (b.negativeLevels && !appliedNegLvlAtk) {
          attackBonusItems.push({ type: 'penalty', val: -Number(b.negativeLevels), source: `${b.name} (-${b.negativeLevels} Lvl)` });
        }
      });
    }

    const netAttackBonus = this.resolveBonusStacking(attackBonusItems);

    // 2. Damage Calculation (RAW D&D 3.5e + Canonical V2 damageParts)
    const isLightWep = this.isLightWeapon(weapon);
    const isCrossbow = baseWepName.includes('crossbow');
    const isBow = baseWepName.includes('bow') && !isCrossbow;
    const isRapier = baseWepName.includes('rapier');

    let paDamageMultiplier = 1;
    if (isLightWep || isRangedWep) {
      paDamageMultiplier = 0;
    } else if (isRapier) {
      paDamageMultiplier = (grip === 'Off-Hand') ? 0 : 1;
    } else if (grip === '2-Hand') {
      paDamageMultiplier = 2;
    } else if (grip === 'Off-Hand') {
      paDamageMultiplier = 0;
    } else {
      paDamageMultiplier = 1;
    }

    let baseStrDmg = 0;
    let strDesc = `STR (${grip})`;

    if (isCrossbow) {
      baseStrDmg = 0;
      strDesc = 'Crossbow (No STR to Dmg)';
    } else if (isBow) {
      if (strMod < 0) {
        baseStrDmg = strMod;
        strDesc = 'Bow (Low STR Penalty)';
      } else if (baseWepName.includes('composite')) {
        const ratingMatch = (weapon.name || '').match(/\(\s*\+(\d+)\s*str\s*\)/i) || (weapon.desc || '').match(/composite\s*\(\s*\+(\d+)/i);
        const compRating = ratingMatch ? parseInt(ratingMatch[1], 10) : (weapon.compositeRating || 0);
        baseStrDmg = Math.min(compRating, strMod);
        strDesc = `Composite Bow (Max +${compRating} STR)`;
      } else {
        baseStrDmg = 0;
        strDesc = 'Regular Bow (No STR Bonus)';
      }
    } else {
      if (strMod < 0) {
        baseStrDmg = strMod;
        strDesc = `STR Penalty (${strMod})`;
      } else if (isRapier) {
        baseStrDmg = (grip === 'Off-Hand') ? Math.floor(strMod * 0.5) : strMod;
        strDesc = (grip === 'Off-Hand') ? 'STR (Off-Hand 0.5x)' : 'STR (Rapier 1.0x)';
      } else if (grip === '2-Hand') {
        baseStrDmg = Math.floor(strMod * 1.5);
        strDesc = 'STR (2-Hand 1.5x)';
      } else if (grip === 'Off-Hand') {
        baseStrDmg = Math.floor(strMod * 0.5);
        strDesc = 'STR (Off-Hand 0.5x)';
      } else {
        baseStrDmg = strMod;
        strDesc = 'STR (1-Hand 1.0x)';
      }
    }

    const paDmg = effectivePA * paDamageMultiplier;

    const damageBonusItems = [
      { type: 'untyped', val: baseStrDmg, source: strDesc },
      { type: 'untyped', val: paDmg, source: `Power Attack (${paDamageMultiplier}x)` }
    ];

    // Power Attack Item Synergy (e.g. Armbands of Might MIC p.72: +2 melee damage when taking at least -2 Power Attack penalty)
    if (!isRangedWep && effectivePA >= 2 && character && character.bodySlots && typeof character.bodySlots === 'object') {
      Object.entries(character.bodySlots).forEach(([slotKey, slotItem]) => {
        if (!slotItem || slotItem.active === false || !slotItem.name || slotItem.name === '-') return;
        const dbEntry = this.getMasterDbEntry(slotItem);
        const rf = Object.assign({}, dbEntry?.ruleFlags || {}, slotItem.ruleFlags || {});
        const minPa = Number(rf.powerAttackMinPenalty) || 2;
        const bonusDmg = Number(rf.powerAttackBonusDamage) || 0;
        if (bonusDmg > 0 && effectivePA >= minPa) {
          damageBonusItems.push({
            type: 'untyped',
            val: bonusDmg,
            source: `${slotItem.name} (Power Attack Synergy)`
          });
        }
      });
    }

    // Weapon V2 Damage Modifiers & Enhancement Bonus
    let hasExplicitWepDmgMod = false;
    wepMods.forEach(m => {
      if (!m || !m.target) return;
      const t = String(m.target).toLowerCase();
      if (isDmgTargetMatch(t)) {
        const val = evalModExpr(m, evalCtx);
        if (val !== 0) {
          damageBonusItems.push({ type: (m.type || 'enhancement').toLowerCase(), val, source: m.source || 'Weapon Enhancement' });
          hasExplicitWepDmgMod = true;
        }
      }
    });
    if (!hasExplicitWepDmgMod && Number(weapon.enhancementBonus) > 0) {
      damageBonusItems.push({ type: 'enhancement', val: Number(weapon.enhancementBonus), source: 'Weapon Enhancement' });
    }

    if (hasWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }
    if (hasGreaterWeaponSpec) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Greater Weapon Specialization' });
    }

    // External custom modifiers for damage
    customModifiers.forEach(m => {
      if (!m) return;
      if (Array.isArray(m.modifiers)) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isDmgTargetMatch(t)) {
            const v = evalModExpr(mod, evalCtx);
            if (v !== 0) damageBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
      } else if (m.bonusDmg) {
        damageBonusItems.push({ type: m.bonusType || 'untyped', val: m.bonusDmg, source: m.name });
      }
    });

    // Active Character Templates V2 Damage Modifiers
    const activeTemplatesForDmg = this.getCharacterActiveTemplateEntries(character);
    activeTemplatesForDmg.forEach(tmpl => {
      if (!tmpl || !Array.isArray(tmpl.modifiers)) return;
      tmpl.modifiers.forEach(mod => {
        if (!mod || !mod.target || mod.condition) return;
        const t = String(mod.target).toLowerCase();
        if (isDmgTargetMatch(t)) {
          const v = evalModExpr(mod, evalCtx);
          if (v !== 0) damageBonusItems.push({ type: mod.type || 'template', val: v, source: `${tmpl.name} (Template)` });
        }
      });
    });

    // Active Buffs & Conditions V2 Damage Modifiers
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        if (!isBuffMatchingWeapon(b)) return;
        const bCl = Number(b.casterLevel || b.cl || charLvl) || charLvl;
        const bCtx = { ...evalCtx, cl: bCl };
        if (Array.isArray(b.modifiers)) {
          b.modifiers.forEach(mod => {
            if (!mod || !mod.target) return;
            const t = String(mod.target).toLowerCase();
            if (isDmgTargetMatch(t)) {
              const val = evalModExpr(mod, bCtx);
              if (val !== 0) {
                damageBonusItems.push({
                  type: mod.type || (b.isDebuff || val < 0 ? 'penalty' : 'untyped'),
                  val,
                  source: b.name
                });
              }
            }
          });
        }
      });
    }

    // Shadow Blade: Add DEX mod to damage if in Shadow Hand stance and using Shadow Hand weapon
    const isShadowStance = (activeStance.toLowerCase().includes('shadow') || activeStance.toLowerCase().includes('island of blades') || activeStance.toLowerCase().includes('child of shadow') || activeStance.toLowerCase().includes('assassin'));
    if (hasShadowBlade && isShadowStance && this.isShadowHandWeapon(weapon)) {
      damageBonusItems.push({ type: 'untyped', val: dexMod, source: 'Shadow Blade (DEX)' });
    }

    const netFlatDamage = this.resolveBonusStacking(damageBonusItems);

    // Iterative attacks for 3.5e: BAB >= 16 -> 4 attacks (+0/-5/-10/-15), BAB >= 11 -> 3, BAB >= 6 -> 2, otherwise 1
    let iteratives = [netAttackBonus];
    if (effectiveManyshotArrows > 0) {
      iteratives = [netAttackBonus];
    } else {
      if (bab >= 6) iteratives.push(netAttackBonus - 5);
      if (bab >= 11) iteratives.push(netAttackBonus - 10);
      if (bab >= 16) iteratives.push(netAttackBonus - 15);

      // Haste or extraAttackFullAttack ruleFlag grants 1 extra full attack at highest BAB
      const hasHaste = ruleFlags.extraAttackFullAttack || (character.buffs || []).some(b => b && b.active && (b.ruleFlags?.extraAttackFullAttack || (b.name || '').toLowerCase().includes('haste')));
      if (hasHaste) {
        iteratives.unshift(netAttackBonus);
      }
    }

    const chargeMultiplier = chargeData.multiplier || 1;
    const chargeFlatDamage = netFlatDamage * chargeMultiplier;

    // 3. Weapon Size Steps (Enlarge Person, Lead Blades, Greater Mighty Wallop, etc.)
    let effectiveSteps = Number(options.sizeSteps || weapon.sizeSteps || 0);
    const sizeBuffSources = [];

    if (Array.isArray(character?.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const targetWepName = (b.targetWeapon || '').toLowerCase().trim();
        const wepName = (weapon.name || '').toLowerCase().trim();
        const matchesWeapon = targetWepName && (
          targetWepName === wepName ||
          (weapon.id && b.targetWeaponId === weapon.id) ||
          wepName.includes(targetWepName) ||
          targetWepName.includes(wepName)
        );
        const sm = b.sizeModifier || null;
        let buffSteps = Number(b.sizeSteps) || 0;
        if (!buffSteps && sm && sm.scaling) {
          const bCl = Number(b.casterLevel || b.cl || charLvl) || charLvl;
          if (sm.scaling.type === 'per_caster_level') {
            buffSteps = Math.min(sm.scaling.maxSteps || 5, Math.floor(bCl / (sm.scaling.clDivisor || 4)));
          } else {
            buffSteps = Number(sm.scaling.steps) || 1;
          }
        }
        const isCreatureSizeBuff = (b.targetType === 'creature' || b.scope === 'creature' || sm?.targetType === 'creature' || (b.name && /enlarge person|righteous might|expansion/i.test(b.name))) && buffSteps !== 0;

        if (matchesWeapon && buffSteps !== 0) {
          effectiveSteps += buffSteps;
          sizeBuffSources.push(`${b.name} (${buffSteps > 0 ? '+' : ''}${buffSteps} size step${Math.abs(buffSteps) === 1 ? '' : 's'})`);
        } else if (isCreatureSizeBuff) {
          effectiveSteps += buffSteps;
          sizeBuffSources.push(`${b.name} (${buffSteps > 0 ? '+' : ''}${buffSteps} size category)`);
        }
      });
    }

    // 4. Structured V2 damageParts Evaluation (Base Weapon + Enhancements + Active Buff DamageParts)
    const rawParts = (Array.isArray(weapon.damageParts) && weapon.damageParts.length > 0)
      ? weapon.damageParts
      : (dbWeapon && Array.isArray(dbWeapon.damageParts) && dbWeapon.damageParts.length > 0
          ? dbWeapon.damageParts
          : [{ dice: weapon.dice || '1d8', bonus: 0, type: weapon.dmgType || weapon.type || 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }]);

    const combinedRawParts = [...rawParts];

    // Append damageParts from active buffs (e.g. Sneak Attack, Hunter's Mercy, Arcane Wrath)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const b = this.ensureV2Entry(rawBuff);
        if (Array.isArray(b.damageParts) && b.damageParts.length > 0) {
          b.damageParts.forEach(bp => {
            if (bp && bp.dice) {
              combinedRawParts.push({
                ...bp,
                source: bp.source || b.name
              });
            }
          });
        }
      });
    }

    const evaluatedDamageParts = combinedRawParts.map((part, idx) => {
      const isPrimary = idx === 0;
      const rawDiceStr = String(this.evaluateFormula(part.dice || '1d8', evalCtx) || part.dice || '1d8').trim();
      const steppedDice = (isPrimary && effectiveSteps !== 0)
        ? this.stepDamageDice(rawDiceStr, effectiveSteps)
        : rawDiceStr;
      const partBonus = isPrimary
        ? netFlatDamage
        : (Number(this.evaluateFormula(part.bonus || 0, evalCtx)) || 0);
      return {
        dice: steppedDice,
        rawDice: rawDiceStr,
        bonus: partBonus,
        type: part.type || 'Slashing',
        multiplyOnCrit: part.multiplyOnCrit !== undefined ? !!part.multiplyOnCrit : isPrimary,
        onCritOnly: !!part.onCritOnly,
        source: part.source || (isPrimary ? (weapon.name || 'Base Weapon') : 'Extra'),
        isPrimary
      };
    });

    const primaryPart = evaluatedDamageParts[0] || { dice: '1d8', rawDice: '1d8', bonus: netFlatDamage, type: 'Slashing' };
    const normalDamageParts = evaluatedDamageParts.filter(p => !p.onCritOnly);
    const extraDamageParts = normalDamageParts.slice(1);
    const critOnlyDamageParts = evaluatedDamageParts.filter(p => p.onCritOnly);

    // Build ready-to-roll 3D Dice Engine formulas (normal & critical)
    const primaryFormula = `${primaryPart.dice}${netFlatDamage !== 0 ? (netFlatDamage > 0 ? `+${netFlatDamage}` : `${netFlatDamage}`) : ''}`;
    const extraDiceTerms = extraDamageParts.map(p => `${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`);
    const diceFormula = [primaryFormula, ...extraDiceTerms].join(' + ');

    const critMult = Math.max(2, Number(critData.critMult) || 2);
    const critTerms = [];
    for (let i = 0; i < critMult; i++) {
      critTerms.push(primaryFormula);
    }
    extraDamageParts.forEach(p => {
      const term = `${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`;
      if (p.multiplyOnCrit) {
        for (let i = 0; i < critMult; i++) critTerms.push(term);
      } else {
        critTerms.push(term);
      }
    });
    critOnlyDamageParts.forEach(p => {
      critTerms.push(`${p.dice}${p.bonus ? (p.bonus > 0 ? `+${p.bonus}` : `${p.bonus}`) : ''}`);
    });
    const critDiceFormula = critTerms.join(' + ');

    return {
      netAttackBonus,
      iteratives,
      attackStatName,
      attackStatMod,
      effectivePA,
      rawBaseDice: primaryPart.rawDice,
      baseDice: primaryPart.dice,
      effectiveDice: primaryPart.dice,
      sizeSteps: effectiveSteps,
      sizeBuffSources,
      netFlatDamage,
      damageParts: evaluatedDamageParts,
      normalDamageParts,
      extraDamageParts,
      critOnlyDamageParts,
      diceFormula,
      critDiceFormula,
      modes,
      activeMode,
      activeModeId: activeMode ? activeMode.id : null,
      tacticalBadges: Array.isArray(weapon.tacticalBadges) ? weapon.tacticalBadges : [],
      critMin: critData.critMin,
      critMult: critData.critMult,
      critThreatRangeCount: critData.threatRangeCount,
      critThreatRangeDisplay: critData.threatRangeDisplay,
      isKeen: critData.isKeen,
      hasImpCrit: critData.hasImpCrit,
      critData,
      chargeData,
      chargeMultiplier,
      chargeFlatDamage,
      ruleFlags,
      manyshotArrows: effectiveManyshotArrows,
      damageType: primaryPart.type || 'Slashing',
      attackBonusItems,
      damageBonusItems
    };
  },

  // D&D 3.5e Carrying Capacity table based on STR
  getCarryingCapacity(strScore, charObj = null) {
    let rawStr = Number(strScore) || 10;
    const targetChar = charObj || (typeof character !== 'undefined' ? character : null);
    if (targetChar && Array.isArray(targetChar.feats)) {
      const feats = targetChar.feats.map(f => (typeof f === 'string' ? f : (f.name || '')).toLowerCase().trim());
      if (feats.some(f => f.includes('flaw: meager heft') || f.includes('meager heft'))) {
        rawStr = Math.max(1, rawStr - 3);
      }
    }
    if (targetChar) {
      let carryStrBonus = 0;
      const itemsToScan = [
        ...(Array.isArray(targetChar.gearPool) ? targetChar.gearPool : []),
        ...(targetChar.bodySlots && typeof targetChar.bodySlots === 'object' ? Object.values(targetChar.bodySlots) : [])
      ];
      const seenItemNames = new Set();
      itemsToScan.forEach(it => {
        if (!it || it.active === false || !it.name || it.name === '-') return;
        const nLower = String(it.name).toLowerCase().trim();
        if (seenItemNames.has(nLower)) return;
        seenItemNames.add(nLower);
        const dbIt = (!Array.isArray(it.modifiers) || it.modifiers.length === 0) ? this.getMasterDbEntry(it) : null;
        const mods = (Array.isArray(it.modifiers) && it.modifiers.length > 0) ? it.modifiers : (dbIt?.modifiers || []);
        mods.forEach(m => {
          if (m && String(m.target || '').toLowerCase() === 'carryingcapacity.strbonus') {
            carryStrBonus += Number(m.value) || 0;
          }
        });
        if (mods.length === 0 && nLower.includes('backpack') && nLower.includes('masterwork')) {
          carryStrBonus = Math.max(carryStrBonus, 1);
        }
      });
      rawStr += carryStrBonus;
    }
    const s = Math.max(1, Math.min(29, rawStr));
    const table = {
      1: [3, 6, 10], 2: [6, 13, 20], 3: [10, 20, 30], 4: [13, 26, 40],
      5: [16, 33, 50], 6: [20, 40, 60], 7: [23, 46, 70], 8: [26, 53, 80],
      9: [30, 60, 90], 10: [33, 66, 100], 11: [38, 76, 115], 12: [43, 86, 130],
      13: [50, 100, 150], 14: [58, 116, 175], 15: [66, 133, 200], 16: [76, 153, 230],
      17: [86, 173, 260], 18: [100, 200, 300], 19: [116, 233, 350], 20: [133, 266, 400],
      21: [153, 306, 460], 22: [173, 346, 520], 23: [200, 400, 600], 24: [233, 466, 700],
      25: [266, 533, 800], 26: [306, 613, 920], 27: [346, 693, 1040], 28: [400, 800, 1200],
      29: [466, 933, 1400]
    };
    const row = table[s] || [33, 66, 100];
    return {
      light: row[0],
      medium: row[1],
      heavy: row[2],
      lift: row[2],
      ground: row[2] * 2,
      drag: row[2] * 5
    };
  },

  // Calculate load status given current weight and STR
  getLoadStatus(currentWeight, strScore) {
    const caps = this.getCarryingCapacity(strScore);
    const wt = Number(currentWeight) || 0;
    if (wt <= caps.light) return { status: 'Light Load', color: 'emerald', maxDex: null, checkPenalty: 0, speed30: 30, speed20: 20 };
    if (wt <= caps.medium) return { status: 'Medium Load', color: 'amber', maxDex: 3, checkPenalty: -3, speed30: 20, speed20: 15 };
    if (wt <= caps.heavy) return { status: 'Heavy Load', color: 'orange', maxDex: 1, checkPenalty: -6, speed30: 20, speed20: 15 };
    return { status: 'Overloaded (Max Load Exceeded)', color: 'rose', maxDex: 0, checkPenalty: -10, speed30: 5, speed20: 5 };
  },

  // Canonical Consolidated Skill Mappings (Bridge between RAW 3.5e skills and Consolidated groups)
  DEFAULT_SKILL_MAPPING: {
    "stealth": ["hide", "move_silently", "move silently", "movesilently", "sessiz hareket", "gizlenme"],
    "perception": ["spot", "listen", "search", "fark etme", "dinleme", "arama"],
    "athletics": ["climb", "jump", "swim", "tırmanma", "zıplama", "yüzme"],
    "acrobatics": ["tumble", "balance", "escape_artist", "escape artist", "takla", "denge", "kurtulma"],
    "thievery": ["disable_device", "disable device", "open_lock", "open lock", "sleight_of_hand", "sleight of hand", "kilit açma", "tuzak bozma"],
    "diplomacy": ["diplomacy", "gather_information", "gather information", "sense_motive", "sense motive", "diplomasi", "bilgi toplama", "sezgi"],
    "linguistics": ["decipher_script", "decipher script", "forgery", "speak_language", "speak language", "yazı çözme", "sahtecilik"]
  },

  getSkillAliases(sKey, sName, character) {
    const aliases = new Set();
    const kNorm = (sKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nNorm = (sName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (kNorm) aliases.add(kNorm);
    if (nNorm) aliases.add(nNorm);

    const isMerged = character?.settings?.mergeSkills !== false;
    if (isMerged) {
      let mapping = null;
      const masterList = (typeof window !== 'undefined' && window.masterDb) || [];
      if (Array.isArray(masterList)) {
        const ruleObj = masterList.find(m => m && (m.name || '').toLowerCase().includes('skilleri birleştir') || (m.name || '').toLowerCase().includes('skill consolidation'));
        if (ruleObj && ruleObj.skillMapping && typeof ruleObj.skillMapping === 'object') {
          mapping = ruleObj.skillMapping;
        }
      }

      if (!mapping) {
        mapping = character?.settings?.skillMapping || this.DEFAULT_SKILL_MAPPING;
      }

      if (mapping) {
        for (const [groupKey, comps] of Object.entries(mapping)) {
          const gNorm = groupKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (gNorm === kNorm || kNorm.includes(gNorm) || gNorm.includes(kNorm) || nNorm.includes(gNorm) || gNorm.includes(nNorm)) {
            if (Array.isArray(comps)) {
              comps.forEach(c => {
                const cNorm = String(c).toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cNorm) aliases.add(cNorm);
              });
            }
          }
        }
      }
    }

    return Array.from(aliases);
  },

  /**
   * Evaluate specific skill bonus from equipped items, active buffs, feats, and race (Canonical V2 `modifiers` array).
   * Resolves D&D 3.5e stacking rules: same bonus types do not stack (take highest),
   * while different bonus types (Competence, Insight, Luck, Morale, Circumstance, Untyped, Racial) stack.
   * Zero heuristic description regexes.
   */
  evaluateSkillBonus(character, skillKey, skillName, statName) {
    if (!character) return { total: 0, breakdown: [] };
    const sName = (skillName || '').toLowerCase().trim();
    const sKey = (skillKey || '').toLowerCase().trim();
    const isKnowledge = sName.startsWith('knowledge') || sKey.startsWith('knowledge') || sName.includes('bilgi');
    const aliases = this.getSkillAliases(sKey, sName, character);
    const charLvl = Number(character.level) || 1;
    const evalCtx = { cl: charLvl, level: charLvl, bab: Number(character.bab) || 0 };

    const buckets = {};
    const addBonus = (sourceName, val, bType = 'untyped') => {
      const v = Number(val) || 0;
      if (v === 0) return;
      const type = (bType || 'untyped').toLowerCase().trim();
      if (!buckets[type]) buckets[type] = [];
      buckets[type].push({ name: sourceName, val: v });
    };

    // Helper to check if a V2 modifier target matches this skill
    const matchSkillModifiers = (modifiers, sourceTitle, defaultType = 'competence', ctx = evalCtx) => {
      if (!Array.isArray(modifiers)) return false;
      let matched = false;
      const baseKeyNorm = sKey.replace(/[^a-z0-9]/g, '');

      modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const rawTarget = String(mod.target).trim().toLowerCase();
        if (!rawTarget.startsWith('skill.') && !rawTarget.startsWith('skills.') && rawTarget !== 'skills') return;

        const subTarget = rawTarget.replace(/^skills?\./, '').trim();
        const tNorm = subTarget.replace(/[^a-z0-9]/g, '');
        const hasFormula = mod.formula !== undefined && mod.formula !== null && String(mod.formula).trim() !== '';
        const rawExpr = hasFormula ? mod.formula : mod.value;
        const val = Number(this.evaluateFormula(rawExpr, ctx)) || Number(mod.value) || 0;
        if (val === 0) return;
        const mType = mod.type || (val < 0 ? 'penalty' : defaultType);

        let applies = false;
        if (subTarget === 'all' || subTarget === 'skills' || tNorm === 'allskills') {
          applies = true;
        } else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm.includes('knowledge'))) {
          applies = true;
        } else if (tNorm && aliases.some(a => a && (a === tNorm || a.includes(tNorm) || tNorm.includes(a)))) {
          applies = true;
        }

        if (applies) {
          const label = (tNorm && tNorm !== 'all' && tNorm !== baseKeyNorm)
            ? `${sourceTitle} (${subTarget.replace(/_/g, ' ')})`
            : sourceTitle;
          addBonus(label, val, mType);
          matched = true;
        }
      });

      return matched;
    };

    // 1. Negative Level Skill Penalties (if any active buff has negativeLevels without explicit skill.all modifier)
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(rawBuff => {
        if (!rawBuff || !rawBuff.active) return;
        const buff = this.ensureV2Entry(rawBuff);
        const bCtx = { ...evalCtx, cl: Number(buff.casterLevel || charLvl) || charLvl };
        const hasSkillAllMod = matchSkillModifiers(buff.modifiers, buff.name || 'Buff', 'untyped', bCtx);
        if (buff.negativeLevels && !hasSkillAllMod) {
          addBonus(`${buff.name} (-${buff.negativeLevels} Lvl)`, -Number(buff.negativeLevels), 'penalty');
        }
      });
    }

    // 2. Body Slot Equipped Items (character.bodySlots)
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      Object.entries(character.bodySlots).forEach(([slotKey, item]) => {
        if (!item || item.active === false || !item.name || item.name === '-') return;
        this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus, character, aliases);
      });
    }

    // 3. Gear Pool Items (Equipped or Slotless Wondrous Items)
    if (Array.isArray(character.gearPool)) {
      character.gearPool.forEach(item => {
        if (!item || !item.name) return;
        const inBodySlot = character.bodySlots && Object.values(character.bodySlots).some(s => s && s.active !== false && (s.id === item.id || s.name === item.name));
        if (inBodySlot) return;
        const isSlotless = (item.slot || '').toLowerCase().includes('slotless') || (item.category || '').toLowerCase() === 'other' || (item.category || '').toLowerCase() === 'wondrous item';
        if (item.isEquipped || isSlotless) {
          this._checkItemSkillBonus(item, sKey, sName, isKnowledge, addBonus, character, aliases);
        }
      });
    }

    // 4. Feats & Special Abilities (Canonical V2 modifiers + Compendium lookup + Active Level Progression Boons/Feats)
    const progFeats = Array.isArray(character.levelProgression)
      ? character.levelProgression
          .filter(p => p && p.active !== false)
          .flatMap(p => [...(p.feats || []), ...(p.specialAbilities || [])])
      : [];
    const featsList = [...(character.feats || []), ...(character.specialAbilities || []), ...progFeats];
    const seenFeatNames = new Set();
    featsList.forEach(rawFeat => {
      if (!rawFeat) return;
      const featObj = typeof rawFeat === 'string' ? { name: rawFeat, category: 'Feat' } : this.ensureV2Entry(rawFeat);
      const rawFName = (featObj.name || '').trim();
      if (!rawFName) return;
      const fName = rawFName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
      if (!fName) return;
      const fKey = fName.toLowerCase();
      if (seenFeatNames.has(fKey)) return;
      seenFeatNames.add(fKey);

      const dbFeat = this.getMasterDbEntry(featObj) || this.getMasterDbEntry(fName);
      const mods = (Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0)
        ? featObj.modifiers
        : (dbFeat && Array.isArray(dbFeat.modifiers) ? dbFeat.modifiers : []);

      matchSkillModifiers(mods, fName, 'untyped', evalCtx);

      if (fName.toLowerCase().includes('collector of stories') && isKnowledge) {
        addBonus('Collector of Stories (Monster Lore)', 5, 'competence');
      }
    });

    // 5. Racial Skill Modifiers from Compendium Race entry
    if (character.race) {
      const raceObj = this.getMasterDbEntry(character.race, 'Race');
      if (raceObj && Array.isArray(raceObj.modifiers)) {
        matchSkillModifiers(raceObj.modifiers, `${raceObj.name || character.race} (Race)`, 'racial', evalCtx);
      }
    }

    // 5.2. Character Template Skill Modifiers from Canonical V2 Template entries (e.g. Lich/Vampire/Ghost +8 Hide/Listen/Spot/Search/Sense Motive/Move Silently)
    const activeTemplates = this.getCharacterActiveTemplateEntries(character);
    activeTemplates.forEach(tmpl => {
      if (tmpl && Array.isArray(tmpl.modifiers)) {
        matchSkillModifiers(tmpl.modifiers, `${tmpl.name} (Template)`, 'racial', evalCtx);
      }
    });

    // 5.5. Cleric Domain Skill Modifiers from Canonical V2 Domain entries (e.g. Artifice +4 Craft, Community +2 Diplomacy, Mind +2 Bluff/Diplomacy/Sense Motive)
    const activeDomains = this.getCharacterActiveDomainEntries(character);
    activeDomains.forEach(dom => {
      if (!dom || !Array.isArray(dom.modifiers) || dom.modifiers.length === 0) return;
      const alreadyAppliedViaAbility = featsList.some(f => {
        const fn = String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase();
        const fMods = typeof f === 'object' && Array.isArray(f?.modifiers) ? f.modifiers : [];
        return fn.includes(dom.name.toLowerCase()) && fMods.length > 0;
      });
      if (!alreadyAppliedViaAbility) {
        matchSkillModifiers(dom.modifiers, `${dom.name} Domain`, 'untyped', evalCtx);
      }
    });

    // 6. Resolve Stacking Rules (D&D 3.5e RAW)
    let total = 0;
    const breakdown = [];

    Object.entries(buckets).forEach(([type, entries]) => {
      if (type === 'untyped' || type === 'circumstance' || type === 'penalty' || type === 'racial') {
        entries.forEach(e => {
          total += e.val;
          breakdown.push(`${e.name}: ${e.val >= 0 ? '+' : ''}${e.val} (${type})`);
        });
      } else {
        let highest = entries[0];
        entries.forEach(e => {
          if (e.val > highest.val) highest = e;
        });
        total += highest.val;
        breakdown.push(`${highest.name}: +${highest.val} (${type})`);
      }
    });

    return { total, breakdown };
  },

  _checkItemSkillBonus(rawItem, sKey, sName, isKnowledge, addBonus, character = null, aliases = null) {
    if (!rawItem) return;
    const item = this.ensureV2Entry(rawItem);
    const skillAliases = aliases || this.getSkillAliases(sKey, sName, character);
    const baseKeyNorm = (sKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const charLvl = Number(character?.level) || 1;
    const evalCtx = { cl: charLvl, level: charLvl };

    const processV2SkillMods = (sourceObj, sourceTitle) => {
      if (!sourceObj || !Array.isArray(sourceObj.modifiers)) return false;
      let applied = false;
      sourceObj.modifiers.forEach(mod => {
        if (!mod || !mod.target) return;
        const rawTarget = String(mod.target).trim().toLowerCase();
        if (!rawTarget.startsWith('skill.') && !rawTarget.startsWith('skills.') && rawTarget !== 'skills') return;

        const subTarget = rawTarget.replace(/^skills?\./, '').trim();
        const tNorm = subTarget.replace(/[^a-z0-9]/g, '');
        const hasFormula = mod.formula !== undefined && mod.formula !== null && String(mod.formula).trim() !== '';
        const rawExpr = hasFormula ? mod.formula : mod.value;
        const val = Number(this.evaluateFormula(rawExpr, evalCtx)) || Number(mod.value) || 0;
        if (val === 0) return;
        const bType = mod.type || 'competence';

        let applies = false;
        if (subTarget === 'all' || subTarget === 'skills' || tNorm === 'allskills') applies = true;
        else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm.includes('knowledge'))) applies = true;
        else if (tNorm && skillAliases.some(a => a && (a === tNorm || a.includes(tNorm) || tNorm.includes(a)))) applies = true;

        if (applies) {
          const label = (tNorm && tNorm !== 'all' && tNorm !== baseKeyNorm)
            ? `${sourceTitle} (${subTarget.replace(/_/g, ' ')})`
            : sourceTitle;
          addBonus(label, val, bType);
          applied = true;
        }
      });
      return applied;
    };

    // 1. Check V2 modifiers on item itself
    let itemHandled = processV2SkillMods(item, item.name || 'Equipped Item');

    // 2. Check matching gearPool item
    if (!itemHandled && character && Array.isArray(character.gearPool)) {
      const pItem = character.gearPool.find(p => p && ((item.id && p.id === item.id) || (p.name && p.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim())));
      if (pItem) {
        itemHandled = processV2SkillMods(this.ensureV2Entry(pItem), item.name || pItem.name);
      }
    }

    // 3. Check Compendium / Master DB entry via O(1) lookup
    if (!itemHandled) {
      const dbEntry = this.getMasterDbEntry(item);
      if (dbEntry) {
        processV2SkillMods(dbEntry, item.name || dbEntry.name);
      }
    }
  },

  // D&D 3.5e Class Definitions Cache (Hydrated on-demand from database/srd_classes_races.json via SrdCompendium)
  DND35_CLASS_DEFS: {},

  getClassDef(className) {
    if (!className) return null;
    const lowerKey = String(className).toLowerCase().trim();
    if (this.DND35_CLASS_DEFS) {
      const cached = this.DND35_CLASS_DEFS[className] || this.DND35_CLASS_DEFS[lowerKey];
      if (cached && cached._v2Hydrated) {
        return cached;
      }
    }
    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const srdClass = (comp && typeof comp.getClass === 'function')
      ? comp.getClass(className)
      : null;
    let localDef = (this.DND35_CLASS_DEFS && (this.DND35_CLASS_DEFS[className] || this.DND35_CLASS_DEFS[lowerKey])) || null;
    if (!localDef && !srdClass && typeof window !== 'undefined' && typeof window.getAvailableClassDefs === 'function') {
      const availDefs = window.getAvailableClassDefs();
      if (availDefs) {
        const matchedAvailKey = availDefs[className] ? className : Object.keys(availDefs).find(k => k.toLowerCase().trim() === lowerKey);
        if (matchedAvailKey) localDef = availDefs[matchedAvailKey];
      }
    }
    if (!localDef && !srdClass) return null;
    if (!srdClass) {
      localDef._v2Hydrated = true;
      if (this.DND35_CLASS_DEFS) {
        this.DND35_CLASS_DEFS[className] = localDef;
        this.DND35_CLASS_DEFS[lowerKey] = localDef;
      }
      return localDef;
    }
    const babRate = Number(srdClass.bab) || (srdClass.babProgression === 'high' ? 1.0 : (srdClass.babProgression === 'med' || srdClass.babProgression === 'medium' ? 0.75 : 0.5));
    const fortSave = srdClass.fort || (srdClass.savingThrows?.fort === 'high' ? 'good' : 'poor');
    const refSave = srdClass.ref || (srdClass.savingThrows?.ref === 'high' ? 'good' : 'poor');
    const willSave = srdClass.will || (srdClass.savingThrows?.will === 'high' ? 'good' : 'poor');
    const hdNum = Number(String(srdClass.hitDie || srdClass.hd || 8).replace(/[^0-9]/g, '')) || 8;
    const skillPts = Number(srdClass.skillPointsPerLevel || srdClass.skills) || 2;
    const merged = Object.assign({}, localDef || {}, {
      _v2Hydrated: true,
      hd: hdNum,
      bab: babRate,
      fort: fortSave,
      ref: refSave,
      will: willSave,
      skills: skillPts,
      maxLevel: Number(srdClass.maxLevel) || (localDef?.maxLevel) || (srdClass.isPrestige || srdClass.category === 'Prestige' ? 10 : 20),
      features: (srdClass.features && Object.keys(srdClass.features).length > 0) ? srdClass.features : (localDef?.features || {}),
      bonusFeatLevels: Array.isArray(srdClass.bonusFeatLevels) && srdClass.bonusFeatLevels.length > 0 ? srdClass.bonusFeatLevels : (localDef?.bonusFeatLevels || []),
      bonusFeatContract: srdClass.bonusFeatContract || localDef?.bonusFeatContract || null,
      bonusFeatContracts: srdClass.bonusFeatContracts || localDef?.bonusFeatContracts || null,
      prerequisites: Array.isArray(srdClass.prerequisites) && srdClass.prerequisites.length > 0 ? srdClass.prerequisites : (localDef?.prerequisites || []),
      classSkills: Array.isArray(srdClass.classSkills) && srdClass.classSkills.length > 0 ? srdClass.classSkills : (localDef?.classSkills || [])
    });
    if (this.DND35_CLASS_DEFS && srdClass.name) {
      this.DND35_CLASS_DEFS[srdClass.name] = merged;
      this.DND35_CLASS_DEFS[String(srdClass.name).toLowerCase().trim()] = merged;
    }
    if (this.DND35_CLASS_DEFS) {
      this.DND35_CLASS_DEFS[className] = merged;
      this.DND35_CLASS_DEFS[lowerKey] = merged;
    }
    return merged;
  },

  // Get slot contract for bonus feats
  getClassBonusFeatContract(className, classLevel) {
    const def = this.getClassDef(className);
    if (!def) return null;
    const cl = Number(classLevel) || 1;
    if (def.bonusFeatContracts && def.bonusFeatContracts[cl]) return def.bonusFeatContracts[cl];
    if (def.bonusFeatContract) return def.bonusFeatContract;
    return null;
  },

  // Get granted class features, bonus feats and Slot Contract for a given class and level
  getClassLevelFeatures(className, classLevel) {
    const def = this.getClassDef(className);
    if (!def) return { features: [], featureObjects: [], hasBonusFeat: false, bonusFeatContract: null };
    const cl = Number(classLevel) || 1;
    const rawFeatures = (def.features && (def.features[cl] || def.features[String(cl)])) ? (def.features[cl] || def.features[String(cl)]) : [];
    const features = rawFeatures.map(f => (typeof f === 'string' ? f : f.name));
    const featureObjects = rawFeatures.map(f => (typeof f === 'string' ? { name: f, benefit: '' } : f));
    const hasBonusFeat = Array.isArray(def.bonusFeatLevels) && def.bonusFeatLevels.includes(cl);

    let bonusFeatContract = null;
    if (hasBonusFeat) {
      bonusFeatContract = this.getClassBonusFeatContract(className, cl);
      if (!bonusFeatContract) {
        if (className === 'Fighter') {
          bonusFeatContract = {
            mode: 'tag',
            tag: 'isFighterBonusFeat',
            filter: 'FIGHTER',
            label: `Fighter Class Bonus Feat (Level ${cl})`,
            desc: 'Select a combat feat from the Fighter bonus feat list.'
          };
        } else {
          bonusFeatContract = {
            mode: 'tag',
            tag: 'isFighterBonusFeat',
            filter: 'FIGHTER',
            label: `${className} Class Bonus Feat`,
            desc: `Valid bonus feat for the ${className} class.`
          };
        }
      }
    }

    return { features, featureObjects, hasBonusFeat, bonusFeatContract };
  },

  // D&D 3.5e Fractional BAB & Save Progression Calculator (Unearthed Arcana)
  calculateProgression(levelProgression = [], options = {}) {
    const system = options.system || 'fractional'; // 'fractional' or 'standard'
    const isHuman = options.isHuman ?? true;
    const intMod = Number(options.intMod) || 0;

    let activeLevels = 0;
    let plannedLevels = levelProgression.length;
    let baseHp = 0;
    let totalBabFractional = 0;
    let totalFortFractional = 0;
    let totalRefFractional = 0;
    let totalWillFractional = 0;

    let goodFortGranted = false;
    let goodRefGranted = false;
    let goodWillGranted = false;

    const classCounts = {};
    let totalSkillPts = 0;
    const activeFeats = [];
    const activeSpecialAbilities = [];

    levelProgression.forEach((lvl, index) => {
      const isActive = lvl.active !== false;
      if (!isActive) return;

      activeLevels++;
      baseHp += Number(lvl.hpGain) || 0;

      const cName = lvl.className || 'Warblade';
      const cDef = this.getClassDef(cName) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };
      classCounts[cName] = (classCounts[cName] || 0) + 1;

      // Fractional BAB
      totalBabFractional += cDef.bab;

      // Fractional Saves
      if (cDef.fort === 'good') {
        totalFortFractional += (goodFortGranted ? 0.5 : 2.5);
        goodFortGranted = true;
      } else {
        totalFortFractional += (1 / 3);
      }

      if (cDef.ref === 'good') {
        totalRefFractional += (goodRefGranted ? 0.5 : 2.5);
        goodRefGranted = true;
      } else {
        totalRefFractional += (1 / 3);
      }

      if (cDef.will === 'good') {
        totalWillFractional += (goodWillGranted ? 0.5 : 2.5);
        goodWillGranted = true;
      } else {
        totalWillFractional += (1 / 3);
      }

      // Skill Points
      const baseSkill = cDef.skills || 2;
      if (activeLevels === 1) {
        totalSkillPts += Math.max(4, (baseSkill + intMod) * 4) + (isHuman ? 4 : 0);
      } else {
        totalSkillPts += Math.max(1, baseSkill + intMod) + (isHuman ? 1 : 0);
      }

      // Collect active feats & abilities
      if (Array.isArray(lvl.feats)) {
        lvl.feats.forEach(f => activeFeats.push(f));
      }
      if (Array.isArray(lvl.specialAbilities)) {
        lvl.specialAbilities.forEach(a => activeSpecialAbilities.push(a));
      }
    });

    let finalBab = 0;
    let finalFort = 0;
    let finalRef = 0;
    let finalWill = 0;

    if (system === 'fractional') {
      finalBab = Math.floor(totalBabFractional + 1e-6);
      finalFort = Math.floor(totalFortFractional + 1e-6);
      finalRef = Math.floor(totalRefFractional + 1e-6);
      finalWill = Math.floor(totalWillFractional + 1e-6);
    } else {
      // Standard Core 3.5e: sum table values for each class
      Object.entries(classCounts).forEach(([cName, count]) => {
        const cDef = this.getClassDef(cName) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good' };
        if (cDef.bab === 1.0) finalBab += count;
        else if (cDef.bab === 0.75) finalBab += Math.floor(count * 0.75);
        else finalBab += Math.floor(count * 0.5);

        finalFort += (cDef.fort === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
        finalRef += (cDef.ref === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
        finalWill += (cDef.will === 'good' ? 2 + Math.floor(count * 0.5) : Math.floor(count / 3));
      });
    }

    return {
      activeLevels,
      plannedLevels,
      baseHp,
      baseBab: finalBab,
      baseSaves: { fort: finalFort, ref: finalRef, will: finalWill },
      totalSkillPoints: totalSkillPts,
      fractional: {
        bab: totalBabFractional,
        fort: totalFortFractional,
        ref: totalRefFractional,
        will: totalWillFractional
      },
      classCounts,
      activeFeats,
      activeSpecialAbilities
    };
  },

  // D&D 3.5e PHB Table 1-1 Bonus Spells & Class Spells Per Day Calculator (Canonical V2)
  getClassSpellSlots(className, classLevel = 1, abilityScore = 10) {
    const cl = Math.max(1, Math.min(20, Number(classLevel) || 1));
    const score = Number(abilityScore) || 10;
    const mod = this.getAbilityMod(score);

    const classEntry = this.getMasterDbEntry(className, 'Class')
      || this.getMasterDbEntry(`class_${String(className || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, 'Class');

    const rawMatrix = classEntry?.classStats?.spellsPerDay || classEntry?.spellsPerDay || null;
    const baseRow = (rawMatrix && typeof rawMatrix === 'object')
      ? (rawMatrix[String(cl)] || rawMatrix[cl] || null)
      : null;

    const slotsByLevel = {};
    if (!baseRow || typeof baseRow !== 'object') {
      return {
        hasSpellcasting: false,
        className,
        classLevel: cl,
        abilityScore: score,
        abilityMod: mod,
        slotsByLevel
      };
    }

    Object.entries(baseRow).forEach(([lvlKey, baseSlots]) => {
      const sLvl = Number(lvlKey);
      if (isNaN(sLvl) || baseSlots === null || baseSlots === undefined || baseSlots === '-') return;
      const baseCount = Number(baseSlots);
      if (isNaN(baseCount) || baseCount < 0) return;

      // PHB p. 17: To cast a spell of level X, caster must have ability score >= 10 + X
      const canCastLevel = score >= (10 + sLvl);
      if (!canCastLevel) {
        slotsByLevel[sLvl] = { base: baseCount, bonus: 0, total: 0, lockedByAbilityScore: true };
        return;
      }

      // PHB Table 1-1: Bonus spells for spell levels 1–9 (0-level cantrips/orisons never get bonus spells)
      let bonusSlots = 0;
      if (sLvl >= 1 && mod >= sLvl) {
        // Only grant bonus spells if base slots > 0 (or if baseSlots === 0 for Rangers/Paladins who gain 0+bonus)
        bonusSlots = Math.floor((mod - sLvl + 4) / 4);
      }

      slotsByLevel[sLvl] = {
        base: baseCount,
        bonus: bonusSlots,
        total: baseCount + bonusSlots,
        lockedByAbilityScore: false
      };
    });

    return {
      hasSpellcasting: Object.keys(slotsByLevel).length > 0,
      className: classEntry?.name || className,
      classLevel: cl,
      abilityScore: score,
      abilityMod: mod,
      slotsByLevel
    };
  },

  // D&D 3.5e 8-Hour Long Rest & Daily Resource Recovery Engine (PHB p. 146 & p. 177)
  performLongRest(character, options = {}) {
    if (!character) return null;
    const fullBedRest = !!options.fullBedRest; // 24-hour full bed rest heals 2x level
    const healToFull = !!options.healToFull;   // Optional DM house rule toggle
    const charLvl = Math.max(1, Number(character.level) || 1);

    const summary = {
      hpHealed: 0,
      newHp: 0,
      maxHp: 0,
      spellsReset: 0,
      dailyChargesReset: 0,
      expiredBuffsDeactivated: []
    };

    // 1. Natural HP Healing (1 HP per character level per 8-hour rest, or 2 HP/lvl for full bed rest)
    if (character.hp) {
      const maxHp = Number(character.hp.max) || 10;
      const curHp = Number(character.hp.current) || 0;
      const healAmount = healToFull ? Math.max(0, maxHp - curHp) : (fullBedRest ? charLvl * 2 : charLvl);
      const nextHp = Math.min(maxHp, curHp + healAmount);
      summary.hpHealed = Math.max(0, nextHp - curHp);
      character.hp.current = nextHp;
      character.hp.temp = 0; // Temporary HP from short buffs expires overnight
      summary.newHp = nextHp;
      summary.maxHp = maxHp;
    }

    // 2. Deactivate Short-Duration Buffs (round, minute, hour); keep permanent/day/condition until manually cleared
    if (Array.isArray(character.buffs)) {
      character.buffs.forEach(b => {
        if (!b || !b.active) return;
        const durCat = String(b.durationCategory || '').toLowerCase();
        const isShortBuff = !b.isCondition && !b.isDebuff && (durCat === 'round' || durCat === 'minute' || durCat === 'hour');
        // Fatigue converts to normal after 8 hours of complete rest; Exhausted becomes Fatigued after 1 hour
        if (b.id === 'cond_fatigued' || (b.name || '').toLowerCase().includes('fatigued')) {
          b.active = false;
          summary.expiredBuffsDeactivated.push(b.name);
        } else if (isShortBuff) {
          b.active = false;
          summary.expiredBuffsDeactivated.push(b.name);
        }
      });
    }

    // 3. Reset Daily Spell Slots / Cast Counts & Martial Maneuvers
    if (Array.isArray(character.spells)) {
      character.spells.forEach(s => {
        if (!s) return;
        if (s.castCount) {
          s.castCount = 0;
          summary.spellsReset++;
        }
        if (s.expended) {
          s.expended = false;
          summary.spellsReset++;
        }
        if (s.usedSlots) {
          s.usedSlots = 0;
          summary.spellsReset++;
        }
      });
    }
    if (character.spellSlots && typeof character.spellSlots === 'object') {
      Object.values(character.spellSlots).forEach(slotObj => {
        if (slotObj && typeof slotObj === 'object') {
          if (slotObj.used !== undefined) slotObj.used = 0;
          if (slotObj.current !== undefined && slotObj.max !== undefined) slotObj.current = slotObj.max;
        }
      });
    }

    // 4. Reset Daily Charges on Special Abilities, Feats & Equipped Items
    const resetChargeList = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach(entry => {
        if (!entry || typeof entry !== 'object') return;
        if (entry.maxCharges && entry.charges !== undefined && entry.rechargePeriod !== 'never') {
          entry.charges = entry.maxCharges;
          summary.dailyChargesReset++;
        }
        if (entry.usesPerDay && entry.usedToday !== undefined) {
          entry.usedToday = 0;
          summary.dailyChargesReset++;
        }
      });
    };
    resetChargeList(character.specialAbilities);
    resetChargeList(character.feats);
    resetChargeList(character.gearPool);
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      resetChargeList(Object.values(character.bodySlots));
    }

    // 5. Reset Tactical Action Economy
    if (character.tactical) {
      character.tactical.spentActions = {
        standard: false,
        move: false,
        fullRound: false,
        swift: false,
        immediate: false
      };
    }

    // 6. Recalculate Character State
    this.recalculateCharacter(character, (typeof masterDb !== 'undefined' ? masterDb : []));
    return summary;
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
} else if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
