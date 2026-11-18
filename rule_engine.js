/**
 * D&D 3.5e Declarative Rule, Modifier & Stacking Engine
 * Handles ability modifiers, RAW stacking rules, dynamic feat mechanics,
 * 14 body slot equipment bonuses, active buffs with round countdowns,
 * Armor Class evaluation (Normal, Touch, Flat-Footed), and saving throws.
 */

if (typeof SrdCompendium === 'undefined' && typeof require === 'function') {
  try { require('./srd_compendium.js'); } catch (_) {}
}
const _loadedDnd35Ruleset = (typeof window !== 'undefined' && window.DnD35Ruleset)
  ? window.DnD35Ruleset
  : ((typeof globalThis !== 'undefined' && globalThis.DnD35Ruleset)
    ? globalThis.DnD35Ruleset
    : (typeof require === 'function' ? (() => { try { return require('./rulesets/dnd35.js'); } catch (_) { return null; } })() : null));

const RuleEngine = {
  // Canonical persisted entry type / source / category string for campaign grants
  HOMEBREW_TYPE: 'Homebrew',
  // Pluggable Ruleset Registry (loaded from `rulesets/*.js`, D&D 3.5e Official RAW default)
  rulesets: {
    dnd35: _loadedDnd35Ruleset || {
      id: 'dnd35',
      name: 'D&D 3.5e Official RAW',
      stackingBonusTypes: ['dodge', 'circumstance', 'racial', 'untyped', 'synergy'],
      consolidatedSkillBonusMode: 'single_highest',
      actionEconomy: 'standard_move_swift',
      srdArmors: {},
      srdShields: {},
      classProficiencies: {},
      calcMaxSkillRanks(level, isClassSkill) {
        const maxCls = Math.max(1, Number(level) || 1) + 3;
        return isClassSkill ? maxCls : maxCls / 2;
      },
      calcSkillPointCost(isClassSkill) { return isClassSkill ? 1 : 2; },
      calcIterativeBab(bab) {
        const b = Math.max(0, Math.floor(Number(bab) || 0));
        const out = [b];
        let cur = b - 5;
        while (cur >= 1 && out.length < 4) { out.push(cur); cur -= 5; }
        return out;
      },
      calcGrapple(bab, strMod, sizeMod, misc) {
        return (Number(bab) || 0) + (Number(strMod) || 0) + (Number(sizeMod) || 0) + (Number(misc) || 0);
      }
    }
  },

  getActiveRuleset(character) {
    const ch = character || this._activeCharacter || (typeof window !== 'undefined' ? window.character : null);
    return this.rulesets[(ch && ch.ruleset) || 'dnd35'] || this.rulesets.dnd35;
  },

  // Calculate D&D 3.5e Ability Modifier: floor((score - 10) / 2)
  getAbilityMod(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  },

  // Normalize human shorthand formula tokens (e.g. "10+lvl+Con", "10 + 1/2 lvl + Cha", V3 @CL/@ML/@IL/@HD/@ECL/@STR..@CHA/@essentia/@augmentPP) into Canonical @tokens
  normalizeFormulaTokens(formulaStr) {
    if (formulaStr === null || formulaStr === undefined) return '';
    let s = String(formulaStr).trim();
    if (!s) return '';
    s = s
      .replace(/^dc\s*[:=]?\s*/i, '')
      // "spell level" first, so the plain "level" rules below never turn it into character level.
      // Not inside a dotted runtime token such as @input.spellLevel.
      .replace(/(?<![a-zA-Z@.])spell[\s_]*level\b/gi, '@spellLevel')
      .replace(/@spell_?level\b/gi, '@spellLevel')
      .replace(/\b1\s*\/\s*2\s*(?:@?level|@?lvl|@?hd)\b/gi, 'floor(@level / 2)')
      .replace(/\bhalf\s+(?:@?level|@?lvl|@?hd)\b/gi, 'floor(@level / 2)')
      // Not inside an already-normalized floor(@level / 2), and not the tail of a longer token (@classLevel / 2).
      .replace(/(?<!floor\()(?<!floor\(@)(?<![a-zA-Z.])(?:@?level|@?lvl|@?hd)\s*\/\s*2\b/gi, 'floor(@level / 2)')
      .replace(/@(?:lvl|level|hd)\b/gi, '@level')
      .replace(/@cl\b/gi, '@cl')
      .replace(/@ml\b/gi, '@ml')
      .replace(/@il\b/gi, '@il')
      .replace(/@ebl\b/gi, '@ebl')
      .replace(/@ecl\b/gi, '@ecl')
      .replace(/@bab\b/gi, '@bab')
      .replace(/@(?:essentia|invested)\b/gi, '@essentia')
      .replace(/@(?:augmentpp|augment_pp)\b/gi, '@augmentPP')
      .replace(/@(?:uses_today|caststoday|casts_today)\b/gi, '@castsToday')
      .replace(/@(?:targetcr|target_cr|cr)\b/gi, '@targetCR')
      .replace(/@(?:classlevel|class_level)\b/gi, '@classLevel')
      .replace(/@(warblade|paladin|monk|barbarian|rogue|swashbuckler|fighter|cleric|bard|ranger|sorcerer|wizard|druid|psion|wilder|incarnate|totemist|binder|shadowcaster|truenamer|swordsage|crusader)_?level\b/gi, (_, c) => `@${c.toLowerCase()}Level`)
      .replace(/@str(?:mod)?\b/gi, '@strMod')
      .replace(/@dex(?:mod)?\b/gi, '@dexMod')
      .replace(/@con(?:mod)?\b/gi, '@conMod')
      .replace(/@int(?:mod)?\b/gi, '@intMod')
      .replace(/@wis(?:mod)?\b/gi, '@wisMod')
      .replace(/@cha(?:mod)?\b/gi, '@chaMod')
      .replace(/(?<![a-zA-Z@.])(?:lvl|level|hd)\b/gi, '@level')
      .replace(/(?<![a-zA-Z@.])(?:cl|caster\s*level)\b/gi, '@cl')
      .replace(/(?<![a-zA-Z@.])(?:ml|manifester\s*level)\b/gi, '@ml')
      .replace(/(?<![a-zA-Z@.])(?:il|initiator\s*level)\b/gi, '@il')
      .replace(/(?<![a-zA-Z@.])(?:ebl|binder\s*level)\b/gi, '@ebl')
      .replace(/(?<![a-zA-Z@.])ecl\b/gi, '@ecl')
      .replace(/(?<![a-zA-Z@.])bab\b/gi, '@bab')
      .replace(/(?<![a-zA-Z@.])essentia\b/gi, '@essentia')
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
    const ch = character || this._activeCharacter || (typeof window !== 'undefined' ? window.character : null) || {};
    const hasProgRows = Array.isArray(ch.levelProgression) && ch.levelProgression.length > 0;
    const activeProg = hasProgRows
      ? ch.levelProgression.filter(r => r && r.active !== false)
      : [];
    const level = hasProgRows ? activeProg.length : (Math.max(1, Number(ch.level) || 1));
    const cl = Math.max(1, Number(ch.spellcasting?.cl ?? ch.casterLevel) || level);
    const ml = Math.max(1, Number(ch.psionics?.manifesterLevel ?? ch.psionics?.ml ?? ch.manifesterLevel) || cl);
    const il = Math.max(1, Number(ch.initiatorLevel ?? ch.martial?.initiatorLevel) || level);
    const ebl = Math.max(1, Number(ch.pactMagic?.effectiveBinderLevel ?? ch.pact?.effectiveBinderLevel ?? ch.pactMagic?.binderLevel) || level);
    const ecl = Math.max(level, Number(ch.ecl) || (level + (Number(ch.levelAdjustment) || 0)));
    const bab = Number(ch.bab) || 0;

    const classLevels = {};
    const addClassLvl = (rawName, count) => {
      const rawC = String(rawName || '').toLowerCase().trim();
      const cnt = Number(count) || 0;
      if (!rawC || cnt <= 0) return;
      classLevels[rawC] = (classLevels[rawC] || 0) + cnt;
      const cKey = rawC.replace(/[\s-]+/g, '_');
      if (cKey !== rawC) classLevels[cKey] = classLevels[rawC];
      const hyphKey = rawC.replace(/\s+/g, '-');
      if (hyphKey !== rawC && hyphKey !== cKey) classLevels[hyphKey] = classLevels[rawC];
      const strippedBase = rawC.replace(/\s*\([^)]+\)\s*/g, '').trim();
      if (strippedBase && strippedBase !== rawC) {
        classLevels[strippedBase] = (classLevels[strippedBase] || 0) + cnt;
      }
    };

    if (hasProgRows) {
      activeProg.forEach(r => {
        addClassLvl(r.className || r.class || '', 1);
      });
    } else {
      if (ch.classLevels && typeof ch.classLevels === 'object' && !Array.isArray(ch.classLevels)) {
        Object.entries(ch.classLevels).forEach(([k, v]) => addClassLvl(k, Number(v) || 0));
      } else if (Array.isArray(ch.classes)) {
        ch.classes.forEach(c => {
          if (typeof c === 'string') addClassLvl(c, Number(ch.level) || 1);
          else if (c && typeof c === 'object') addClassLvl(c.name || c.className || c.class || '', Number(c.level) || 1);
        });
      } else if (typeof ch.classes === 'string' && ch.classes.trim()) {
        const parts = ch.classes.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
        parts.forEach(part => {
          const numMatch = part.match(/(\d+)/);
          const lvl = numMatch ? (parseInt(numMatch[1], 10) || 1) : (parts.length === 1 ? (Number(ch.level) || 1) : 1);
          const cName = part.replace(/\d+/g, '').replace(/\b(?:lvl|level)\b/gi, '').trim();
          if (cName) addClassLvl(cName, lvl);
        });
      } else if (typeof ch.class === 'string' && ch.class.trim()) {
        addClassLvl(ch.class, Number(ch.level) || 1);
      }
    }

    const getClsLvl = (clsKey) => {
      const k = String(clsKey || '').toLowerCase().trim();
      if (!k) return 0;
      if (typeof classLevels[k] === 'number') return classLevels[k];
      const uKey = k.replace(/[\s-]+/g, '_');
      if (typeof classLevels[uKey] === 'number') return classLevels[uKey];
      return 0;
    };

    const nonabSet = new Set(
      []
        .concat(Array.isArray(ch.nonabilities) ? ch.nonabilities : [])
        .concat(Array.isArray(ch.monster?.nonabilities) ? ch.monster.nonabilities : [])
        .map(k => String(k || '').toLowerCase().trim())
    );

    const getMod = (key) => {
      if (nonabSet.has(key)) return 0;
      if (ch.evaluatedAbilities && ch.evaluatedAbilities[key] && typeof ch.evaluatedAbilities[key].mod === 'number') {
        return ch.evaluatedAbilities[key].mod;
      }
      const rawAbi = ch.abilities && ch.abilities[key];
      if (rawAbi === null) return 0;
      if (rawAbi && typeof rawAbi === 'object') {
        if (rawAbi.nonability) return 0;
        if (typeof rawAbi.mod === 'number') return rawAbi.mod;
        const tot = Number(rawAbi.total ?? rawAbi.score ?? rawAbi.base ?? 10);
        const tmp = Number(rawAbi.temp) || 0;
        return this.getAbilityMod(tot + (rawAbi.total !== undefined ? 0 : tmp));
      }
      if (typeof rawAbi === 'number') return this.getAbilityMod(rawAbi);
      if (ch.stats && typeof ch.stats[key] === 'number') return this.getAbilityMod(ch.stats[key]);
      return 0;
    };

    const activeBuffsForCtx = [
      ...(Array.isArray(ch.buffs) ? ch.buffs.filter(b => b && b.active) : []),
      ...(Array.isArray(ch.activeLegoBuffs) ? ch.activeLegoBuffs.filter(b => b && b.active !== false) : [])
    ];
    let buffFlatFooted = false;
    let buffLoseDex = false;
    activeBuffsForCtx.forEach(b => {
      const bId = String(b.id || '').toLowerCase().split(':').pop();
      const bName = String(b.name || '').toLowerCase().trim();
      const rf = b.ruleFlags || {};
      if (bId === 'cnd-flat-footed' || bName === 'flat-footed' || bName === 'flat footed' || rf.flatFooted) {
        buffFlatFooted = true;
      }
      if (rf.loseDexToAC && bId !== 'cnd-flat-footed' && bName !== 'flat-footed' && bName !== 'flat footed') {
        buffLoseDex = true;
      }
      if (rf.effectiveDexZero || bId === 'cnd-blinded' || bId === 'cnd-stunned' || bId === 'cnd-cowering' || bId === 'cnd-pinned' || bId === 'cnd-helpless' || bId === 'cnd-paralyzed') {
        buffLoseDex = true;
      }
    });
    const flatFooted = Boolean(
      extra.flatFooted !== undefined ? extra.flatFooted : (
        ch.flatFooted || ch.isFlatFooted || ch.tactical?.flatFooted || ch.ruleFlags?.flatFooted || buffFlatFooted
      )
    );
    const loseDexToAC = Boolean(
      extra.loseDexToAC !== undefined ? extra.loseDexToAC : (
        ch.loseDexToAC || ch.tactical?.loseDexToAC || ch.ruleFlags?.loseDexToAC || ch.ruleFlags?.effectiveDexZero || buffLoseDex
      )
    );

    const selfObj = extra.self || { stacks: 1, invested: Number(extra.essentia ?? extra.invested ?? 0) || 0 };
    const essentia = Number(extra.essentia ?? selfObj.invested ?? 0) || 0;
    const augmentPP = Number(extra.augmentPP ?? 0) || 0;
    const castsToday = Number(extra.castsToday ?? extra.usesToday ?? 0) || 0;
    const targetCR = Number(extra.targetCR ?? ch.truenaming?.targetCR ?? level) || 1;
    const classLevel = Number(extra.classLevel ?? level) || 1;
    const soulmeldsCount = Number(
      extra.soulmeldsCount
      ?? (Array.isArray(ch.incarnum?.soulmelds) ? ch.incarnum.soulmelds.filter(s => s && s.shaped !== false).length : undefined)
      ?? (Array.isArray(ch.soulmelds) ? ch.soulmelds.length : undefined)
      ?? ch.soulmeldsCount
      ?? 0
    ) || 0;
    const baseSlots = Number(extra.baseSlots ?? 0) || 0;

    return Object.assign({
      character: ch,
      level,
      hd: level,
      ecl,
      cl,
      casterLevel: cl,
      ml,
      manifesterLevel: ml,
      il,
      initiatorLevel: il,
      ebl,
      effectiveBinderLevel: ebl,
      classLevel,
      warbladeLevel: getClsLvl('warblade'),
      paladinLevel: getClsLvl('paladin'),
      monkLevel: getClsLvl('monk'),
      barbarianLevel: getClsLvl('barbarian'),
      rogueLevel: getClsLvl('rogue'),
      swashbucklerLevel: getClsLvl('swashbuckler'),
      fighterLevel: getClsLvl('fighter'),
      clericLevel: getClsLvl('cleric'),
      bardLevel: getClsLvl('bard'),
      rangerLevel: getClsLvl('ranger'),
      bab,
      essentia,
      augmentPP,
      castsToday,
      targetCR,
      soulmeldsCount,
      baseSlots,
      flatFooted,
      loseDexToAC,
      strMod: getMod('str'),
      dexMod: getMod('dex'),
      conMod: getMod('con'),
      intMod: getMod('int'),
      wisMod: getMod('wis'),
      chaMod: getMod('cha'),
      classLevels,
      skills: ch.skills || {},
      state: ch.legoState || ch.state || {},
      tactical: ch.tactical || {},
      activeModes: ch.activeModes || {},
      customEntries: ch.customEntries || {},
      inputs: extra.inputs || {},
      self: selfObj,
      spells: ch.spells || ch.spellcasting || {}
    }, extra);
  },

  // Build V3 formula evaluation context with active class levels (@warbladeLevel, @paladinLevel, etc.) and entry-associated @classLevel
  buildV3FormulaContext(character, entry = null, options = {}) {
    const baseCtx = this.buildFormulaContext(character, options || {});
    // @spellLevel: an explicit spellLevel, else the level of a spell entry.
    if (entry && typeof entry === 'object' && options?.spellLevel === undefined) {
      const isSpellEntry = String(entry.blueprint || '').toLowerCase() === 'spell' || String(entry.type || '').toLowerCase() === 'spell';
      const sl = Number(entry.spellLevel ?? (isSpellEntry ? entry.level : undefined));
      if (Number.isFinite(sl) && sl >= 0) baseCtx.spellLevel = sl;
    }
    if (entry && typeof entry === 'object' && options?.classLevel === undefined) {
      let assocClass = '';
      if (typeof entry.sourceClass === 'string' && entry.sourceClass.trim()) {
        assocClass = entry.sourceClass.trim();
      } else if (Array.isArray(entry.associations) && entry.associations.length > 0) {
        const firstAssoc = entry.associations[0];
        assocClass = typeof firstAssoc === 'string'
          ? firstAssoc.trim()
          : String(firstAssoc?.className || firstAssoc?.class || firstAssoc?.name || '').trim();
      } else if (entry.associations && typeof entry.associations === 'object') {
        assocClass = String(entry.associations.className || entry.associations.class || entry.associations.name || '').trim();
      }
      if (assocClass) {
        const cKey = assocClass.toLowerCase().replace(/\s*\([^)]+\)\s*/g, '').trim();
        const uKey = cKey.replace(/[\s-]+/g, '_');
        const resolvedClsLvl = baseCtx.classLevels?.[cKey] ?? baseCtx.classLevels?.[uKey];
        if (typeof resolvedClsLvl === 'number') {
          baseCtx.classLevel = resolvedClsLvl;
        }
      }
    }
    return baseCtx;
  },

  // Evaluate an ability or entry's Save DC formula against live character stats
  evaluateAbilitySaveDc(entryOrFormula, character) {
    const rawFormula = (entryOrFormula && typeof entryOrFormula === 'object')
      ? (entryOrFormula.dcFormula || entryOrFormula.saveDcFormula || (entryOrFormula.save && entryOrFormula.save.dcFormula) || '')
      : String(entryOrFormula || '');
    const normFormula = this.normalizeFormulaTokens(rawFormula);
    if (!normFormula) return null;
    const dcSpellLevel = (entryOrFormula && typeof entryOrFormula === 'object') ? Number(entryOrFormula.spellLevel) : NaN;
    const ctx = this.buildFormulaContext(character, Number.isFinite(dcSpellLevel) ? { spellLevel: dcSpellLevel } : {});
    const dc = Math.floor(Number(this.evaluateFormula(normFormula, ctx)) || 0);
    if (dc <= 0) return null;

    const breakdownParts = normFormula
      .replace(/floor\(\s*@level\s*\/\s*2\s*\)/gi, `${Math.floor(ctx.level / 2)} [1/2 Lvl]`)
      .replace(/@spellLevel\b/gi, `${Number(ctx.spellLevel) || 0} Spell Lvl`)
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

  // ── Formula registry: the single source of truth for authoring tokens and functions ──────────────────────
  // evaluateFormula resolves every scalar token through FORMULA_VARS (`key` -> _resolveFormulaScalars) and every
  // function through FORMULA_FUNCS (`impl`), so Rule Crafter / UI token pickers cannot drift from the evaluator.
  // `pattern: true` rows are token families (placeholder shown in angle brackets) resolved by evaluateFormula.
  FORMULA_VARS: [
    { token: '@level', aliases: ['@lvl'], key: 'level', label: 'Character Level', group: 'Levels', desc: 'Total character level (Hit Dice from class levels).', example: '10 + floor(@level / 2) + @chaMod' },
    { token: '@halfLevel', key: 'halfLevel', label: 'One-Half Character Level', group: 'Levels', desc: 'floor(@level / 2), as in the standard save DC formula.', example: '10 + @halfLevel + @conMod' },
    { token: '@hd', key: 'hd', label: 'Hit Dice', group: 'Levels', desc: 'Hit Dice of the creature (equals character level for most characters).', example: '10 + floor(@hd / 2) + @conMod' },
    { token: '@ecl', key: 'ecl', label: 'Effective Character Level', group: 'Levels', desc: 'Character level plus level adjustment.', example: '@ecl' },
    { token: '@classLevel', aliases: ['@class_level'], key: 'classLevel', label: 'Class Level', group: 'Levels', desc: 'Level in the class that grants this feature.', example: 'floor(@classLevel / 2)' },
    { token: '@<class>Level', pattern: true, label: 'Class Level (named class)', group: 'Levels', desc: 'Level in a named class, e.g. @paladinLevel, @warbladeLevel; 0 when the character has none.', example: '@paladinLevel' },
    { token: '@classes.<id>.level', pattern: true, label: 'Class Level (by class id)', group: 'Levels', desc: 'Level in any class by its id or name slug.', example: '@classes.warblade.level' },
    { token: '@cl', aliases: ['@casterLevel', '@item.level'], key: 'cl', label: 'Caster Level', group: 'Spellcasting', desc: 'Caster level of the entry or the character.', example: 'min(10, @cl)d6' },
    { token: '@spellLevel', aliases: ['@spell_level'], key: 'spellLevel', label: 'Spell Level', group: 'Spellcasting', desc: 'Level of the spell or spell-like ability: the power\'s Spell Level field, its attached spell, or the spell entry itself.', example: '10 + @spellLevel + @chaMod' },
    { token: '@baseSlots', key: 'baseSlots', label: 'Base Spell Slots', group: 'Spellcasting', desc: 'Base spell slots of the referenced spell level.', example: '@baseSlots + 1' },
    { token: '@spells.maxUnspentLevel', pattern: true, label: 'Highest Unspent Spell Level', group: 'Spellcasting', desc: 'Highest prepared, unexpended spell level; optional descriptor filter in parentheses.', example: '@spells.maxUnspentLevel(fire)' },
    { token: '@ml', aliases: ['@manifesterLevel'], key: 'ml', label: 'Manifester Level', group: 'Psionics', desc: 'Manifester level of the power or the character.', example: '@ml' },
    { token: '@augmentPP', aliases: ['@augment_pp'], key: 'augmentPP', label: 'Augment Power Points', group: 'Psionics', desc: 'Power points spent to augment (capped by manifester level).', example: '1d6 * (1 + floor(@augmentPP / 2))' },
    { token: '@il', aliases: ['@initiatorLevel'], key: 'il', label: 'Initiator Level', group: 'Martial Adepts', desc: 'Initiator level for maneuvers and stances.', example: '10 + @il + @wisMod' },
    { token: '@ebl', aliases: ['@effectiveBinderLevel'], key: 'ebl', label: 'Effective Binder Level', group: 'Pact Magic', desc: 'Effective binder level for vestige granted abilities.', example: '10 + floor(@ebl / 2) + @chaMod' },
    { token: '@essentia', aliases: ['@invested'], key: 'essentia', label: 'Invested Essentia', group: 'Incarnum', desc: 'Essentia invested in this receptacle.', example: '@essentia * 2' },
    { token: '@soulmeldsCount', key: 'soulmeldsCount', label: 'Soulmelds Shaped', group: 'Incarnum', desc: 'Number of soulmelds currently shaped.', example: '@soulmeldsCount' },
    { token: '@bab', key: 'bab', label: 'Base Attack Bonus', group: 'Combat', desc: 'Base attack bonus.', example: 'floor(@bab / 4)' },
    { token: '@enhancement', aliases: ['@enhancementBonus'], key: 'enhancement', label: 'Enhancement Bonus', group: 'Combat', desc: 'Enhancement bonus of the item.', example: '@enhancement * 2' },
    { token: '@critMult', key: 'critMult', label: 'Critical Multiplier', group: 'Combat', desc: 'Critical multiplier of the attack (1 on a normal hit).', example: '1d6 * @critMult' },
    { token: '@targetCR', aliases: ['@target_cr'], key: 'targetCR', label: 'Target Challenge Rating', group: 'Combat', desc: 'Challenge Rating of the target (defaults to character level).', example: '@targetCR' },
    { token: '@strMod', aliases: ['@str'], key: 'strMod', label: 'Strength Modifier', group: 'Ability Modifiers', desc: 'Strength modifier.', example: '@strMod' },
    { token: '@dexMod', aliases: ['@dex'], key: 'dexMod', label: 'Dexterity Modifier', group: 'Ability Modifiers', desc: 'Dexterity modifier.', example: '@dexMod' },
    { token: '@conMod', aliases: ['@con'], key: 'conMod', label: 'Constitution Modifier', group: 'Ability Modifiers', desc: 'Constitution modifier.', example: '10 + @halfLevel + @conMod' },
    { token: '@intMod', aliases: ['@int'], key: 'intMod', label: 'Intelligence Modifier', group: 'Ability Modifiers', desc: 'Intelligence modifier.', example: '@intMod' },
    { token: '@wisMod', aliases: ['@wis'], key: 'wisMod', label: 'Wisdom Modifier', group: 'Ability Modifiers', desc: 'Wisdom modifier.', example: '@wisMod' },
    { token: '@chaMod', aliases: ['@cha'], key: 'chaMod', label: 'Charisma Modifier', group: 'Ability Modifiers', desc: 'Charisma modifier.', example: '@chaMod' },
    { token: '@ability.<str|dex|con|int|wis|cha>.mod', pattern: true, label: 'Ability Modifier (dotted)', group: 'Ability Modifiers', desc: 'Dotted form of an ability modifier.', example: '@ability.cha.mod' },
    { token: '@skill.<key>.total', pattern: true, label: 'Skill Modifier', group: 'Skills', desc: 'Skill total, ranks or bonus (.total / .ranks / .bonus).', example: '@skill.tumble.ranks' },
    { token: '@castsToday', aliases: ['@uses_today', '@usesToday', '@casts_today'], key: 'castsToday', label: 'Uses Today', group: 'Resources', desc: 'Times this ability has been used today.', example: '@castsToday + 1' },
    { token: '@input.<key>', pattern: true, label: 'Activation Input', group: 'Runtime State', desc: 'Value entered when the ability is activated.', example: '@input.rounds' },
    { token: '@self.<key>', pattern: true, label: 'Entry State', group: 'Runtime State', desc: 'State of this entry (e.g. stacks, invested).', example: '@self.stacks' },
    { token: '@state.<key>', pattern: true, label: 'Character State', group: 'Runtime State', desc: 'Character-wide runtime state variable.', example: '@state.rage_rounds' }
  ],

  FORMULA_FUNCS: [
    { name: 'min', signature: 'min(a, b, ...)', desc: 'Smallest argument (caps, e.g. min(10, @cl)).', impl: (args) => (args.length ? Math.min(...args) : 0) },
    { name: 'max', signature: 'max(a, b, ...)', desc: 'Largest argument (floors, e.g. max(1, @chaMod)).', impl: (args) => (args.length ? Math.max(...args) : 0) },
    { name: 'floor', signature: 'floor(x)', desc: 'Round down (D&D 3.5e default rounding).', impl: (args) => Math.floor(args[0] || 0) },
    { name: 'ceil', signature: 'ceil(x)', desc: 'Round up.', impl: (args) => Math.ceil(args[0] || 0) },
    { name: 'round', signature: 'round(x)', desc: 'Round to the nearest integer.', impl: (args) => Math.round(args[0] || 0) },
    { name: 'abs', signature: 'abs(x)', desc: 'Absolute value.', impl: (args) => Math.abs(args[0] || 0) },
    { name: 'clamp', signature: 'clamp(x, lo, hi)', desc: 'Limit x to the range lo..hi.', impl: (args) => Math.min(args[2] ?? 0, Math.max(args[1] ?? 0, args[0] ?? 0)) }
  ],

  // Ready-made formulas per field kind for the Rule Crafter "!" help: plain-English label, the formula, and when to use it.
  // Every formula here must evaluate through evaluateFormula (checked by tools/test_derive_sheet.js).
  FORMULA_RECIPES: {
    dc: [
      { label: '10 + 1/2 HD + Con modifier', formula: '10 + 1/2 HD + Con', desc: 'Breath weapons and most extraordinary / supernatural abilities (PHB p.180).' },
      { label: '10 + spell level + Cha modifier', formula: '10 + @spellLevel + Cha', desc: 'Spell-like ability. Fill in the Spell Level field of the power (or attach the spell).' },
      { label: '10 + 1/2 class level + Wis modifier', formula: '10 + floor(@classLevel / 2) + Wis', desc: 'Class feature keyed to one class (Stunning Fist style).' },
      { label: 'Fixed DC', formula: '15', desc: 'A plain number is used as it is.' }
    ],
    dice: [
      { label: '1d8, +1d8 per 4 Hit Dice', formula: '(1 + floor(@hd / 4))d8', desc: '1d8 at 1 HD, 2d8 at 4 HD, 3d8 at 8 HD ...' },
      { label: '1d6 per caster level (max 10d6)', formula: 'min(10, @cl)d6', desc: 'Fireball / Lightning Bolt scaling.' },
      { label: '1d6 per 2 caster levels', formula: 'max(1, floor(@cl / 2))d6', desc: 'At least 1d6.' },
      { label: '1d8 + caster level (max +5)', formula: '1d8 + min(5, @cl)', desc: 'Cure Light Wounds scaling.' },
      { label: '2d6 + Str modifier', formula: '2d6 + Str', desc: 'Natural attack or slam style damage.' }
    ],
    value: [
      { label: '+1 per 4 levels (max +5)', formula: 'min(5, floor(@level / 4))', desc: 'Grows with character level.' },
      { label: 'Cha modifier (minimum +1)', formula: 'max(1, Cha)', desc: 'Never below +1.' },
      { label: '+2, +1 per 3 caster levels above 3rd (max +5)', formula: '2 + clamp(floor((@cl - 3) / 3), 0, 3)', desc: 'Barkskin style scaling.' },
      { label: 'One-half character level', formula: '1/2 level', desc: 'Rounded down.' }
    ],
    cl: [
      { label: 'Class level', formula: '@classLevel', desc: 'Level in the class that grants the ability.' },
      { label: 'Class level + 2', formula: '@classLevel + 2', desc: 'Practiced Spellcaster style bonus.' },
      { label: 'One-half class level', formula: 'floor(@classLevel / 2)', desc: 'Half-caster progression.' },
      { label: 'Character level', formula: '@level', desc: 'Total character level / Hit Dice.' }
    ]
  },

  // Plain words a formula field accepts (normalizeFormulaTokens rewrites them), shown in the Rule Crafter "!" help.
  FORMULA_SHORTHAND: [
    { words: 'lvl, level, HD', means: '@level', desc: 'Character level / Hit Dice' },
    { words: '1/2 HD, half level, HD/2', means: 'floor(@level / 2)', desc: 'One-half level, rounded down' },
    { words: 'Str, Dex, Con, Int, Wis, Cha', means: '@strMod ... @chaMod', desc: 'Ability modifiers' },
    { words: 'CL, caster level', means: '@cl', desc: 'Caster level' },
    { words: 'spell level', means: '@spellLevel', desc: 'Level of the spell or spell-like ability' },
    { words: 'BAB', means: '@bab', desc: 'Base attack bonus' },
    { words: 'ML, IL, ECL', means: '@ml, @il, @ecl', desc: 'Manifester, initiator and effective character level' },
    { words: 'DC: (prefix)', means: '', desc: 'Ignored, so "DC: 10 + lvl + Con" also works' }
  ],

  // Scalar values for every FORMULA_VARS `key`, from an evaluation context.
  _resolveFormulaScalars(context = {}) {
    const cl = Number(context.cl ?? context.casterLevel ?? context.level ?? 1) || 1;
    const level = Number(context.level ?? cl) || 1;
    return {
      cl,
      level,
      halfLevel: Math.floor(level / 2),
      hd: Number(context.hd ?? level) || level,
      ml: Number(context.ml ?? context.manifesterLevel ?? cl) || 1,
      il: Number(context.il ?? context.initiatorLevel ?? level) || 1,
      ebl: Number(context.ebl ?? context.effectiveBinderLevel ?? level) || 1,
      ecl: Number(context.ecl ?? level) || 1,
      classLevel: Number(context.classLevel ?? level) || 1,
      bab: Number(context.bab ?? 0) || 0,
      enhancement: Number(context.enhancement ?? context.enhancementBonus ?? 0) || 0,
      critMult: Number(context.critMult ?? 1) || 1,
      essentia: Number(context.essentia ?? context.self?.invested ?? 0) || 0,
      soulmeldsCount: Number(context.soulmeldsCount ?? 0) || 0,
      baseSlots: Number(context.baseSlots ?? 0) || 0,
      augmentPP: Number(context.augmentPP ?? 0) || 0,
      castsToday: Number(context.castsToday ?? context.usesToday ?? 0) || 0,
      targetCR: Number(context.targetCR ?? level ?? 1) || 1,
      strMod: Number(context.strMod) || 0,
      dexMod: Number(context.dexMod) || 0,
      conMod: Number(context.conMod) || 0,
      intMod: Number(context.intMod) || 0,
      wisMod: Number(context.wisMod) || 0,
      chaMod: Number(context.chaMod) || 0,
      spellLevel: Number(context.spellLevel ?? 0) || 0
    };
  },

  // Lower-case token name (no '@') -> scalar key, built once from FORMULA_VARS tokens and aliases.
  /**
   * Authoring check for a formula field (Rule Crafter): the normalized form the engine evaluates
   * ("10+lvl+Con" -> "10 + @level + @conMod"), terms the engine does not know, and sample values at a few
   * character levels (every ability modifier set to opts.abilityMod, default +2). Samples are skipped while
   * unknown terms remain. Returns { normalized, unknown: [], samples: [{ level, value }] }.
   */
  inspectFormula(formula, opts = {}) {
    const normalized = this.normalizeFormulaTokens(formula);
    if (!normalized) return { normalized: '', unknown: [], samples: [] };
    const idx = this._formulaTokenIndex();
    const funcs = new Set(this.FORMULA_FUNCS.map(f => f.name.toLowerCase()));
    const familyRe = /^@(?:[a-z]+level|classes\.[\w-]+\.level|ability\.(?:str|dex|con|int|wis|cha)\.mod|skill\.[\w-]+\.(?:total|ranks|bonus)|input\.\w+|self\.\w+|state\.\w+|spells\.maxunspentlevel)$/i;
    const unknown = [];
    (normalized.match(/@[a-z_][\w.]*/gi) || []).forEach(t => {
      const name = t.slice(1).toLowerCase();
      if (idx.simple.has(name) || idx.dotted.some(d => d.name === name) || familyRe.test(t)) return;
      if (!unknown.includes(t)) unknown.push(t);
    });
    (normalized.replace(/@[a-z_][\w.]*/gi, ' ').match(/[a-z_][a-z0-9_]*/gi) || []).forEach(word => {
      const low = word.toLowerCase();
      if (funcs.has(low) || /^d\d+$/.test(low)) return;
      if (!unknown.includes(word)) unknown.push(word);
    });
    const levels = Array.isArray(opts.levels) ? opts.levels : [1, 5, 10, 20];
    const mod = opts.abilityMod !== undefined ? Number(opts.abilityMod) || 0 : 2;
    const samples = unknown.length ? [] : levels.map(level => {
      const ctx = {
        level, hd: level, ecl: level, cl: level, casterLevel: level, ml: level, il: level, ebl: level, classLevel: level,
        bab: level, enhancement: 1, strMod: mod, dexMod: mod, conMod: mod, intMod: mod, wisMod: mod, chaMod: mod,
        spellLevel: opts.spellLevel !== undefined ? Number(opts.spellLevel) || 0 : 3
      };
      let value = null;
      try { value = this.evaluateFormula(normalized, ctx); } catch (e) { value = null; }
      return { level, value };
    });
    return { normalized, unknown, samples };
  },

  _formulaTokenIndex() {
    if (this._formulaTokenIndexCache) return this._formulaTokenIndexCache;
    const simple = new Map();
    const dotted = [];
    this.FORMULA_VARS.forEach(v => {
      if (!v || v.pattern || !v.key) return;
      [v.token].concat(v.aliases || []).forEach(t => {
        const name = String(t || '').replace(/^@/, '');
        if (!name) return;
        if (name.includes('.')) dotted.push({ name: name.toLowerCase(), key: v.key });
        else simple.set(name.toLowerCase(), v.key);
      });
    });
    this._formulaTokenIndexCache = { simple, dotted };
    return this._formulaTokenIndexCache;
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

    const funcIndex = new Map(this.FORMULA_FUNCS.map(f => [f.name.toLowerCase(), f]));
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
        const fnDef = funcIndex.get(String(fn).toLowerCase());
        return fnDef ? fnDef.impl(args) : 0;
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

  // Canonical V2/V2.5/V3 Formula Evaluator (Zero-eval, supports @level, @cl, @ml, @il, @ebl, @ecl, @bab, @essentia, @augmentPP, @castsToday, @targetCR, @strMod..@chaMod, @input.*, @self.*, @state.*, @skill.*, @classes.*, @spells.maxUnspentLevel)
  evaluateFormula(formula, context = {}) {
    if (formula === null || formula === undefined || formula === '') return 0;
    if (typeof formula === 'number') return formula;
    const raw = this.normalizeFormulaTokens(String(formula).trim());
    const directNum = Number(raw);
    if (!Number.isNaN(directNum)) return directNum;

    // Scalar tokens (and their aliases) resolve through the FORMULA_VARS registry.
    const scalars = this._resolveFormulaScalars(context);
    const tokenIndex = this._formulaTokenIndex();
    let expr = raw;
    tokenIndex.dotted.forEach(d => {
      const re = new RegExp(`@${d.name.replace(/[.]/g, '\\.')}\\b`, 'gi');
      expr = expr.replace(re, String(scalars[d.key]));
    });
    expr = expr.replace(/@([a-z_][a-z0-9_]*)\b(?!\.)/gi, (full, name) => {
      const key = tokenIndex.simple.get(name.toLowerCase());
      return key ? String(scalars[key]) : full;
    });

    // Token families (FORMULA_VARS rows with `pattern: true`).
    expr = expr
      .replace(/@(warblade|paladin|monk|barbarian|rogue|swashbuckler|fighter|cleric|bard|ranger|sorcerer|wizard|druid|psion|wilder|incarnate|totemist|binder|shadowcaster|truenamer|swordsage|crusader)Level\b/gi, (_, cls) => {
        const lowCls = cls.toLowerCase();
        const propKey = `${lowCls}Level`;
        if (context[propKey] !== undefined) return String(Number(context[propKey]) || 0);
        if (context.classLevels && typeof context.classLevels[lowCls] === 'number') return String(context.classLevels[lowCls]);
        return '0';
      })
      .replace(/@(?:ability|abilities)\.(str|dex|con|int|wis|cha)\.mod\b/gi, (_, a) => String(Number(context[`${a.toLowerCase()}Mod`]) || 0))
      .replace(/@(?:classes|class)\.([a-z0-9_-]+)\.level\b/gi, (_, cName) => {
        const key = cName.toLowerCase();
        const altKey = key.replace(/-/g, '_');
        const cLvl = (context.classLevels && typeof context.classLevels[key] === 'number')
          ? context.classLevels[key]
          : ((context.classLevels && typeof context.classLevels[altKey] === 'number') ? context.classLevels[altKey] : 0);
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
      // Function-wrapped dice counts (`min(10, @cl)d6`) first, so the bare-parenthesis pass below cannot strip
      // the argument list away from its function name.
      // Only a call that is the whole dice count (`min(10, @cl)d6`) is raised to at least one die; a call nested in a
      // larger count (`(1 + floor(@hd / 4))d8`) keeps its own value so the outer sum is right (1d8 at 1 HD, not 2d8).
      let diceResolved = expr.replace(/(^|[^a-z0-9_])(min|max|floor|ceil|round|abs|clamp)\(([^()]+)\)(?=\)*d\d+)/gi, (full, lead, fn, inner, offset, whole) => {
        const val = Math.floor(Number(this.evaluateFormula(`${fn}(${inner})`, context)) || 0);
        const isWholeCount = whole.charAt(offset + full.length).toLowerCase() === 'd';
        return `${lead}${isWholeCount ? Math.max(1, val) : val}`;
      });
      diceResolved = diceResolved.replace(/\(([^()]+)\)(?=d\d+)/gi, (_, sub) => {
        const val = this.evaluateFormula(sub, context);
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

  // Rule family of an entry ('feat', 'spell', 'item', 'race', ...; '' when unknown). A name-only override
  // lookup never crosses families, so a homebrew feat named "Fireball" cannot replace the Fireball spell.
  RULE_FAMILY_BY_KIND: {
    feat: 'feat', flaw: 'feat', trait: 'feat', homebrew: 'feat', classability: 'feat', 'class ability': 'feat',
    'special ability': 'feat', feature: 'feat',
    spell: 'spell',
    power: 'power', 'psionic power': 'power',
    maneuver: 'maneuver', stance: 'maneuver',
    weapon: 'item', armor: 'item', shield: 'item', item: 'item', 'wondrous item': 'item', ring: 'item', rod: 'item',
    staff: 'item', wand: 'item', potion: 'item', scroll: 'item', 'magic item': 'item', gear: 'item', equipment: 'item',
    ammunition: 'item',
    race: 'race', template: 'race',
    class: 'class', 'base class': 'class', 'prestige class': 'class', 'custom class': 'class',
    domain: 'domain', deity: 'deity', meld: 'meld', soulmeld: 'meld', vestige: 'vestige', mystery: 'mystery',
    utterance: 'utterance', monster: 'monster', condition: 'condition'
  },

  entryRuleFamily(entry) {
    if (!entry || typeof entry !== 'object') return '';
    const kinds = [entry.blueprint, entry.type, entry.category];
    for (let i = 0; i < kinds.length; i++) {
      const k = String(kinds[i] || '').toLowerCase().trim();
      if (k && this.RULE_FAMILY_BY_KIND[k]) return this.RULE_FAMILY_BY_KIND[k];
    }
    return '';
  },

  // Copy-on-Write Per-Character Custom Entry Override Lookup (`char.customEntries[id]`).
  // Explicit ids always match; name-derived matches (slug ids, display name) must share the rule family.
  // `opts.family` gives the family for a plain-name lookup (e.g. 'race', 'class', 'domain').
  resolveCustomEntryOverride(itemOrName, character = null, opts = {}) {
    if (!itemOrName) return null;
    const customMap = (character && character.customEntries && typeof character.customEntries === 'object' ? character.customEntries : null)
      || (this._activeCustomEntries && typeof this._activeCustomEntries === 'object' ? this._activeCustomEntries : null)
      || (this._activeCharacter && this._activeCharacter.customEntries && typeof this._activeCharacter.customEntries === 'object' ? this._activeCharacter.customEntries : null)
      || (typeof window !== 'undefined' && window.character && window.character.customEntries && typeof window.character.customEntries === 'object' ? window.character.customEntries : null);
    if (!customMap) return null;
    const mapKeys = Object.keys(customMap);
    if (mapKeys.length === 0) return null;

    const isObj = typeof itemOrName === 'object';
    const inFamily = (opts && opts.family) || (isObj ? this.entryRuleFamily(itemOrName) : '');
    const sameFamily = (fam) => !inFamily || !fam || fam === inFamily;
    const PREFIX_FAMILY = {
      'feat-': 'feat', 'cab-': 'feat', 'sa-': 'feat', 'spl-': 'spell', 'pwr-': 'power', 'meld-': 'meld',
      'vst-': 'vestige', 'mys-': 'mystery', 'utt-': 'utterance', 'wpn-': 'item', 'arm-': 'item', 'itm-': 'item', 'cls-': 'class'
    };
    const candidateIds = [];
    if (isObj) {
      ['id', 'baseEntryId', 'baseItemId', 'srdId'].forEach(k => {
        if (itemOrName[k]) candidateIds.push(String(itemOrName[k]).trim());
      });
      if (itemOrName.origin && itemOrName.origin.srdId) {
        candidateIds.push(String(itemOrName.origin.srdId).trim());
      }
    } else {
      candidateIds.push(String(itemOrName).trim());
    }

    const rawName = String(isObj ? (itemOrName.masterDbName || itemOrName.name || '') : itemOrName)
      .replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '')
      .trim()
      .toLowerCase();
    if (rawName) {
      const baseNameNoParen = rawName.replace(/\s*\([^)]+\)\s*$/g, '').trim();
      const slugBase = (baseNameNoParen || rawName).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (slugBase) {
        Object.keys(PREFIX_FAMILY).forEach(pref => {
          if (!sameFamily(PREFIX_FAMILY[pref])) return;
          const cand = `${pref}${slugBase}`;
          if (!candidateIds.includes(cand)) candidateIds.push(cand);
        });
      }
    }

    for (let i = 0; i < candidateIds.length; i++) {
      const cid = candidateIds[i];
      if (!cid) continue;
      if (customMap[cid] && typeof customMap[cid] === 'object') return customMap[cid];
      const cidLow = cid.toLowerCase();
      const matchedKey = mapKeys.find(k => k.toLowerCase() === cidLow);
      if (matchedKey && customMap[matchedKey] && typeof customMap[matchedKey] === 'object') {
        return customMap[matchedKey];
      }
    }

    if (!rawName) return null;

    const baseNameNoParen = rawName.replace(/\s*\([^)]+\)\s*$/g, '').trim();
    for (let i = 0; i < mapKeys.length; i++) {
      const entry = customMap[mapKeys[i]];
      if (!entry || typeof entry !== 'object') continue;
      const eId = String(entry.id || entry.baseEntryId || entry.baseItemId || '').trim().toLowerCase();
      if (eId && candidateIds.some(c => c.toLowerCase() === eId)) return entry;
      const eName = String(entry.name || entry.masterDbName || '').trim().toLowerCase();
      if (eName && (eName === rawName || (baseNameNoParen && eName === baseNameNoParen)) && sameFamily(this.entryRuleFamily(entry))) return entry;
    }
    return null;
  },

  // Canonical V3 Target Mapper (normalizes V3 block target keys into RuleEngine canonical targets)
  canonicalizeV3Target(rawTarget) {
    const t = String(rawTarget || '').trim();
    if (!t) return 'ac.all';
    const low = t.toLowerCase();
    const map = {
      'ac': 'ac.all',
      'ac.all': 'ac.all',
      'ac.total': 'ac.all',
      'ac.touch': 'ac.touch',
      'ac.flatfooted': 'ac.flatFooted',
      'ac.flat_footed': 'ac.flatFooted',
      'ac.flat': 'ac.flatFooted',
      'ac.armor': 'ac.armor',
      'ac.shield': 'ac.shield',
      'ac.shieldbonus': 'ac.shieldBonus',
      'ac.natural': 'ac.natural',
      'ac.deflection': 'ac.deflection',
      'ac.dodge': 'ac.dodge',
      'atk': 'atk.all',
      'atk.all': 'atk.all',
      'attack': 'atk.all',
      'attack.all': 'atk.all',
      'atk.melee': 'atk.melee',
      'attack.melee': 'atk.melee',
      'meleeattack': 'atk.melee',
      'atk.ranged': 'atk.ranged',
      'attack.ranged': 'atk.ranged',
      'rangedattack': 'atk.ranged',
      'atk.grapple': 'atk.grapple',
      'attack.grapple': 'atk.grapple',
      'grapple': 'atk.grapple',
      'cmb': 'atk.grapple',
      'atk.critconfirm': 'atk.critConfirm',
      'attack.critconfirm': 'atk.critConfirm',
      'critconfirm': 'atk.critConfirm',
      'atk.touch': 'atk.touch',
      'atk.weapon': 'atk.weapon',
      'atk.natural': 'atk.natural',
      'atk.unarmed': 'atk.unarmed',
      'dmg': 'dmg.all',
      'dmg.all': 'dmg.all',
      'damage': 'dmg.all',
      'damage.all': 'dmg.all',
      'dmg.melee': 'dmg.melee',
      'damage.melee': 'dmg.melee',
      'meleedamage': 'dmg.melee',
      'dmg.ranged': 'dmg.ranged',
      'damage.ranged': 'dmg.ranged',
      'rangeddamage': 'dmg.ranged',
      'dmg.natural': 'dmg.natural',
      'damage.natural': 'dmg.natural',
      'dmg.unarmed': 'dmg.unarmed',
      'damage.unarmed': 'dmg.unarmed',
      'dmg.weapon': 'dmg.weapon',
      'save.all': 'save.all',
      'saves.all': 'save.all',
      'saves': 'save.all',
      'all_saves': 'save.all',
      'save.fort': 'save.fort',
      'saves.fort': 'save.fort',
      'fort': 'save.fort',
      'save.ref': 'save.ref',
      'saves.ref': 'save.ref',
      'ref': 'save.ref',
      'save.will': 'save.will',
      'saves.will': 'save.will',
      'will': 'save.will',
      'str': 'ability.str',
      'ability.str': 'ability.str',
      'dex': 'ability.dex',
      'ability.dex': 'ability.dex',
      'con': 'ability.con',
      'ability.con': 'ability.con',
      'int': 'ability.int',
      'ability.int': 'ability.int',
      'wis': 'ability.wis',
      'ability.wis': 'ability.wis',
      'cha': 'ability.cha',
      'ability.cha': 'ability.cha',
      'choice.skill.1': 'choice.skill.1',
      'choice.save.1': 'choice.save.1',
      'choice.school.1': 'choice.school.1',
      'choice.ability.1': 'choice.ability.1',
      'choice.ability.2': 'choice.ability.2',
      'choice.ability.3': 'choice.ability.3',
      'choice.ability.4': 'choice.ability.4',
      'init': 'init',
      'initiative': 'init',
      'speed': 'speed.land',
      'speed.all': 'speed.all',
      'speed.land': 'speed.land',
      'speed.fly': 'speed.fly',
      'speed.swim': 'speed.swim',
      'speed.climb': 'speed.climb',
      'speed.burrow': 'speed.burrow',
      'hp': 'hp',
      'hp.max': 'hp.max',
      'hp.temp': 'hp.temp',
      'temp_hp': 'hp.temp',
      'hp.perlvl': 'hp.perLvl',
      'hp.perlevel': 'hp.perLvl',
      'fasthealing': 'fastHealing',
      'fast_healing': 'fastHealing',
      'hp.fasthealing': 'fastHealing',
      'dr': 'dr',
      'sr': 'sr',
      'spellresistance': 'sr',
      'cl': 'cl',
      'ml': 'ml',
      'il': 'il',
      'ebl': 'ebl',
      'pact.ebl': 'ebl',
      'essentia.pool': 'essentia.pool',
      'incarnum.essentiapool': 'incarnum.essentiaPool',
      'essentia.capacity': 'essentia.capacity',
      'incarnum.capacitybonus': 'incarnum.capacityBonus',
      'psionic.powerpoints': 'psionics.powerPoints',
      'psionics.powerpoints': 'psionics.powerPoints',
      'caster.spellpenetration': 'caster.spellPenetration',
      'dc.all': 'dc.all',
      'skill.all': 'skill.all',
      'skills.all': 'skill.all',
      'bab': 'bab',
      'atk.melee.abilitymod': 'atk.melee.abilityMod',
      'attack.melee.abilitymod': 'atk.melee.abilityMod',
      'atk.ranged.abilitymod': 'atk.ranged.abilityMod',
      'attack.ranged.abilitymod': 'atk.ranged.abilityMod',
      'atk.thrown.abilitymod': 'atk.thrown.abilityMod',
      'attack.thrown.abilitymod': 'atk.thrown.abilityMod',
      'atk.touch.abilitymod': 'atk.touch.abilityMod',
      'attack.touch.abilitymod': 'atk.touch.abilityMod',
      'grapple.abilitymod': 'grapple.abilityMod',
      'atk.grapple.abilitymod': 'grapple.abilityMod',
      'dmg.melee.abilitymod': 'dmg.melee.abilityMod',
      'damage.melee.abilitymod': 'dmg.melee.abilityMod',
      'dmg.ranged.abilitymod': 'dmg.ranged.abilityMod',
      'damage.ranged.abilitymod': 'dmg.ranged.abilityMod',
      'save.fort.abilitymod': 'save.fort.abilityMod',
      'save.ref.abilitymod': 'save.ref.abilityMod',
      'save.will.abilitymod': 'save.will.abilityMod',
      'ac.abilitymod': 'ac.abilityMod',
      'init.abilitymod': 'initiative.abilityMod',
      'initiative.abilitymod': 'initiative.abilityMod',
      'hp.abilitymod': 'hp.abilityMod',
      'concentration.abilitymod': 'concentration.abilityMod',
      'skill.concentration.abilitymod': 'concentration.abilityMod',
      'choice.skill.1.abilitymod': 'choice.skill.1.abilityMod',
      'spell.dc.abilitymod': 'spell.dc.abilityMod',
      'spell.bonusslots.abilitymod': 'spell.bonusSlots.abilityMod'
    };
    if (map[low]) return map[low];
    if (low.startsWith('resist.') || low.startsWith('resistance.')) {
      return `resist.${low.split('.')[1]}`;
    }
    if (/^skills?\.[a-z0-9_-]+\.abilitymod$/i.test(low)) {
      const skSlug = low.replace(/^skills?\./, '').replace(/\.abilitymod$/i, '').replace(/_/g, '-');
      return `skill.${skSlug}.abilityMod`;
    }
    if (low.startsWith('skill.') || low.startsWith('skills.')) {
      const skName = t.replace(/^skills?\./i, '').trim();
      return `skill.${skName}`;
    }
    return t;
  },

  // Normalize D&D 3.5e Bonus Type to Official Capitalization
  normalizeV3BonusType(rawType) {
    const low = String(rawType || 'Untyped').trim().toLowerCase();
    const typeMap = {
      'untyped': 'Untyped',
      'enhancement': 'Enhancement',
      'armor': 'Armor',
      'shield': 'Shield',
      'natural': 'Natural Armor',
      'natural armor': 'Natural Armor',
      'natural_armor': 'Natural Armor',
      'natural_armor_ench': 'Natural_Armor_Ench',
      'natural_enhancement': 'Natural_Armor_Ench',
      'deflection': 'Deflection',
      'dodge': 'Dodge',
      'sacred': 'Sacred',
      'profane': 'Profane',
      'insight': 'Insight',
      'luck': 'Luck',
      'morale': 'Morale',
      'competence': 'Competence',
      'resistance': 'Resistance',
      'circumstance': 'Circumstance',
      'racial': 'Racial',
      'size': 'Size',
      'alchemical': 'Alchemical',
      'inherent': 'Inherent',
      'synergy': 'Synergy',
      'penalty': 'Penalty',
      'template': 'Template'
    };
    return typeMap[low] || (rawType ? String(rawType).trim() : 'Untyped');
  },

  // Convert passive non-math ruleFlags into official D&D 3.5e English tacticalBadges
  formatRuleFlagBadges(ruleFlags, entry = null) {
    const badges = [];
    if (!ruleFlags || typeof ruleFlags !== 'object') return badges;
    const addBadge = (b) => {
      if (b && !badges.includes(b)) badges.push(b);
    };
    if (ruleFlags.bypassDR) {
      const bVal = Array.isArray(ruleFlags.bypassDR) ? ruleFlags.bypassDR.join('/') : String(ruleFlags.bypassDR);
      addBadge(`Bypasses DR/${bVal}`);
    }
    if (ruleFlags.requiresHand) {
      addBadge(typeof ruleFlags.requiresHand === 'string' ? `Requires ${ruleFlags.requiresHand} Hand` : 'Requires Free Hand');
    }
    if (ruleFlags.fortDc) {
      addBadge(`Fortitude DC ${ruleFlags.fortDc}`);
    }
    if (ruleFlags.reach) {
      addBadge(typeof ruleFlags.reach === 'number' ? `Reach ${ruleFlags.reach} ft.` : 'Reach Weapon');
    }
    if (ruleFlags.isSkillTrick) {
      addBadge('Skill Trick (1/Encounter)');
    }
    if (ruleFlags.relic) {
      addBadge('Relic Power');
    }
    if (ruleFlags.touchAttack) {
      addBadge('Touch Attack');
    }
    if (ruleFlags.rangeIncrement) {
      addBadge(`Range Increment ${ruleFlags.rangeIncrement} ft.`);
    }
    if (ruleFlags.darkvisionFt) {
      addBadge(`Darkvision ${ruleFlags.darkvisionFt} ft.`);
    }
    if (ruleFlags.lightRadiusBrightFt) {
      addBadge(`Bright Light ${ruleFlags.lightRadiusBrightFt} ft.`);
    }
    if (ruleFlags.splashDamage) {
      addBadge(`Splash Damage (${ruleFlags.splashDamage})`);
    }
    if (ruleFlags.quickDraw) {
      addBadge('Quick Draw');
    }
    if (ruleFlags.requiresChoice) {
      addBadge(typeof ruleFlags.requiresChoice === 'string' ? `Choice: ${ruleFlags.requiresChoice}` : 'Requires Selection');
    }
    if (ruleFlags.weaponHardnessBonus) {
      addBadge(`+${ruleFlags.weaponHardnessBonus} Weapon Hardness`);
    }
    if (ruleFlags.lifeStealPerHit) {
      addBadge(`Life Steal +${ruleFlags.lifeStealPerHit} HP/Hit`);
    }
    if (ruleFlags.disarmResistBonus) {
      addBadge(`+${ruleFlags.disarmResistBonus} vs. Disarm`);
    }
    if (ruleFlags.lingeringFireDamage) {
      addBadge(`Lingering Fire (${ruleFlags.lingeringFireDamage})`);
    }
    if (ruleFlags.immuneMentalControl) {
      addBadge('Immune to Mental Control');
    }
    if (ruleFlags.blockSummonedNaturalTouch) {
      addBadge('Wards vs. Summoned Natural Attacks');
    }
    if (ruleFlags.metamagicLevelMod !== undefined && ruleFlags.metamagicLevelMod !== null) {
      const mm = Number(ruleFlags.metamagicLevelMod) || 0;
      addBadge(`Metamagic (${mm >= 0 ? '+' : ''}${mm} Slot Level)`);
    }
    if (ruleFlags.exoticArmor) {
      addBadge('Exotic Armor');
    }
    if (ruleFlags.grantsBonusFeat) {
      addBadge('Grants Bonus Feat');
    }
    if (ruleFlags.isFlaw) {
      addBadge('Character Flaw');
    }
    if (ruleFlags.creatureTypeOverride) {
      addBadge(`Type: ${ruleFlags.creatureTypeOverride}`);
    }
    if (ruleFlags.chargesPerDay) {
      addBadge(`${ruleFlags.chargesPerDay} Charges/Day`);
    }
    if (ruleFlags.poisonMethod || ruleFlags.initialEffect || ruleFlags.secondaryEffect) {
      const method = ruleFlags.poisonMethod ? `${ruleFlags.poisonMethod}` : 'Poison';
      const initEff = ruleFlags.initialEffect || 'None';
      const secEff = ruleFlags.secondaryEffect || 'None';
      addBadge(`${method}: ${initEff} / ${secEff}`);
    }
    if (entry && Array.isArray(entry.tacticalBadges)) {
      entry.tacticalBadges.forEach(tb => addBadge(tb));
    }
    return badges;
  },

  // Extract resolved `@Choice` value from an entity instance (explicit choice props, `choices[]` selection, or parenthetical/colon suffix)
  extractEntryChoice(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') {
      const pm = entry.match(/\(([^)]+)\)\s*$/);
      if (pm && pm[1] && !/^(?:ex|su|sp|na|3\.0e)$/i.test(pm[1].trim())) return pm[1].trim();
      return '';
    }
    const direct = entry.chosenOption ?? entry.choiceValue ?? entry.selectedOption
      ?? entry.choice ?? entry.subChoice ?? entry.targetWeapon ?? entry.selectedWeapon
      ?? entry.targetWeaponId ?? entry.weaponId ?? entry.targetShield
      ?? entry.chosenSchool ?? entry.chosenEnergy ?? '';
    if (direct && String(direct).trim()) return String(direct).trim();
    if (Array.isArray(entry.choices)) {
      for (const ch of entry.choices) {
        const cv = ch && (ch.selected ?? ch.value ?? ch.chosen ?? ch.choiceValue);
        if (cv && String(cv).trim()) return String(cv).trim();
      }
    }
    const rawName = String(entry.name || '').trim();
    if (rawName) {
      const pm = rawName.match(/\(([^)]+)\)\s*$/);
      if (pm && pm[1] && !/^(?:ex|su|sp|na|3\.0e)$/i.test(pm[1].trim())) {
        return pm[1].trim();
      }
      const colonMatch = rawName.match(/^(?:greater\s+|epic\s+)?(?:weapon\s+focus|weapon\s+specialization|skill\s+focus|spell\s+focus|armor\s+specialization|shield\s+specialization|energy\s+resistance)\s*[:\-]\s*(.+)$/i);
      if (colonMatch && colonMatch[1]) {
        return colonMatch[1].trim();
      }
    }
    return '';
  },

  // Evaluate V3 `when` / `while` branch condition against character combat state, HP thresholds, buffs, activeModes, or chakra binds
  evaluateV3BranchCondition(rawCond, branchType, evalCtx = {}, character = null, entry = null) {
    if (!rawCond) return true;
    const ch = character || evalCtx.character || this._activeCharacter || {};
    if (typeof rawCond === 'object') {
      return this.evaluatePredicate(rawCond, ch, evalCtx);
    }
    const cond = String(rawCond).trim();
    if (!cond) return true;
    const low = cond.toLowerCase();

    // 1. Incarnum Chakra Bind check (e.g. "boundChakra === 'hands'", "Chakra Bind (Hands)", "Hands Chakra")
    const boundChakra = String(evalCtx.boundChakra ?? entry?.boundChakra ?? entry?.chakraBind ?? '').trim().toLowerCase();
    const chakraMatch = low.match(/boundchakra\s*===?\s*['"]?([a-z]+)['"]?/i)
      || low.match(/chakra\s+bind\s*\(\s*([a-z]+)\s*\)/i)
      || low.match(/^(crown|feet|hands|arms|brow|shoulders|throat|waist|heart|soul|totem)\s+chakra$/i);
    if (chakraMatch) {
      return boundChakra === chakraMatch[1].toLowerCase();
    }

    // 1b. Explicit `toggle:<key>` string prefix from Rule Crafter
    if (low.startsWith('toggle:')) {
      const tKey = cond.slice(7).trim();
      return this.evaluatePredicate({ toggle: tKey }, ch, evalCtx);
    }

    // 2. Shadow Magic / Mystery Tier check (e.g. "levelTier === 'Apprentice'")
    const tierMatch = low.match(/leveltier\s*===?\s*['"]?([a-z]+)['"]?/i);
    if (tierMatch) {
      const actualTier = String(evalCtx.levelTier ?? entry?.tier ?? entry?.levelTier ?? 'Apprentice').trim().toLowerCase();
      return actualTier === tierMatch[1].toLowerCase();
    }

    // 3. Combat Toggles (`charging`, `fightingDefensively`, `totalDefense`, `powerAttack`, `combatExpertise`, `flanking`, `higherGround`, etc.)
    const tac = Object.assign({}, ch.tactical || {}, evalCtx.tactical || {});
    const toggleAliases = {
      'charging': Boolean(tac.charge || tac.charging || evalCtx.charge || evalCtx.charging),
      'charge': Boolean(tac.charge || tac.charging || evalCtx.charge || evalCtx.charging),
      'on a charge': Boolean(tac.charge || tac.charging || evalCtx.charge || evalCtx.charging),
      'while charging': Boolean(tac.charge || tac.charging || evalCtx.charge || evalCtx.charging),
      'fightingdefensively': Boolean(tac.fightingDefensively || evalCtx.fightingDefensively),
      'fighting defensively': Boolean(tac.fightingDefensively || evalCtx.fightingDefensively),
      'totaldefense': Boolean(tac.totalDefense || evalCtx.totalDefense),
      'total defense': Boolean(tac.totalDefense || evalCtx.totalDefense),
      'powerattack': Boolean((Number(tac.powerAttack) > 0) || tac.powerAttackActive || (Number(evalCtx.powerAttack) > 0)),
      'power attack': Boolean((Number(tac.powerAttack) > 0) || tac.powerAttackActive || (Number(evalCtx.powerAttack) > 0)),
      'combatexpertise': Boolean((Number(tac.combatExpertise) > 0) || tac.combatExpertiseActive || (Number(evalCtx.combatExpertise) > 0)),
      'combat expertise': Boolean((Number(tac.combatExpertise) > 0) || tac.combatExpertiseActive || (Number(evalCtx.combatExpertise) > 0)),
      'flanking': Boolean(tac.flanking || evalCtx.flanking),
      'while flanking': Boolean(tac.flanking || evalCtx.flanking),
      'higherground': Boolean(tac.higherGround || evalCtx.higherGround),
      'higher ground': Boolean(tac.higherGround || evalCtx.higherGround),
      'pointblankshot': Boolean(tac.pointBlankShot || evalCtx.pointBlankShot),
      'point blank shot': Boolean(tac.pointBlankShot || evalCtx.pointBlankShot),
      'rapidshot': Boolean(tac.rapidShot || evalCtx.rapidShot),
      'manyshot': Boolean(tac.manyshot || evalCtx.manyshot),
      'sneakattack': Boolean(tac.sneakAttack || evalCtx.sneakAttack),
      'notflatfooted': Boolean(!evalCtx.flatFooted && !evalCtx.loseDexToAC),
      'not flat-footed': Boolean(!evalCtx.flatFooted && !evalCtx.loseDexToAC),
      'not flatfooted': Boolean(!evalCtx.flatFooted && !evalCtx.loseDexToAC),
      '!flatfooted': Boolean(!evalCtx.flatFooted && !evalCtx.loseDexToAC),
      'wieldingtwoweapons': Boolean(this.isWieldingTwoWeaponsOrDouble && this.isWieldingTwoWeaponsOrDouble(ch, Boolean(ch.twoHandedConflict))),
      'wielding two weapons': Boolean(this.isWieldingTwoWeaponsOrDouble && this.isWieldingTwoWeaponsOrDouble(ch, Boolean(ch.twoHandedConflict)))
    };
    if ( Object.prototype.hasOwnProperty.call(toggleAliases, low) ) {
      return toggleAliases[low];
    }

    // 3b. V3 Equipment & Movement Conditions (`wieldingChosenShield`, `wieldingChosenWeapon`, `vsAoOFromMovement`, armor/load checks)
    if (low === 'vsaoofrommovement' || low === 'vs. aoo from movement' || low === 'vs aoo from movement') {
      return 'qualifier';
    }
    if (low === 'wieldingchosenshield' || low === 'wielding chosen shield' || low === 'wieldingshield') {
      const activeShields = [];
      const slots = ch.bodySlots || {};
      const mh = slots.mainHand;
      const oh = slots.offHand;
      const isDoubleValidPair = mh && oh && this.isDoubleWeapon && this.isDoubleWeapon(mh) && this.isOffHandWeaponHead && this.isOffHandWeaponHead(oh);
      const isMhTwoHand = Boolean(mh && mh.name && mh.name !== '-' && this.isTwoHandedWeapon && this.isTwoHandedWeapon(mh) && !isDoubleValidPair);
      if (oh && oh.active !== false && oh.equipped !== false && oh.name && oh.name !== '-' && !isMhTwoHand) {
        if ((this.isShieldItem && this.isShieldItem(oh)) || Number(oh.shieldBonus ?? oh.armorStats?.baseAc ?? oh.armor?.armorBonus ?? 0) > 0) {
          activeShields.push(oh);
        }
      }
      const invPool = (Array.isArray(ch.inventory) ? ch.inventory : []).concat(Array.isArray(ch.gearPool) ? ch.gearPool : []);
      invPool.forEach(it => {
        if (it && typeof it === 'object' && it.active !== false && (it.equipped || it.isEquipped)) {
          if ((this.isShieldItem && this.isShieldItem(it)) || Number(it.shieldBonus ?? it.armorStats?.baseAc ?? it.armor?.armorBonus ?? 0) > 0) {
            activeShields.push(it);
          }
        }
      });
      if (activeShields.length === 0 && (Number(ch.acBreakdown?.shield) > 0 || Number(ch.shieldBonus) > 0)) {
        activeShields.push({ name: ch.shieldName || 'Shield', shieldBonus: Number(ch.acBreakdown?.shield || ch.shieldBonus) });
      }
      if (activeShields.length === 0) return false;

      let chosenShield = String(
        entry?.chosenOption ?? entry?.choiceValue ?? entry?.selectedOption ?? entry?.targetShield ?? entry?.choice ?? entry?.subChoice ?? ''
      ).trim().toLowerCase();
      if (!chosenShield && entry?.name) {
        const parenMatch = String(entry.name).match(/\(([^)]+)\)/);
        if (parenMatch && parenMatch[1] && !/^(?:ex|su|sp|na)$/i.test(parenMatch[1].trim())) {
          chosenShield = parenMatch[1].trim().toLowerCase();
        }
      }
      if (!chosenShield || chosenShield === 'any' || chosenShield === 'all' || chosenShield === 'shield') {
        return true;
      }
      return activeShields.some(sh => {
        const sName = String(sh.name || '').toLowerCase().trim();
        const sId = String(sh.baseItemId || sh.id || '').toLowerCase().replace(/^(?:srd[-_])?(?:arm|shd|itm)[-_]/g, '').replace(/[-_]+/g, ' ').trim();
        const combined = `${sName} ${sId}`.trim();
        if (combined.includes(chosenShield) || chosenShield.includes(sName)) return true;
        if (chosenShield.includes('heavy') && combined.includes('heavy')) return true;
        if (chosenShield.includes('light') && combined.includes('light')) return true;
        if (chosenShield.includes('buckler') && combined.includes('buckler')) return true;
        if (chosenShield.includes('tower') && combined.includes('tower')) return true;
        return false;
      });
    }
    if (low === 'wieldingchosenweapon' || low === 'wielding chosen weapon') {
      if (evalCtx && evalCtx.weapon && typeof evalCtx.weapon === 'object') {
        const chosenWep = this.extractEntryChoice(entry).toLowerCase();
        if (!chosenWep || chosenWep === 'any' || chosenWep === 'all') return true;
        const wName = String(evalCtx.weapon.name || '').toLowerCase();
        const wBase = String(evalCtx.weapon.baseItemId || evalCtx.weapon.id || '').toLowerCase().replace(/^(?:srd[-_])?(?:wpn|wep)[-_]/g, '').replace(/[-_]+/g, ' ');
        return `${wName} ${wBase}`.includes(chosenWep);
      }
      return 'qualifier';
    }
    if (low === 'castingchosenschool' || low === 'casting chosen school') {
      if (evalCtx && evalCtx.spell && typeof evalCtx.spell === 'object') {
        const chosenSchool = this.extractEntryChoice(entry).toLowerCase();
        if (!chosenSchool || chosenSchool === 'any' || chosenSchool === 'all') return true;
        const spSchool = String(evalCtx.spell.school || evalCtx.spell.spell?.school || '').toLowerCase();
        return Boolean(spSchool && (spSchool.includes(chosenSchool) || chosenSchool.includes(spSchool)));
      }
      return 'qualifier';
    }
    if (low === 'notheavyarmororheavyload') {
      const armCat = String(ch.effectiveArmorCategory || ch.acBreakdown?.armorCategory || '').toLowerCase();
      const loadStr = String(ch.encumbrance || ch.loadCategory || ch.carryingLoad || ch.acBreakdown?.load || '').toLowerCase();
      return armCat !== 'heavy' && !loadStr.includes('heavy') && !loadStr.includes('overload');
    }
    if (low === 'lightornoarmorandlightload') {
      const armCat = String(ch.effectiveArmorCategory || ch.acBreakdown?.armorCategory || '').toLowerCase();
      const loadStr = String(ch.encumbrance || ch.loadCategory || ch.carryingLoad || ch.acBreakdown?.load || '').toLowerCase();
      return armCat !== 'medium' && armCat !== 'heavy' && !loadStr.includes('medium') && !loadStr.includes('heavy') && !loadStr.includes('overload');
    }

    // 4. HP Thresholds (`hp <= 50%`, `hp < 50%`, `bloodied`, `full hp`)
    const curHp = Number(ch.hp?.current ?? ch.hp?.max ?? 10);
    const maxHp = Math.max(1, Number(ch.hp?.max ?? 10));
    if (low === 'bloodied' || low === 'hp <= 50%' || low === 'hp <= 0.5' || low === 'below half hp') {
      return curHp <= Math.floor(maxHp / 2);
    }
    if (low === 'hp < 50%') {
      return curHp < Math.floor(maxHp / 2);
    }
    if (low === 'full hp' || low === 'hp == 100%' || low === 'hp >= max') {
      return curHp >= maxHp;
    }
    const hpPctMatch = low.match(/^hp\s*(<=|<|>=|>|==|=)\s*(\d+)\s*%$/);
    if (hpPctMatch) {
      const op = hpPctMatch[1];
      const pct = Number(hpPctMatch[2]) / 100;
      const ratio = curHp / maxHp;
      if (op === '<=') return ratio <= pct;
      if (op === '<') return ratio < pct;
      if (op === '>=') return ratio >= pct;
      if (op === '>') return ratio > pct;
      return Math.abs(ratio - pct) < 0.001;
    }

    // 5. Active Buff / Stance / Mode check (`buff:haste`, `hasBuff:Prayer`, `mode:2-Hand`, `stance:Island of Blades`)
    if (low.startsWith('buff:') || low.startsWith('hasbuff:')) {
      const bTarget = low.replace(/^(?:has)?buff:/, '').trim();
      return (Array.isArray(ch.buffs) ? ch.buffs : []).some(b => b && b.active && (
        String(b.id || '').toLowerCase() === bTarget ||
        String(b.name || '').toLowerCase().includes(bTarget)
      ));
    }
    if (low.startsWith('stance:')) {
      const sTarget = low.slice(7).trim();
      return String(ch.activeStance || '').toLowerCase().includes(sTarget);
    }
    if (low.startsWith('mode:')) {
      const mTarget = low.slice(5).trim();
      const activeModes = ch.activeModes || evalCtx.activeModes || {};
      const entryId = entry?.id || entry?.baseItemId;
      if (entryId && activeModes[entryId] !== undefined) {
        const sel = activeModes[entryId];
        if (String(sel).toLowerCase() === mTarget) return true;
        const modeObj = Array.isArray(entry?.modes) ? entry.modes[Number(sel)] : null;
        if (modeObj && (String(modeObj.name || modeObj.label || modeObj.id || '').toLowerCase() === mTarget)) return true;
        return false;
      }
      return Object.values(activeModes).some(v => String(v).toLowerCase() === mTarget);
    }

    // 6. Formula comparison expression (e.g. "@essentia >= 2", "@cl >= 5", "@ml >= 3")
    const cmpMatch = cond.match(/^(@[a-zA-Z0-9_.]+|\d+)\s*(>=|<=|===|==|!=|>|<)\s*(@[a-zA-Z0-9_.]+|\d+)$/);
    if (cmpMatch) {
      const lhs = Number(this.evaluateFormula(cmpMatch[1], evalCtx)) || 0;
      const op = cmpMatch[2];
      const rhs = Number(this.evaluateFormula(cmpMatch[3], evalCtx)) || 0;
      if (op === '>=') return lhs >= rhs;
      if (op === '<=') return lhs <= rhs;
      if (op === '>') return lhs > rhs;
      if (op === '<') return lhs < rhs;
      if (op === '!=') return lhs !== rhs;
      return lhs === rhs;
    }

    // 6b. Natural-language level gates in V3 splat branches (e.g. "Class level 6+", "Shadowcaster Lvl 7–12", "Shadowcaster Lvl 14+")
    const lvlRangeMatch = cond.match(/\b(?:class\s+level|lvl|level)\s+(\d+)\s*[–-]\s*(\d+)\b/i);
    if (lvlRangeMatch) {
      const lv = Number(evalCtx.classLevel || evalCtx.level || ch.level || 1);
      return lv >= Number(lvlRangeMatch[1]) && lv <= Number(lvlRangeMatch[2]);
    }
    const lvlPlusMatch = cond.match(/^(?:[a-z]+\s+)?(?:class\s+level|lvl|level)\s+(\d+)\+/i);
    if (lvlPlusMatch) {
      const lv = Number(evalCtx.classLevel || evalCtx.level || ch.level || 1);
      return lv >= Number(lvlPlusMatch[1]);
    }

    // 7. Situational combat/save notes (`vs. Evil`, `vs. Fear`, `against traps`) vs descriptive corpus notes
    if (/^(?:vs\.?\b|against\b|to\s+oppose\b|on\s+saves?\s+against\b)/i.test(cond)) {
      return 'situational';
    }
    return 'qualifier';
  },

  /**
   * Canonical V3 Rule Crafter Block Interpreter (`RuleEngine.evaluateV3Entry(entry, ctx)`).
   * Evaluates V3 `blocks[]` / `effects[]` (`stat`, `roll`, `attack`, `defense`, `effect`, `resource`, `when`, `while`, `table`, `carrier`),
   * active `modes[]` (`char.activeModes?.[entry.id]`), Incarnum `chakraBinds[boundChakra]`, Psionic `augment`,
   * V3 `chassis` / `weapon` / `armor` / `race` / `progression`, and passive `ruleFlags` -> English `tacticalBadges`.
   */
  evaluateV3Entry(entry, ctx = {}) {
    if (!entry || typeof entry !== 'object') return entry;
    const ch = (ctx && (ctx.abilities || ctx.levelProgression || ctx.bodySlots || ctx.classes) && !ctx.character)
      ? ctx
      : (ctx?.character || this._activeCharacter || (typeof window !== 'undefined' ? window.character : null) || {});
    const evalCtx = this.buildV3FormulaContext(ch, entry, (ctx && ctx !== ch) ? ctx : {});

    // Check Copy-on-Write Character Override (`char.customEntries[id]`) first
    let baseEntry = entry;
    if (!entry._customOverrideApplied) {
      const customOv = this.resolveCustomEntryOverride(entry, ch);
      if (customOv && customOv !== entry) {
        const instChoice = this.extractEntryChoice(entry) || this.extractEntryChoice(customOv);
        baseEntry = Object.assign({}, entry, customOv, {
          _customOverrideApplied: true,
          ...(instChoice ? { choice: instChoice } : {}),
          active: entry.active !== undefined ? entry.active : customOv.active,
          equipped: entry.equipped !== undefined ? entry.equipped : customOv.equipped,
          isEquipped: entry.isEquipped !== undefined ? entry.isEquipped : customOv.isEquipped,
          slot: entry.slot || customOv.slot,
          grip: entry.grip || customOv.grip,
          essentia: entry.essentia !== undefined ? entry.essentia : (entry.invested !== undefined ? entry.invested : customOv.essentia),
          invested: entry.invested !== undefined ? entry.invested : (entry.essentia !== undefined ? entry.essentia : customOv.invested),
          boundChakra: entry.boundChakra || entry.chakraBind || customOv.boundChakra,
          augmentPP: entry.augmentPP !== undefined ? entry.augmentPP : customOv.augmentPP,
          castsToday: entry.castsToday !== undefined ? entry.castsToday : customOv.castsToday,
          targetCR: entry.targetCR !== undefined ? entry.targetCR : customOv.targetCR
        });
      }
    }

    const out = Object.assign({}, baseEntry);
    const entryEssentia = Number(evalCtx.essentia ?? out.essentia ?? out.invested ?? evalCtx.self?.invested ?? 0) || 0;
    const entryCl = Number(evalCtx.cl ?? out.casterLevel ?? out.cl ?? evalCtx.level ?? 1) || 1;
    const entryMl = Number(evalCtx.ml ?? out.manifesterLevel ?? out.ml ?? entryCl) || 1;
    const entryIl = Number(evalCtx.il ?? out.initiatorLevel ?? out.il ?? evalCtx.level ?? 1) || 1;
    const entryEbl = Number(evalCtx.ebl ?? out.effectiveBinderLevel ?? out.ebl ?? evalCtx.level ?? 1) || 1;
    const boundChakra = evalCtx.boundChakra ?? out.boundChakra ?? out.chakraBind ?? null;

    // Psionics Augment Cap (XPH RAW: baseCost + augmentPP <= ML)
    const rawAugmentPP = Math.max(0, Number(evalCtx.augmentPP ?? out.augmentPP ?? 0) || 0);
    const powerLvl = Number(out.level ?? 1) || 1;
    const basePowerCost = Number(out.baseCost ?? out.powerPoints ?? (powerLvl * 2 - 1)) || 1;
    const hasMlCap = Boolean(out.type === 'Power' || out.category === 'Power' || out.augment || evalCtx.enforceAugmentCap);
    const maxAllowedAugment = hasMlCap ? Math.max(0, entryMl - basePowerCost) : rawAugmentPP;
    const effectiveAugmentPP = hasMlCap ? Math.min(rawAugmentPP, maxAllowedAugment) : rawAugmentPP;

    const localCtx = Object.assign({}, evalCtx, {
      cl: entryCl,
      casterLevel: entryCl,
      ml: entryMl,
      manifesterLevel: entryMl,
      il: entryIl,
      initiatorLevel: entryIl,
      ebl: entryEbl,
      effectiveBinderLevel: entryEbl,
      essentia: entryEssentia,
      augmentPP: effectiveAugmentPP,
      boundChakra,
      self: Object.assign({}, evalCtx.self || {}, {
        stacks: Number(out.stacks ?? evalCtx.self?.stacks ?? 1) || 1,
        invested: entryEssentia
      })
    });

    const getSeedArr = (prop, seedProp) => {
      if (baseEntry._v3Evaluated) {
        return Array.isArray(baseEntry[seedProp]) ? baseEntry[seedProp].map(x => Object.assign({}, x)) : [];
      }
      if (Object.prototype.propertyIsEnumerable.call(out, prop) && Array.isArray(out[prop])) {
        return out[prop].map(x => Object.assign({}, x));
      }
      return [];
    };

    const seedModifiers = getSeedArr('modifiers', '_seedModifiers');
    const seedDamageParts = getSeedArr('damageParts', '_seedDamageParts');
    const seedDefenses = getSeedArr('defenses', '_seedDefenses');
    const seedResources = getSeedArr('resources', '_seedResources');
    const seedGrants = getSeedArr('grants', '_seedGrants');

    const modifiers = seedModifiers.map(m => Object.assign({}, m));
    const damageParts = seedDamageParts.map(d => Object.assign({}, d));
    const defenses = seedDefenses.map(d => Object.assign({}, d));
    const resources = seedResources.map(r => Object.assign({}, r));
    const grants = seedGrants.map(g => Object.assign({}, g));
    const ruleFlags = Object.assign({}, out.ruleFlags || {});
    const tacticalBadges = this.formatRuleFlagBadges(ruleFlags, out);
    const addBadge = (b) => {
      if (b && !tacticalBadges.includes(b)) tacticalBadges.push(b);
    };

    // Map V3 Weapon / Armor / Race / Chassis / Monster sub-objects onto standard fields
    if (out.weapon && typeof out.weapon === 'object') {
      const w = out.weapon;
      if (w.damageDice && !out.dice) out.dice = w.damageDice;
      if (w.dmgType && !out.dmgType) out.dmgType = w.dmgType;
      const wCritRange = w.baseCritRange ?? w.critRange;
      const wCritMult = w.critMultiplier ?? w.critMult;
      const wProf = w.category ?? w.proficiency;
      if (wCritRange && !out.critRange) out.critRange = wCritRange;
      if (wCritMult && !out.critMult) out.critMult = wCritMult;
      if (w.handedness && !out.handedness) out.handedness = w.handedness;
      if (wProf && !out.proficiency) out.proficiency = wProf;
      if (w.rangeIncrement && !out.range) out.range = w.rangeIncrement;
      if (w.enhancementBonus && !out.enhancementBonus) out.enhancementBonus = Number(w.enhancementBonus) || 0;
      if (w.masterwork && out.isMasterwork === undefined) out.isMasterwork = true;
      if (w.damageDice && damageParts.length === 0) {
        damageParts.push({
          dice: String(w.damageDice),
          bonus: 0,
          type: w.dmgType || 'Slashing',
          multiplyOnCrit: true,
          onCritOnly: false,
          source: out.name || 'Base Weapon'
        });
      }
    }
    if (out.armor && typeof out.armor === 'object') {
      const a = out.armor;
      // Single canonical chassis derivation (base + top-level enhancementBonus); flagged `chassis` so
      // parseItemModifiers re-applies it exactly once instead of treating it as an explicit modifier.
      const chassis = this.resolveArmorChassis(out);
      for (let ci = modifiers.length - 1; ci >= 0; ci--) {
        if (modifiers[ci] && modifiers[ci].chassis) modifiers.splice(ci, 1);
      }
      if (chassis && chassis.total > 0 && !modifiers.some(m => m && m.target === chassis.target)) {
        modifiers.push({ target: chassis.target, value: chassis.total, type: chassis.bonusType, condition: null, source: chassis.label, chassis: true });
      }
      if (a.maxDex !== undefined && a.maxDex !== null && out.maxDex === undefined) out.maxDex = Number(a.maxDex);
      const rawAcp = a.armorCheckPenalty ?? a.acp;
      const rawAsf = a.arcaneSpellFailure ?? a.asf;
      if (rawAcp !== undefined && rawAcp !== null && out.checkPenalty === undefined) out.checkPenalty = Number(rawAcp);
      if (rawAsf !== undefined && rawAsf !== null && out.spellFailure === undefined) out.spellFailure = Number(rawAsf);
      if (a.speed !== undefined && a.speed !== null && out.speed30 === undefined) out.speed30 = Number(a.speed);
      if (a.armorType && !out.armorCategory && !['Light', 'Medium', 'Heavy'].includes(out.category)) out.armorCategory = a.armorType;
    }
    if (out.race && typeof out.race === 'object') {
      if (out.race.size) out.size = out.race.size;
      const rSpd = out.race.speed !== undefined ? out.race.speed : out.race.baseSpeed;
      if (rSpd !== undefined && rSpd !== null) out.baseSpeed = Number(rSpd) || 30;
      if (out.race.levelAdjustment !== undefined && out.race.levelAdjustment !== null) {
        out.levelAdjustment = Number(out.race.levelAdjustment) || 0;
      }
      if (out.race.creatureType) out.creatureType = out.race.creatureType;
      if (out.race.favoredClass) out.favoredClass = out.race.favoredClass;
      if (out.race.bonusFeatAt1st !== undefined) out.bonusFeatAt1st = Boolean(out.race.bonusFeatAt1st);
      if (out.race.humanBonusSkillPoints !== undefined) out.humanBonusSkillPoints = Boolean(out.race.humanBonusSkillPoints);
    }
    if (out.monster && typeof out.monster === 'object') {
      const m = out.monster;
      if (m.size && !out.size) out.size = m.size;
      if (m.speeds && m.speeds.land !== undefined && !out.baseSpeed) out.baseSpeed = Number(m.speeds.land) || 0;
      if (m.levelAdjustment !== undefined && m.levelAdjustment !== null && out.levelAdjustment === undefined) {
        out.levelAdjustment = Number(m.levelAdjustment) || 0;
      }
      if (Array.isArray(m.nonabilities) && !Array.isArray(out.nonabilities)) {
        out.nonabilities = m.nonabilities.slice();
      }
      const natAc = Number(m.ac?.naturalArmor || 0) || 0;
      if (natAc > 0 && !modifiers.some(x => x && x.target === 'ac.natural')) {
        modifiers.push({ target: 'ac.natural', value: natAc, type: 'Natural Armor', condition: null, source: out.name || 'Natural Armor' });
      }
    }
    if (out.chassis && typeof out.chassis === 'object') {
      if (out.chassis.hitDie && !out.hitDie) out.hitDie = out.chassis.hitDie;
      if (out.chassis.bab && !out.babProgression) out.babProgression = out.chassis.bab;
      if (out.chassis.skillPoints && !out.skillPointsPerLevel) out.skillPointsPerLevel = out.chassis.skillPoints;
      if (!out.savingThrows && (out.chassis.fort || out.chassis.ref || out.chassis.will)) {
        out.savingThrows = {
          fort: out.chassis.fort === 'good' || out.chassis.fort === 'high' ? 'high' : 'low',
          ref: out.chassis.ref === 'good' || out.chassis.ref === 'high' ? 'high' : 'low',
          will: out.chassis.will === 'good' || out.chassis.will === 'high' ? 'high' : 'low'
        };
      }
    }

    const pushModifier = (modObj) => {
      if (!modObj || !modObj.target) return;
      const isDup = modifiers.some(m =>
        m &&
        m.target === modObj.target &&
        m.type === modObj.type &&
        m.value === modObj.value &&
        (m.formula || null) === (modObj.formula || null) &&
        (m.condition || null) === (modObj.condition || null) &&
        (m.sourceLabel || null) === (modObj.sourceLabel || null)
      );
      if (!isDup) modifiers.push(modObj);
    };

    const buildStatFormulaAndValue = (b, branchCtx) => {
      const terms = [];
      const rawVal = b.val !== undefined ? b.val : b.value;
      const mode = String(b.mode || '').toLowerCase().trim();
      const statAbilityRaw = String(b.stat || '').toLowerCase().trim();
      const statAbility = statAbilityRaw.replace(/mod$/, '').replace(/^var:/, '');

      // Rule Crafter `mode: 'replaceStat'` (Parametric A -> B Stat / Formula Swap)
      if (mode === 'replacestat') {
        const rawTo = String(b.toStat || b.formula || 'wis').trim();
        let swapExpr = rawTo;
        if (rawTo === 'choice.abilityMod' || rawTo === '@choice.abilityMod') {
          const chosenAbRaw = String(this.extractEntryChoice(out) || 'wis').toLowerCase().trim();
          const abMap = { str: 'str', strength: 'str', dex: 'dex', dexterity: 'dex', con: 'con', constitution: 'con', int: 'int', intelligence: 'int', wis: 'wis', wisdom: 'wis', cha: 'cha', charisma: 'cha' };
          const abKey = abMap[chosenAbRaw] || 'wis';
          swapExpr = `@${abKey}Mod`;
        } else if (/^([0-9.]+)\*([a-z]+)$/i.test(rawTo)) {
          const mm = rawTo.match(/^([0-9.]+)\*([a-z]+)$/i);
          swapExpr = `floor(@${mm[2].toLowerCase()}Mod * ${mm[1]})`;
        } else if (/^(str|dex|con|int|wis|cha)$/i.test(rawTo)) {
          swapExpr = `@${rawTo.toLowerCase()}Mod`;
        }
        let capRaw = null;
        const bCapStr = b.cap !== undefined && b.cap !== null ? String(b.cap).trim() : '';
        if (bCapStr && bCapStr.toLowerCase() !== 'none') {
          if (bCapStr.toLowerCase() === 'flat' || bCapStr.toLowerCase() === 'number') capRaw = b.capVal !== undefined && b.capVal !== null ? b.capVal : null;
          else if (isNaN(Number(bCapStr)) && !bCapStr.startsWith('@') && !/[+\-*/()]/.test(bCapStr)) capRaw = `@${bCapStr}`;
          else capRaw = b.cap;
        }
        let ev = Number(this.evaluateFormula(swapExpr, branchCtx));
        if (!Number.isFinite(ev)) ev = 0;
        let finalExpr = swapExpr;
        if (capRaw !== null && String(b.subOp || 'max').toLowerCase() === 'add') {
          const capNum = Number(this.evaluateFormula(capRaw, branchCtx));
          if (Number.isFinite(capNum)) {
            ev = Math.min(ev, capNum);
            finalExpr = `min(${capRaw}, ${swapExpr})`;
          }
        }
        return { value: Math.trunc(ev), formula: finalExpr, cap: String(b.subOp || 'max').toLowerCase() === 'add' ? capRaw : null };
      }

      // Rule Crafter `mode: 'perCL'` (`Scale by Level`): clamp(floor(@cl / per) * value, min, max), matching the
      // Rule Crafter export `clamp(floor(@cl/per)*value,min,max)`. `min` is a floor, not an additive base
      // (Divine Favor: +1 per 3 CL, at least +1, max +3 -> CL 3 = +1, CL 6 = +2, CL 9+ = +3).
      if (mode === 'percl' && !b.perCL && !b.perLvl && !b.perLevel) {
        const step = Number(rawVal ?? 1) || 1;
        const every = Math.max(1, Number(b.per ?? 1) || 1);
        const baseMin = Number(b.min ?? 0) || 0;
        const maxCap = (b.max !== undefined && b.max !== null && b.max !== '') ? Number(b.max) : null;
        const scaleExpr = every === 1
          ? (step === 1 ? '@cl' : `(@cl * ${step})`)
          : (step === 1 ? `floor(@cl / ${every})` : `(floor(@cl / ${every}) * ${step})`);
        const cappedExpr = (maxCap !== null && Number.isFinite(maxCap) && maxCap > 0) ? `min(${maxCap}, ${scaleExpr})` : scaleExpr;
        const expr = baseMin !== 0 ? `max(${baseMin}, ${cappedExpr})` : cappedExpr;
        const ev = Number(this.evaluateFormula(expr, branchCtx)) || 0;
        return { value: Math.trunc(ev), formula: expr, cap: maxCap };
      }

      const useStatMode = (mode === 'stat') || (!mode && Boolean(statAbilityRaw));
      if (useStatMode && ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(statAbility)) {
        const mult = Number(b.mult ?? b.multiplier ?? 1);
        const modToken = `@${statAbility}Mod`;
        terms.push(mult !== 1 ? `floor(${modToken} * ${mult})` : modToken);
        const flatAdd = Number(b.val !== undefined ? b.val : 0);
        if (!mode && !Number.isNaN(flatAdd) && flatAdd !== 0) {
          terms.push(String(flatAdd));
        }
      } else if (useStatMode && ['essentia', 'cl', 'ml', 'il', 'ebl', 'level', 'hd', 'bab', 'augmentpp'].includes(statAbility)) {
        const mult = Number(b.mult ?? b.multiplier ?? 1);
        const token = statAbility === 'augmentpp' ? '@augmentPP' : `@${statAbility}`;
        terms.push(mult !== 1 ? `floor(${token} * ${mult})` : token);
        const flatAdd = Number(b.val !== undefined ? b.val : 0);
        if (!mode && !Number.isNaN(flatAdd) && flatAdd !== 0) {
          terms.push(String(flatAdd));
        }
      } else if (b.formula !== undefined && b.formula !== null && String(b.formula).trim() !== '') {
        terms.push(String(b.formula).trim());
      } else if (typeof rawVal === 'string' && isNaN(Number(rawVal))) {
        terms.push(rawVal.trim());
      } else {
        const baseNum = Number(rawVal ?? 0) || 0;
        if (baseNum !== 0 || (!b.perLvl && !b.perLevel && !b.perCL && !b.perML && !b.perIL && !b.perEssentia && !b.halfLvl)) {
          terms.push(String(baseNum));
        }
      }

      const perLvl = Number(b.perLvl ?? b.perLevel ?? 0) || 0;
      if (perLvl > 0) {
        terms.push(perLvl === 1 ? '@level' : `floor(@level / ${perLvl})`);
      }
      const perCL = Number(b.perCL ?? 0) || 0;
      if (perCL > 0) {
        terms.push(perCL === 1 ? '@cl' : `floor(@cl / ${perCL})`);
      }
      const perML = Number(b.perML ?? 0) || 0;
      if (perML > 0) {
        terms.push(perML === 1 ? '@ml' : `floor(@ml / ${perML})`);
      }
      const perIL = Number(b.perIL ?? 0) || 0;
      if (perIL > 0) {
        terms.push(perIL === 1 ? '@il' : `floor(@il / ${perIL})`);
      }
      const perEssentia = Number(b.perEssentia ?? 0) || 0;
      if (perEssentia !== 0) {
        terms.push(perEssentia === 1 ? '@essentia' : `(@essentia * ${perEssentia})`);
      }
      if (b.halfLvl) {
        terms.push('floor(@level / 2)');
      }

      const rawExpr = terms.length > 0 ? terms.join(' + ') : '0';
      let capRaw = null;
      const bCapStr = b.cap !== undefined && b.cap !== null ? String(b.cap).trim() : '';
      if (bCapStr && bCapStr.toLowerCase() !== 'none') {
        if (bCapStr.toLowerCase() === 'number') {
          capRaw = b.capVal !== undefined && b.capVal !== null ? b.capVal : null;
        } else if (isNaN(Number(bCapStr)) && !bCapStr.startsWith('@') && !/[+\-*/()]/.test(bCapStr)) {
          capRaw = `@${bCapStr}`;
        } else {
          capRaw = b.cap;
        }
      } else if (!mode && b.max !== undefined && b.max !== null && b.max !== '') {
        capRaw = b.max;
      }
      let evaluated = Number(this.evaluateFormula(rawExpr, branchCtx)) || 0;
      let formulaStr = rawExpr;
      if (capRaw !== null) {
        const capNum = Number(this.evaluateFormula(capRaw, branchCtx));
        if (Number.isFinite(capNum)) {
          evaluated = Math.min(evaluated, capNum);
          formulaStr = `min(${capRaw}, ${rawExpr})`;
        }
      }
      const isDynamic = /@|floor|ceil|min|max/i.test(formulaStr);
      return {
        value: Math.trunc(evaluated),
        formula: isDynamic ? formulaStr : null,
        cap: capRaw
      };
    };

    const walkBlocks = (blockList, branchMeta = {}) => {
      if (!Array.isArray(blockList)) return;
      const curCtx = branchMeta.ctx || localCtx;
      const situationalCond = branchMeta.situationalCond || null;
      const sourceLabel = branchMeta.sourceLabel || null;

      const resolveBranchSituational = (condRaw, condRes, fallbackCond, isNote) => {
        const cStr = String(condRaw || '').trim();
        const cLow = cStr.toLowerCase();
        if (cLow === 'vsaoofrommovement') return 'vs. AoO from Movement';
        if (cLow === 'wieldingchosenweapon') return 'wieldingChosenWeapon';
        if (cLow === 'castingchosenschool') return 'castingChosenSchool';
        if (condRes === 'situational' || isNote) return cStr;
        return fallbackCond;
      };

      const NAMED_WHEN_CONDS = new Set([
        'notflatfooted', 'wieldingchosenshield', 'wieldingchosenweapon',
        'wieldingtwoweapons', 'vsaoofrommovement', 'castingchosenschool',
        'notheavyarmororheavyload', 'lightornoarmorandlightload'
      ]);

      blockList.forEach(b => {
        if (!b || typeof b !== 'object') return;
        // "Gained at Level / HD" (race and template progression): the block applies from that character level on.
        if (!this.isLevelGainUnlocked(b, curCtx)) return;
        const rawBType = b.type || (['when', 'while', 'table', 'carrier', 'stat', 'roll', 'attack', 'defense', 'effect', 'resource'].includes(String(b.kind || '').toLowerCase().trim()) ? b.kind : 'stat');
        const bType = String(rawBType || 'stat').toLowerCase().trim();

        // 1. Conditional Branch (`when` / `while`, including Rule Crafter `branches[]`)
        if (bType === 'when' || bType === 'while') {
          if (Array.isArray(b.branches) && b.branches.length > 0) {
            let matchedAny = false;
            b.branches.forEach(br => {
              if (!br || typeof br !== 'object' || matchedAny) return;
              const brKindRaw = String(br.condKind || 'toggle').trim();
              const brKind = brKindRaw.toLowerCase();
              const rawBrText = br.condText !== undefined ? String(br.condText).trim() : (br.condition !== undefined ? String(br.condition).trim() : '');
              const brCond = NAMED_WHEN_CONDS.has(brKind) ? brKindRaw : rawBrText;
              const brChildren = Array.isArray(br.effects) ? br.effects : (Array.isArray(br.blocks) ? br.blocks : (Array.isArray(br.then) ? br.then : (Array.isArray(br.children) ? br.children : [])));
              if (brKind === 'else') {
                matchedAny = true;
                walkBlocks(brChildren, branchMeta);
                return;
              }
              const brRes = this.evaluateV3BranchCondition(brCond, bType, curCtx, ch, out);
              if (brRes !== false) {
                matchedAny = true;
                const nextSituational = resolveBranchSituational(brCond, brRes, situationalCond, brKind === 'note');
                const nextLabel = ((brRes === true || brRes === 'qualifier') && brCond && typeof brCond === 'string' && brKind !== 'note') ? brCond : sourceLabel;
                walkBlocks(brChildren, { ctx: curCtx, situationalCond: nextSituational, sourceLabel: nextLabel });
              }
            });
            return;
          }
          const flatIsNote = String(b.condKind || '').toLowerCase() === 'note';
          const condExpr = b.condition || b.when || b.while || (b.condText !== undefined ? String(b.condText).trim() : undefined);
          const condRes = this.evaluateV3BranchCondition(condExpr, bType, curCtx, ch, out);
          if (condRes === false && !flatIsNote) {
            if (Array.isArray(b.else) && b.else.length > 0) {
              walkBlocks(b.else, branchMeta);
            }
            return;
          }
          const nextSituational = resolveBranchSituational(condExpr, condRes, situationalCond, flatIsNote);
          const nextLabel = ((condRes === true || condRes === 'qualifier') && condExpr && typeof condExpr === 'string' && !flatIsNote) ? condExpr : sourceLabel;
          const children = Array.isArray(b.then) ? b.then : (Array.isArray(b.blocks) ? b.blocks : (Array.isArray(b.effects) ? b.effects : (Array.isArray(b.children) ? b.children : [])));
          walkBlocks(children, { ctx: curCtx, situationalCond: nextSituational, sourceLabel: nextLabel });
          return;
        }

        // 2. Lookup Table (`table` by level/HD/CL/ML/EBL/essentia)
        if (bType === 'table' && Array.isArray(b.rows)) {
          const keyName = String(b.key || b.lookupKey || 'level').toLowerCase().trim().replace(/^@/, '');
          const keyVal = keyName === 'cl' || keyName === 'casterlevel' ? curCtx.cl
            : (keyName === 'ml' || keyName === 'manifesterlevel' ? curCtx.ml
              : (keyName === 'il' || keyName === 'initiatorlevel' ? curCtx.il
                : (keyName === 'ebl' || keyName === 'binderlevel' ? curCtx.ebl
                  : (keyName === 'essentia' || keyName === 'invested' ? curCtx.essentia
                    : (keyName === 'augmentpp' ? curCtx.augmentPP
                      : (keyName === 'classlevel' ? curCtx.classLevel : curCtx.level))))));
          let matchedRow = null;
          for (let i = 0; i < b.rows.length; i++) {
            const row = b.rows[i];
            if (!row || typeof row !== 'object') continue;
            let rMin = row.min !== undefined ? Number(row.min) : null;
            let rMax = row.max !== undefined ? Number(row.max) : null;
            const rangeRef = row.lvl ?? row.level ?? row.range;
            if (rMin === null && rangeRef !== undefined) {
              const rStr = String(rangeRef).trim();
              const dashMatch = rStr.match(/^(\d+)\s*-\s*(\d+)$/);
              const plusMatch = rStr.match(/^(\d+)\s*\+$/);
              if (dashMatch) {
                rMin = Number(dashMatch[1]);
                rMax = Number(dashMatch[2]);
              } else if (plusMatch) {
                rMin = Number(plusMatch[1]);
                rMax = 99;
              } else {
                rMin = Number(rStr) || 1;
                rMax = row.exact ? rMin : 99;
              }
            }
            if (rMin === null) rMin = 1;
            if (rMax === null) rMax = 99;
            if (keyVal >= rMin && keyVal <= rMax) {
              matchedRow = row;
            }
          }
          if (matchedRow) {
            const rowBlocks = matchedRow.blocks || matchedRow.then || matchedRow.effects;
            if (Array.isArray(rowBlocks) && rowBlocks.length > 0) {
              walkBlocks(rowBlocks, branchMeta);
            } else if (matchedRow.val !== undefined || matchedRow.value !== undefined) {
              const synthTargets = Array.isArray(matchedRow.targets) ? matchedRow.targets : (Array.isArray(b.targets) ? b.targets : [matchedRow.target || b.target || 'ac.all']);
              walkBlocks([{
                type: 'stat',
                targets: synthTargets,
                val: matchedRow.val ?? matchedRow.value,
                bonusType: matchedRow.bonusType || matchedRow.btype || b.bonusType || b.btype || 'Untyped'
              }], branchMeta);
            }
          }
          return;
        }

        // 3. Carrier / Metamagic / Cast Mod Block (`carrier`)
        if (bType === 'carrier') {
          if (b.carrierMode === 'metamagic') {
            const txNames = {
              empower: 'Empower (x1.5 Variable)', maximize: 'Maximize Dice', quicken: 'Quicken (Swift Action)',
              extend: 'Extend (x2 Duration)', persistent: 'Persistent (24h)', enlarge: 'Enlarge (x2 Range)',
              widen: 'Widen (x2 Area)', twin: 'Twin Spell', splitRay: 'Split Ray (+1 Ray)', chain: 'Chain Secondary Targets',
              heighten: 'Heighten (+Save DC / Level)', energySub: `Energy Substitution (${b.energy || 'Chosen'})`,
              pierceRes: 'Pierce Energy Resistance', silent: 'Silent (No Verbal)', still: 'Still (No Somatic)'
            };
            const txLbl = b.riderText || txNames[b.transform] || out.name || 'Metamagic';
            if (b.costMode === 'rod' || b.costMode === 'sudden') {
              const usesVal = Math.max(1, Number(b.uses ?? 3) || 3);
              const maxSpLvl = b.maxSpellLvl ? `, up to ${b.maxSpellLvl}th-lvl` : '';
              addBadge(`${b.costMode === 'rod' ? 'Metamagic Rod' : 'Sudden Metamagic'}: ${txLbl} (${usesVal}/day${maxSpLvl})`);
              resources.push({
                id: b.id || `${out.id || 'v3'}_rod_${resources.length + 1}`,
                name: out.name || txLbl,
                kind: 'consume',
                maxFormula: usesVal,
                max: usesVal,
                unit: b.costMode === 'rod' ? 'charges' : 'uses',
                recharge: { period: 'day', dice: null }
              });
            } else if (b.costMode === 'passive') {
              addBadge(`Metamagic: ${txLbl} (+0 Slot)`);
            } else {
              const adj = Number(b.slotAdj ?? 1);
              addBadge(`Metamagic: ${txLbl} (${adj >= 0 ? '+' : ''}${adj} Slot)`);
            }
          } else if (b.carrierMode === 'meleeChannel') {
            addBadge('Channel Touch Spell Through Melee Attack');
          } else if (b.carrierMode === 'fullAttackCast') {
            addBadge(`Spell Combat (${Number(b.atkPenalty ?? -2)} Attack)`);
          } else {
            const rider = b.riderEffect || b.effect || b.condition || b.riderText || 'Rider Effect';
            const saveType = b.saveType || b.save || '';
            const dcVal = b.dc ? (Number(this.evaluateFormula(b.dc, curCtx)) || b.dc) : '';
            const badgeStr = saveType
              ? `On Hit: ${rider} (${saveType}${dcVal ? ` DC ${dcVal}` : ''}${b.negates === false ? ' partial' : ' negates'})`
              : `On Hit: ${rider}`;
            addBadge(badgeStr);
          }
          const childBlocks = b.blocks || b.then || b.effects;
          if (Array.isArray(childBlocks) && childBlocks.length > 0) {
            walkBlocks(childBlocks, branchMeta);
          }
          return;
        }

        // 4. Stat Block (`stat`)
        if (bType === 'stat') {
          let InlineCondResult = true;
          const isObjectPredicate = Boolean(b.condition && typeof b.condition === 'object');
          if (b.condition && !isObjectPredicate) {
            InlineCondResult = this.evaluateV3BranchCondition(b.condition, 'when', curCtx, ch, out);
            if (InlineCondResult === false) return;
          }
          const rawTargets = Array.isArray(b.targets) && b.targets.length > 0
            ? b.targets
            : (b.target ? [b.target] : ['ac.all']);
          const bonusType = this.normalizeV3BonusType(b.bonusType || b.btype || 'Untyped');
          const { value, formula, cap } = buildStatFormulaAndValue(b, curCtx);
          const effSituational = isObjectPredicate
            ? Object.assign({}, b.condition)
            : ((InlineCondResult === 'situational' || InlineCondResult === 'qualifier')
              ? resolveBranchSituational(b.condition, InlineCondResult, String(b.condition), false)
              : situationalCond);
          const effNote = (!isObjectPredicate && InlineCondResult === true && b.condition && typeof b.condition === 'string') ? b.condition : sourceLabel;

          const isReplaceStatMode = String(b.mode || '').toLowerCase().trim() === 'replacestat';
          const effectiveRawTargets = (isReplaceStatMode && b.swapTarget) ? [b.swapTarget] : rawTargets;

          effectiveRawTargets.forEach(rawT => {
            let canonT = this.canonicalizeV3Target(rawT);
            if (isReplaceStatMode) {
              const swapLegacyAlias = {
                'save.will': 'save.will.abilityMod',
                'save.ref': 'save.ref.abilityMod',
                'save.fort': 'save.fort.abilityMod',
                'ac.all': 'ac.abilityMod',
                'atk.melee': 'atk.melee.abilityMod',
                'atk.ranged': 'atk.ranged.abilityMod',
                'atk.touch': 'atk.touch.abilityMod',
                'atk.grapple': 'grapple.abilityMod',
                'dmg.melee': 'dmg.melee.abilityMod',
                'dmg.ranged': 'dmg.ranged.abilityMod',
                'init': 'initiative.abilityMod',
                'hp': 'hp.abilityMod',
                'hp.perLvl': 'hp.abilityMod',
                'spell.dc': 'spell.dc.abilityMod'
              };
              if (swapLegacyAlias[canonT]) canonT = swapLegacyAlias[canonT];
              else if (/^skill\.[a-z0-9_-]+$/i.test(canonT) && !canonT.endsWith('.abilityMod')) {
                canonT = `${canonT.replace(/_/g, '-')}.abilityMod`;
              }
              if (canonT === 'choice.skill.1.abilityMod') {
                const chosenSk = String(this.extractEntryChoice(out) || '').toLowerCase().trim();
                const skSlug = chosenSk.replace(/^skill\./, '').replace(/\.abilitymod$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                if (skSlug) canonT = `skill.${skSlug}.abilityMod`;
              }
              const toLow = String(b.toStat || '').toLowerCase().trim();
              const scLow = String(b.scope || 'all').toLowerCase().trim();
              if (canonT === 'save.will.abilityMod' && toLow === 'con' && scLow === 'all') ruleFlags.conToWillSave = true;
              if (canonT === 'atk.melee.abilityMod' && toLow === 'dex' && scLow === 'finessable') ruleFlags.weaponFinesse = true;
              if (canonT === 'bab' && toLow === '@level') ruleFlags.babEqualsLevel = true;
              if (canonT === 'dmg.melee.abilityMod' && toLow === 'dex' && scLow === 'discipline_weapons') ruleFlags.shadowBlade = true;
            }
            if (canonT.startsWith('choice.')) {
              const chosenRaw = this.extractEntryChoice(out);
              if (chosenRaw) {
                const cLow = chosenRaw.toLowerCase().trim();
                if (canonT === 'choice.skill.1') {
                  const skSlug = cLow.replace(/^skill\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                  if (skSlug) canonT = `skill.${skSlug}`;
                } else if (canonT.startsWith('choice.ability.')) {
                  const abMap = { str: 'str', strength: 'str', dex: 'dex', dexterity: 'dex', con: 'con', constitution: 'con', int: 'int', intelligence: 'int', wis: 'wis', wisdom: 'wis', cha: 'cha', charisma: 'cha' };
                  const abKey = abMap[cLow];
                  if (abKey) canonT = `ability.${abKey}`;
                } else if (canonT === 'choice.save.1') {
                  if (cLow.startsWith('fort')) canonT = 'save.fort';
                  else if (cLow.startsWith('ref')) canonT = 'save.ref';
                  else if (cLow.startsWith('will')) canonT = 'save.will';
                }
              }
            }
            if ((canonT === 'ac.all' || canonT === 'ac.shield') && (b.stacksWithShield || out.id === 'feat-shield-specialization')) {
              canonT = 'ac.shieldBonus';
            }
            if (canonT === 'dr') {
              const bypass = b.bypass || b.drType || '-';
              defenses.push({ kind: 'dr', target: 'physical', value, formula, bypass });
              pushModifier({
                op: 'add',
                target: 'dr',
                value,
                formula,
                cap,
                type: bonusType,
                bypass,
                condition: effSituational,
                sourceLabel: effNote,
                source: out.name || out.id || 'V3 Entry'
              });
              return;
            }
            if (canonT === 'sr') {
              defenses.push({ kind: 'sr', target: 'magic', value, formula });
              pushModifier({
                op: 'add',
                target: 'sr',
                value,
                formula,
                cap,
                type: bonusType,
                condition: effSituational,
                sourceLabel: effNote,
                source: out.name || out.id || 'V3 Entry'
              });
              return;
            }
            if (canonT.startsWith('resist.')) {
              const elem = canonT.slice(7);
              defenses.push({ kind: 'resistance', target: elem, value, formula });
              pushModifier({
                op: 'add',
                target: canonT,
                value,
                formula,
                cap,
                type: bonusType,
                condition: effSituational,
                sourceLabel: effNote,
                source: out.name || out.id || 'V3 Entry'
              });
              return;
            }
            if (canonT === 'fastHealing') {
              defenses.push({ kind: 'fast_healing', target: 'hp', value, formula });
              pushModifier({
                op: 'add',
                target: 'fastHealing',
                value,
                formula,
                cap,
                type: bonusType,
                condition: effSituational,
                sourceLabel: effNote,
                source: out.name || out.id || 'V3 Entry'
              });
              return;
            }
            if (canonT === 'hp.perLvl') {
              const totalHpVal = value * (Number(curCtx.level) || 1);
              const hpFormula = formula ? `(${formula}) * @level` : `${value} * @level`;
              pushModifier({
                op: 'add',
                target: 'hp.perLvl',
                value: totalHpVal,
                formula: hpFormula,
                type: bonusType,
                condition: effSituational,
                sourceLabel: effNote,
                source: out.name || out.id || 'V3 Entry'
              });
              return;
            }
            const resolvedOp = isReplaceStatMode
              ? (String(b.subOp || b.op || 'max').toLowerCase())
              : (b.op || 'add');
            pushModifier({
              op: resolvedOp,
              target: canonT,
              value,
              formula,
              cap,
              type: bonusType,
              stacksWithShield: Boolean(b.stacksWithShield),
              condition: effSituational,
              sourceLabel: effNote,
              source: b.source || out.name || out.id || 'V3 Entry',
              ...(isReplaceStatMode ? {
                scope: b.scope || 'all',
                fromStat: b.fromStat || null,
                toStat: b.toStat || null
              } : {}),
              ...(b.selector ? { selector: b.selector } : {}),
              ...(b.when ? { when: b.when } : {}),
              ...(b.appliesTo ? { appliesTo: b.appliesTo } : {}),
              ...(b.affects ? { affects: b.affects } : {})
            });
          });
          return;
        }

        // 5. Roll / Attack Damage / Temp HP / Healing Block (`roll` / `attack`)
        if (bType === 'roll' || bType === 'attack') {
          if (bType === 'attack' && b.attackMode === 'extra') {
            if (b.extraKind === 'flurry') {
              addBadge(`+${Number(b.count) || 1} Extra Attack (${Number(b.penalty) || -2} All Atk)`);
            } else {
              ruleFlags.extraAttackFullAttack = true;
              addBadge(`+${Number(b.count) || 1} Extra Attack (Full Attack)`);
            }
            return;
          }
          const rollKind = String(b.rollType || b.rollKind || ((b.kind && !['roll', 'attack'].includes(String(b.kind).toLowerCase())) ? b.kind : 'Damage')).trim();
          if (rollKind === 'Temp HP') {
            if (b.tempHpFormula !== undefined && b.tempHpFormula !== null && String(b.tempHpFormula).trim() !== '') {
              out.tempHpFormula = String(b.tempHpFormula).trim();
              return;
            }
            const cnt = Number(b.count ?? 0) || 0;
            const die = String(b.die || 'flat');
            const dicePart = die === 'flat' ? (cnt > 0 ? String(cnt) : '') : `${cnt || 1}${die.replace(/^\d+/, '')}`;
            let scalePart = '';
            if (b.scaling === 'perCL') {
              const amt = Number(b.amount ?? 1) || 1;
              const per = Math.max(1, Number(b.per ?? 1) || 1);
              const maxCap = Number(b.max ?? 20) || 20;
              const clExpr = per === 1 ? (amt === 1 ? '@cl' : `(@cl * ${amt})`) : `(floor(@cl / ${per}) * ${amt})`;
              scalePart = `min(${maxCap}, ${clExpr})`;
            }
            out.tempHpFormula = [dicePart, scalePart].filter(Boolean).join(' + ') || '0';
            return;
          }
          if (rollKind === 'Fast Healing') {
            const fhVal = Number(b.count ?? 1) || 1;
            defenses.push({ kind: 'fast_healing', target: 'hp', value: fhVal, formula: null });
            pushModifier({ op: 'add', target: 'fastHealing', value: fhVal, type: 'Untyped', source: out.name || 'Fast Healing' });
            return;
          }
          const hasExplicitFormulaDice = Boolean(b.dice && /@/.test(String(b.dice)) && !(ctx && ctx.evaluateDynamicDice === true));
          let diceStr = b.dice
            ? String(b.dice).trim()
            : (b.die === 'flat' ? null : ((b.count || b.die) ? `${b.count || 1}${String(b.die || 'd6').replace(/^\d+/, '')}` : ((b.n || b.d) ? `${b.n || 1}d${b.d || 6}` : '1d6')));
          let flatBonus = b.bonus !== undefined
            ? Number(this.evaluateFormula(b.bonus, curCtx)) || 0
            : (b.die === 'flat' ? (Number(b.count) || 0) : (Number(b.flat || 0) || 0));
          if (diceStr && !hasExplicitFormulaDice) {
            const inlineDiceM = diceStr.match(/^(\d+d\d+)\s*([+-]\s*\d+)$/i);
            if (inlineDiceM) {
              diceStr = inlineDiceM[1];
              if (b.bonus === undefined && !b.flat) {
                flatBonus += parseInt(inlineDiceM[2].replace(/\s+/g, ''), 10) || 0;
              }
            } else if (/^\d+$/.test(diceStr) && b.bonus === undefined && !b.flat) {
              flatBonus = parseInt(diceStr, 10) || 0;
              diceStr = null;
            }
          }
          if (b.scaling === 'perCL' && !hasExplicitFormulaDice) {
            const start = Number(b.start ?? 1) || 1;
            const per = Math.max(1, Number(b.per ?? 1) || 1);
            const maxSteps = Math.max(1, Number(b.max ?? 10) || 10);
            const clNow = Number(curCtx.cl) || 1;
            const steps = clNow < start ? 0 : Math.min(maxSteps, Math.floor((clNow - start) / per) + 1);
            const amt = Number(b.amount ?? 1) || 1;
            if (b.die === 'flat') {
              flatBonus = (Number(b.count) > 0 && start > 1 ? Number(b.count) + (steps - 1) * amt : steps * amt);
              diceStr = null;
            } else {
              const totalDice = (Number(b.count) > 0 && start > 1 ? Number(b.count) + (steps - 1) * amt : steps * amt);
              diceStr = `${Math.max(1, totalDice)}${String(b.die || 'd6').replace(/^\d+/, '')}`;
            }
          }
          let dmgType = rollKind === 'Healing' ? 'Positive' : (b.dmgType || b.damageType || 'Untyped');
          if (typeof dmgType === 'string' && /^(@choice|chosen|chosen energy)$/i.test(dmgType.trim())) {
            const chDmg = this.extractEntryChoice(out);
            dmgType = chDmg || 'Energy';
          }
          const dpObj = {
            dice: diceStr,
            bonus: flatBonus,
            type: dmgType,
            multiplyOnCrit: Boolean(b.multiplyOnCrit || b.crit === 'multiply'),
            onCritOnly: Boolean(b.onCritOnly || b.critOnly || b.crit === 'onCritOnly'),
            touchAttack: Boolean(b.touch || b.isTouch),
            saveType: b.saveType || b.save || null,
            dcFormula: b.dc || b.dcFormula || null,
            source: b.source || out.name || out.id || 'V3 Entry'
          };
          if (b.critScaleByMult) dpObj.critScaleByMult = true;
          if (rollKind === 'Healing') dpObj.healing = true;
          if (b.condition || situationalCond) dpObj.condition = b.condition || situationalCond;
          damageParts.push(dpObj);
          if (b.touch || b.isTouch) addBadge('Touch Attack');
          return;
        }

        // 6. Defense Block (`defense`)
        if (bType === 'defense') {
          if (b.mode) {
            const dm = String(b.mode).trim();
            let what = String(b.what || '').trim();
            if (/^(@choice|chosen|chosen energy)$/i.test(what)) {
              const chWhat = this.extractEntryChoice(out);
              if (chWhat) what = chWhat;
            }
            if (dm === 'Immunity' || dm === 'Condition Immunity') {
              const lowW = what.toLowerCase();
              if (lowW === 'fear') ruleFlags.immuneFear = true;
              else if (lowW.includes('mind-affecting') || lowW.includes('mind affecting')) ruleFlags.immuneMindAffecting = true;
              else if (lowW.includes('death')) ruleFlags.immuneDeathEffects = true;
              else if (lowW.includes('poison')) ruleFlags.immunePoison = true;
              else if (lowW.includes('disease')) ruleFlags.immuneDisease = true;
              else if (lowW.includes('paralysis') && lowW.includes('grapple')) ruleFlags.freedomOfMovement = true;
              else if (lowW.includes('paralysis')) ruleFlags.immuneParalysis = true;
              else if (lowW.includes('sleep')) ruleFlags.immuneSleep = true;
              const labelW = /^(@choice|chosen|chosen energy)$/i.test(what) ? 'Chosen Energy' : (what || 'Effect');
              defenses.push({ kind: 'immunity', target: lowW || 'effect', value: 1 });
              addBadge(`Immune: ${labelW}`);
              return;
            }
            if (dm === 'DR' || dm === 'Damage Reduction') {
              if (out.id === 'feat-armor-specialization') {
                const chosenArmor = this.extractEntryChoice(out).toLowerCase();
                const ch = curCtx.character || this._activeCharacter;
                const wornArmor = (ch?.bodySlots?.armor && ch.bodySlots.armor.name && ch.bodySlots.armor.name !== '-')
                  ? ch.bodySlots.armor
                  : ch?.armor;
                if (!wornArmor || !wornArmor.name || wornArmor.name === '-' || wornArmor.active === false) return;
                if (chosenArmor) {
                  const aStr = `${wornArmor.name || ''} ${wornArmor.baseItemId || ''} ${wornArmor.id || ''}`.toLowerCase().replace(/[-_]+/g, ' ');
                  if (!aStr.includes(chosenArmor)) return;
                }
              }
              const drV = Number(b.value ?? 5) || 0;
              const byp = what || '-';
              defenses.push({ kind: 'dr', target: 'physical', value: drV, formula: null, bypass: byp });
              pushModifier({ op: 'add', target: 'dr', value: drV, type: 'Untyped', bypass: byp, source: out.name || 'Defense' });
              return;
            }
            if (dm === 'Energy Resistance' || dm === 'Resistance') {
              const resV = Number(b.value ?? 10) || 0;
              let elem = (what || 'fire').toLowerCase();
              if (elem === '@choice' || elem === 'chosen' || elem === 'chosen energy') {
                const chElem = this.extractEntryChoice(out).toLowerCase();
                elem = ['fire', 'cold', 'acid', 'electricity', 'sonic'].find(x => chElem.includes(x)) || 'chosen';
              } else {
                const matchedElem = ['fire', 'cold', 'acid', 'electricity', 'sonic'].find(x => elem === x || elem.includes(x));
                if (matchedElem && !elem.includes(',')) elem = matchedElem;
              }
              defenses.push({ kind: 'resistance', target: elem, value: resV, formula: null });
              pushModifier({ op: 'add', target: `resist.${elem}`, value: resV, type: 'Untyped', source: out.name || 'Defense' });
              return;
            }
            if (dm === 'Spell Resistance') {
              const srExpr = b.srMode === 'level' ? '10 + @level' : String(Number(b.value ?? 15) || 15);
              const srV = Math.floor(Number(this.evaluateFormula(srExpr, curCtx)) || 0);
              defenses.push({ kind: 'sr', target: 'magic', value: srV, formula: b.srMode === 'level' ? srExpr : null });
              pushModifier({ op: 'add', target: 'sr', value: srV, formula: b.srMode === 'level' ? srExpr : null, type: 'Untyped', source: out.name || 'Defense' });
              return;
            }
            if (dm === 'Concealment %') {
              const concV = Number(b.value ?? 20) || 20;
              ruleFlags.concealment = concV;
              addBadge(`Concealment ${concV}%`);
              return;
            }
            if (dm === 'State Flag') {
              if (b.flag === 'extraAttack') { ruleFlags.extraAttackFullAttack = true; addBadge('+1 Extra Attack (Full Attack)'); }
              else if (b.flag) addBadge(`State: ${b.flag}`);
              return;
            }
            if (dm === 'Sense / Movement' && what) {
              grants.push({ grantType: 'sense', targetId: what, value: 1 });
              addBadge(what);
              return;
            }
            if (dm === 'Size Change') {
              const steps = Number(b.steps ?? 1) || 1;
              out.sizeSteps = steps;
              addBadge(`Size ${steps > 0 ? '+' : ''}${steps} category`);
              return;
            }
          }
          if (b.dr !== undefined || b.sr !== undefined || b.resist !== undefined || b.fastHealing !== undefined) {
            if (b.dr !== undefined && b.dr !== null) {
              const drStr = String(b.dr).trim();
              const slashIdx = drStr.indexOf('/');
              const rawAmt = slashIdx >= 0 ? drStr.slice(0, slashIdx).trim() : drStr;
              const bypass = slashIdx >= 0 ? (drStr.slice(slashIdx + 1).trim() || '-') : (b.bypass || b.drType || '-');
              const drVal = Math.floor(Number(this.evaluateFormula(rawAmt, curCtx)) || Number(rawAmt) || 0);
              const drFormula = /@|floor|ceil|min|max/i.test(rawAmt) ? rawAmt : null;
              defenses.push({ kind: 'dr', target: 'physical', value: drVal, formula: drFormula, bypass });
              pushModifier({ op: 'add', target: 'dr', value: drVal, formula: drFormula, type: 'Untyped', bypass, source: out.name || 'Defense' });
            }
            if (b.sr !== undefined && b.sr !== null) {
              const srExpr = String(b.sr).trim();
              const srVal = Math.floor(Number(this.evaluateFormula(srExpr, curCtx)) || Number(srExpr) || 0);
              const srFormula = /@|floor|ceil|min|max/i.test(srExpr) ? srExpr : null;
              defenses.push({ kind: 'sr', target: 'magic', value: srVal, formula: srFormula });
              pushModifier({ op: 'add', target: 'sr', value: srVal, formula: srFormula, type: 'Untyped', source: out.name || 'Defense' });
            }
            if (b.resist && typeof b.resist === 'object') {
              Object.entries(b.resist).forEach(([elemKey, elemRaw]) => {
                const elem = String(elemKey).toLowerCase().trim();
                const rExpr = String(elemRaw).trim();
                const rVal = Math.floor(Number(this.evaluateFormula(rExpr, curCtx)) || Number(rExpr) || 0);
                const rFormula = /@|floor|ceil|min|max/i.test(rExpr) ? rExpr : null;
                defenses.push({ kind: 'resistance', target: elem, value: rVal, formula: rFormula });
                pushModifier({ op: 'add', target: `resist.${elem}`, value: rVal, formula: rFormula, type: 'Untyped', source: out.name || 'Defense' });
              });
            }
            if (b.fastHealing !== undefined && b.fastHealing !== null) {
              const fhExpr = String(b.fastHealing).trim();
              const fhVal = Math.floor(Number(this.evaluateFormula(fhExpr, curCtx)) || Number(fhExpr) || 0);
              const fhFormula = /@|floor|ceil|min|max/i.test(fhExpr) ? fhExpr : null;
              defenses.push({ kind: 'fast_healing', target: 'hp', value: fhVal, formula: fhFormula });
              pushModifier({ op: 'add', target: 'fastHealing', value: fhVal, formula: fhFormula, type: 'Untyped', source: out.name || 'Defense' });
            }
            return;
          }
          const dKind = String(b.defType || b.kind || 'dr').toLowerCase().trim();
          const dFormula = b.formula || null;
          const dVal = dFormula
            ? Math.floor(Number(this.evaluateFormula(dFormula, curCtx)) || 0)
            : (Number(b.val ?? b.value ?? 0) || 0);
          const defWhen = b.when ? { when: b.when } : {};
          if (dKind === 'dr') {
            const bypass = b.bypass || b.drType || '-';
            defenses.push({ kind: 'dr', target: 'physical', value: dVal, formula: dFormula, bypass, ...defWhen });
            pushModifier({ op: 'add', target: 'dr', value: dVal, formula: dFormula, type: 'Untyped', bypass, source: out.name || 'Defense', ...defWhen });
          } else if (dKind === 'sr') {
            defenses.push({ kind: 'sr', target: 'magic', value: dVal, formula: dFormula });
            pushModifier({ op: 'add', target: 'sr', value: dVal, formula: dFormula, type: 'Untyped', source: out.name || 'Defense' });
          } else if (dKind === 'resist' || dKind === 'resistance') {
            const elem = String(b.element || b.target || 'fire').toLowerCase();
            defenses.push({ kind: 'resistance', target: elem, value: dVal, formula: dFormula });
            pushModifier({ op: 'add', target: `resist.${elem}`, value: dVal, formula: dFormula, type: 'Untyped', source: out.name || 'Defense' });
          } else if (dKind === 'immune' || dKind === 'immunity') {
            const immTarget = String(b.immuneTo || b.element || b.target || 'effect').toLowerCase();
            defenses.push({ kind: 'immunity', target: immTarget, value: 1 });
            addBadge(`Immune: ${b.immuneTo || b.element || b.target || 'Effect'}`);
          } else if (dKind === 'vulnerable' || dKind === 'vulnerability') {
            const vulTarget = String(b.element || b.target || 'fire').toLowerCase();
            defenses.push({ kind: 'vulnerability', target: vulTarget, value: 1 });
          } else if (dKind === 'fasthealing' || dKind === 'fast_healing') {
            defenses.push({ kind: 'fast_healing', target: 'hp', value: dVal, formula: dFormula });
            pushModifier({ op: 'add', target: 'fastHealing', value: dVal, formula: dFormula, type: 'Untyped', source: out.name || 'Defense' });
          } else if (dKind === 'regen' || dKind === 'regeneration') {
            defenses.push({ kind: 'regen', target: 'hp', value: dVal, formula: dFormula, bypass: b.bypass || '-' });
          } else if (dKind === 'fortification') {
            defenses.push({ kind: 'fortification', target: 'crit', value: dVal || 25 });
            addBadge(`Fortification ${dVal || 25}%`);
          } else if (dKind === 'absorption' || dKind === 'absorb') {
            const absTarget = String(b.element || b.target || 'acid').toLowerCase();
            defenses.push({ kind: 'absorption', target: absTarget, value: dVal, ratio: b.ratio !== undefined ? Number(b.ratio) : 0.5, ...defWhen });
          } else if (dKind === 'concealment') {
            addBadge(`Concealment ${dVal || 20}%`);
          }
          return;
        }

        // 7. Effect Block (`effect`: sense, movement, condition, summon, grant, bonusSlot, rule switch flag, or text/carrier)
        if (bType === 'effect') {
          if (b.text || b.label) addBadge(String(b.text || b.label).trim());
          if (b.flag) {
            const flagKey = String(b.flag).trim();
            if (flagKey === 'babEqualsLevel') ruleFlags.babEqualsLevel = true;
            else if (flagKey === 'shieldToTouchAc') ruleFlags.shieldToTouchAc = true;
            else if (flagKey === 'conToWillSave') ruleFlags.conToWillSave = true;
            else if (flagKey === 'weaponFinesse') ruleFlags.weaponFinesse = true;
            else if (flagKey === 'shadowBlade') ruleFlags.shadowBlade = true;
            else if (flagKey === 'monkeyGrip') ruleFlags.monkeyGrip = true;
            else if (flagKey === 'twoWeaponDefense') ruleFlags.twoWeaponDefense = true;
            else if (flagKey === 'tacticalSlider') ruleFlags.tacticalSlider = b.slider || true;
            else if (flagKey === 'naturalSpell') ruleFlags.naturalSpell = true;
            else if (flagKey === 'noAutoFailFortSaveOnNat1') ruleFlags.noAutoFailFortSaveOnNat1 = true;
            else if (flagKey === 'uncannyDodge') ruleFlags.uncannyDodge = true;
            else if (flagKey === 'ignoreArmorSpeedPenalty') ruleFlags.ignoreArmorSpeedPenalty = true;
            else if (flagKey === 'oneHandedOffHandAsLight') ruleFlags.oneHandedOffHandAsLight = true;
            else ruleFlags[flagKey] = b.slider !== undefined ? b.slider : true;
            if (flagKey === 'energyChoice' || ruleFlags.energyChoice) {
              const rawChosenElem = String(out.chosenEnergy || this.extractEntryChoice(out) || '').trim().toLowerCase();
              if (['acid', 'cold', 'electricity', 'fire', 'sonic'].includes(rawChosenElem)) {
                const effClNow = Number(curCtx.cl || out.casterLevel || 1) || 1;
                if (ruleFlags.energyResistanceFormula || /resist\s+energy/i.test(String(out.name || ''))) {
                  const resAmt = effClNow >= 11 ? 30 : (effClNow >= 7 ? 20 : 10);
                  defenses.push({ kind: 'resistance', target: rawChosenElem, value: resAmt });
                  pushModifier({ op: 'add', target: `resist.${rawChosenElem}`, value: resAmt, type: 'Untyped', source: out.name || 'Resist Energy' });
                }
                if (ruleFlags.energyImmunity) {
                  defenses.push({ kind: 'immunity', target: rawChosenElem, value: 1 });
                }
              }
            }
          }
          if (b.carrier && typeof b.carrier === 'object') {
            const c = b.carrier;
            const cSave = c.saveType || c.save || '';
            const cDc = c.dc ? (Number(this.evaluateFormula(c.dc, curCtx)) || c.dc) : '';
            const cEff = c.effect || c.riderEffect || c.condition || 'Rider Effect';
            addBadge(`Carrier: ${cSave ? `${cSave}${cDc ? ` DC ${cDc}` : ''} — ` : ''}${cEff}`);
          }
          const rawEffKind = b.effectKind || b.effType || (b.kind && String(b.kind).toLowerCase() !== 'effect' ? b.kind : null);
          if (!rawEffKind && (b.text || b.label || b.flag || b.carrier)) return;
          const effKind = String(rawEffKind || 'sense').toLowerCase().trim();
          const effVal = Number(b.val ?? b.value ?? b.range ?? 0) || 0;
          if (effKind === 'bonusslot' || effKind === 'bonus_slot') {
            const slotLvl = Number(b.slotLevel ?? 1) || 1;
            const isDoubler = b.count === 'double';
            const slotAdd = isDoubler ? (Number(curCtx.baseSlots) || 0) : (Number(b.count) || 1);
            pushModifier({
              op: 'add',
              target: `spellSlot.level${slotLvl}`,
              value: slotAdd,
              formula: isDoubler ? '@baseSlots' : null,
              type: 'Untyped',
              source: out.name || 'Bonus Spell Slot'
            });
            return;
          }
          if (effKind === 'sense') {
            const senseName = b.sense || b.target || 'Darkvision';
            grants.push({ grantType: 'sense', targetId: senseName, value: effVal || 60 });
            addBadge(`${senseName}${effVal ? ` ${effVal} ft.` : ''}`);
          } else if (effKind === 'movement') {
            const moveMode = String(b.moveMode || b.mode || b.target || 'fly').toLowerCase();
            const speedTarget = `speed.${moveMode}`;
            grants.push({ grantType: 'movement', targetId: moveMode, value: effVal || 30 });
            if (effVal > 0) {
              pushModifier({
                op: 'add',
                target: speedTarget,
                value: effVal,
                type: 'Untyped',
                source: out.name || 'Movement'
              });
            }
            if (b.maneuverability) addBadge(`Fly ${effVal || 30} ft. (${b.maneuverability})`);
          } else if (effKind === 'condition') {
            const condName = b.condition || b.target || '';
            if (condName) addBadge(`Condition: ${condName}`);
          } else if (effKind === 'grant' || effKind === 'proficiency' || effKind === 'feat') {
            grants.push({
              grantType: b.grantType || (effKind === 'proficiency' ? 'proficiency' : 'entity'),
              targetId: b.targetId || b.grant || b.feat || b.proficiency || b.value,
              ...(b.value !== undefined ? { value: b.value } : {}),
              ...(b.filter ? { filter: b.filter } : {}),
              ...(b.params ? { params: b.params } : {})
            });
          } else if (effKind === 'summon') {
            addBadge(`Summon: ${b.creature || b.target || 'Companion'}`);
          }
          return;
        }

        // 8. Resource Block (`resource`)
        if (bType === 'resource') {
          let maxFormula = b.maxFormula;
          if (maxFormula === undefined || maxFormula === null || maxFormula === '') {
            const baseMax = Number(b.max ?? b.val ?? b.value ?? 1) || 0;
            const abKey = String(b.ability || 'cha').toLowerCase().trim();
            const abTok = ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(abKey) ? `@${abKey}Mod` : '@chaMod';
            if (b.scaling === 'level') maxFormula = '@level';
            else if (b.scaling === 'halfLevel') maxFormula = 'floor(@level / 2)';
            else if (b.scaling === 'plusMod') maxFormula = baseMax ? `${baseMax} + ${abTok}` : abTok;
            else if (b.scaling === 'halfLvlPlusMod') maxFormula = `${baseMax ? baseMax + ' + ' : ''}floor(@level / 2) + ${abTok}`;
            else if (b.scaling === 'twoPerLvlPlusMod') maxFormula = `${baseMax} + (@level * 2) + ${abTok}`;
            else maxFormula = baseMax || 1;
          }
          const evaluatedMax = Math.max(0, Math.floor(Number(this.evaluateFormula(maxFormula, curCtx)) || 0));
          const resetRaw = String(b.per || b.reset || 'day').toLowerCase();
          const period = resetRaw === 'perday' || resetRaw === 'day' ? 'day'
            : (resetRaw === 'perencounter' || resetRaw === 'encounter' ? 'encounter'
              : (resetRaw === 'atwill' || resetRaw === 'at_will' ? 'at_will'
                : (resetRaw === 'cooldown' || resetRaw === 'rounds' ? 'rounds' : 'day')));
          resources.push({
            id: b.id || `${out.id || 'v3'}_res_${resources.length + 1}`,
            name: b.name || b.label || out.name || 'Resource',
            kind: b.resMode === 'invest' ? 'allocate' : (b.kind || 'consume'),
            maxFormula,
            max: evaluatedMax,
            unit: b.unit || (/charge/i.test(String(b.name || '')) ? 'charges' : (/round/i.test(String(b.name || '')) ? 'rounds' : 'uses')),
            recharge: b.recharge || { period, dice: b.rechargeDice || b.cooldownText || null }
          });
        }
      });
    };

    // Walk top-level V3 `blocks` or `effects` (skip if already materialized by ItemAssembler `_assembled`)
    const topBlocks = Array.isArray(out.blocks) && out.blocks.length > 0
      ? out.blocks
      : (Array.isArray(out.effects) ? out.effects : []);
    if (topBlocks.length > 0 && !(out._assembled && seedModifiers.length > 0)) {
      walkBlocks(topBlocks, { ctx: localCtx });
    }

    // Structural Bridge 1: Evaluate `modes[]` via `char.activeModes?.[entry.id]`
    if (Array.isArray(out.modes) && out.modes.length > 0) {
      const modeMap = (ctx && ctx.activeModes) || ch.activeModes || {};
      const entryId = out.id || out.baseEntryId || out.baseItemId;
      const rawSelector = ctx?.activeModeIdx !== undefined
        ? ctx.activeModeIdx
        : (ctx?.activeMode !== undefined
          ? ctx.activeMode
          : (entryId && modeMap[entryId] !== undefined
            ? modeMap[entryId]
            : (out.activeModeIdx !== undefined ? out.activeModeIdx : out.activeModeId)));

      let activeMode = null;
      let activeModeIdx = null;
      if (rawSelector !== undefined && rawSelector !== null && rawSelector !== '') {
        const asIdx = Number(rawSelector);
        if (Number.isInteger(asIdx) && asIdx >= 0 && asIdx < out.modes.length) {
          activeMode = out.modes[asIdx];
          activeModeIdx = asIdx;
        } else {
          const selStr = String(rawSelector).trim().toLowerCase();
          const foundIdx = out.modes.findIndex(m => m && (
            String(m.id || '').toLowerCase() === selStr ||
            String(m.name || '').toLowerCase() === selStr ||
            String(m.label || '').toLowerCase() === selStr
          ));
          if (foundIdx !== -1) {
            activeMode = out.modes[foundIdx];
            activeModeIdx = foundIdx;
          }
        }
      }

      if (activeMode) {
        out.activeMode = activeMode;
        out.activeModeIdx = activeModeIdx;
        out.activeModeId = activeMode.id || activeMode.name || activeMode.label || String(activeModeIdx);
        const modeBlocks = Array.isArray(activeMode.blocks) && activeMode.blocks.length > 0
          ? activeMode.blocks
          : (Array.isArray(activeMode.effects) ? activeMode.effects : []);
        if (modeBlocks.length > 0) {
          walkBlocks(modeBlocks, { ctx: localCtx, sourceLabel: activeMode.name || activeMode.label || 'Active Mode' });
        }
        if (Array.isArray(activeMode.modifiers)) {
          activeMode.modifiers.forEach(m => pushModifier(Object.assign({ op: 'add', type: 'Untyped', condition: null }, m)));
        }
        if (Array.isArray(activeMode.damageParts)) {
          activeMode.damageParts.forEach(dp => damageParts.push(Object.assign({}, dp)));
        }
      }
    }

    // Structural Bridge 2: Incarnum `chakraBinds[boundChakra]` evaluation
    if (boundChakra && out.chakraBinds && typeof out.chakraBinds === 'object') {
      const bindKey = Object.keys(out.chakraBinds).find(k => k.toLowerCase() === String(boundChakra).trim().toLowerCase());
      const bindEntry = bindKey ? out.chakraBinds[bindKey] : null;
      if (bindEntry) {
        if (Array.isArray(bindEntry)) {
          walkBlocks(bindEntry, { ctx: localCtx, sourceLabel: `Chakra Bind (${bindKey})` });
        } else if (typeof bindEntry === 'object') {
          const bindBlocks = Array.isArray(bindEntry.blocks) ? bindEntry.blocks : (Array.isArray(bindEntry.effects) ? bindEntry.effects : []);
          if (bindBlocks.length > 0) {
            walkBlocks(bindBlocks, { ctx: localCtx, sourceLabel: `Chakra Bind (${bindKey})` });
          }
          if (Array.isArray(bindEntry.modifiers)) {
            bindEntry.modifiers.forEach(m => pushModifier(Object.assign({ op: 'add', type: 'Untyped', condition: null }, m)));
          }
          const sumTxt = bindEntry.summary || bindEntry.description || bindEntry.benefit;
          if (sumTxt) {
            out.activeBindSummary = String(sumTxt);
            addBadge(`Chakra Bind (${bindKey}): ${sumTxt}`);
          }
        } else if (typeof bindEntry === 'string') {
          out.activeBindSummary = bindEntry;
          addBadge(`Chakra Bind (${bindKey}): ${bindEntry}`);
        }
      }
    }

    // Structural Bridge 3: Psionics `augment` scaling blocks (capped at ML)
    if (effectiveAugmentPP > 0 && out.augment && typeof out.augment === 'object') {
      const costPerStep = Math.max(1, Number(out.augment.costPerStep || out.augment.ppPerStep || 1));
      const augmentSteps = Math.floor(effectiveAugmentPP / costPerStep);
      if (augmentSteps > 0 && Array.isArray(out.augment.blocks)) {
        const augCtx = Object.assign({}, localCtx, {
          augmentPP: effectiveAugmentPP,
          augmentSteps
        });
        walkBlocks(out.augment.blocks, { ctx: augCtx, sourceLabel: `Augmented (+${effectiveAugmentPP} PP)` });
      }
    }

    out.modifiers = modifiers;
    out.damageParts = damageParts;
    out.defenses = defenses;
    out.resources = resources;
    out.grants = grants;
    out.ruleFlags = ruleFlags;
    out.tacticalBadges = tacticalBadges;
    Object.defineProperties(out, {
      _v3Evaluated: { value: true, enumerable: false, configurable: true, writable: true },
      _seedModifiers: { value: seedModifiers, enumerable: false, configurable: true, writable: true },
      _seedDamageParts: { value: seedDamageParts, enumerable: false, configurable: true, writable: true },
      _seedDefenses: { value: seedDefenses, enumerable: false, configurable: true, writable: true },
      _seedResources: { value: seedResources, enumerable: false, configurable: true, writable: true },
      _seedGrants: { value: seedGrants, enumerable: false, configurable: true, writable: true }
    });
    return out;
  },

  // Ensure an object is upgraded to Canonical V2/V2.5/V3 via resolveCustomEntryOverride, evaluateV3Entry, SchemaMigrator & normalizeLegoEntry
  ensureV2Entry(entry, ctx = null) {
    if (!entry || typeof entry !== 'object') return entry;
    let working = entry;
    if (!working._customOverrideApplied) {
      const customOv = this.resolveCustomEntryOverride(working);
      if (customOv && customOv !== working) {
        const instChoice = this.extractEntryChoice(working) || this.extractEntryChoice(customOv);
        working = Object.assign({}, working, customOv, {
          _customOverrideApplied: true,
          ...(instChoice ? { choice: instChoice } : {}),
          active: working.active !== undefined ? working.active : customOv.active,
          equipped: working.equipped !== undefined ? working.equipped : customOv.equipped,
          isEquipped: working.isEquipped !== undefined ? working.isEquipped : customOv.isEquipped,
          slot: working.slot || customOv.slot,
          grip: working.grip || customOv.grip
        });
      }
    }
    const isV3 = working.schemaVersion === 3
      || (Array.isArray(working.blocks) && working.blocks.length > 0)
      || (Array.isArray(working.effects) && working.effects.length > 0)
      || Boolean(working.weapon || working.armor || working.chassis || working.race || working.monster)
      || (Array.isArray(working.modes) && working.modes.some(m => m && (Array.isArray(m.blocks) || Array.isArray(m.effects))))
      || Boolean(working.boundChakra && working.chakraBinds);
    if (isV3) {
      working = this.evaluateV3Entry(working, ctx || {});
    } else if (working.ruleFlags && (!Array.isArray(working.tacticalBadges) || working.tacticalBadges.length === 0)) {
      const rfBadges = this.formatRuleFlagBadges(working.ruleFlags, working);
      if (rfBadges.length > 0) {
        working = Object.assign({}, working, { tacticalBadges: rfBadges });
      }
    }
    if (!isV3) {
      const migrator = (typeof window !== 'undefined' && window.SchemaMigrator)
        || (typeof SchemaMigrator !== 'undefined' ? SchemaMigrator : null);
      if (migrator && typeof migrator.migrateEntryToV3 === 'function') {
        const migrated = migrator.migrateEntryToV3(working);
        return this.evaluateV3Entry(migrated, ctx || {});
      }
      return this.normalizeLegoEntry(working);
    }
    return working;
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

  // Upgrade any V2/V3 entry into full V2.5 Composable Lego Entry (migrates legacy ruleFlags defenses & recharge into structured blocks)
  normalizeLegoEntry(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    let src = entry;
    if (
      !src._v3Evaluated &&
      (src.schemaVersion === 3 ||
        (Array.isArray(src.blocks) && src.blocks.length > 0) ||
        (Array.isArray(src.effects) && src.effects.length > 0) ||
        Boolean(src.weapon || src.armor || src.chassis || src.race || src.monster))
    ) {
      src = this.evaluateV3Entry(src);
    }
    const out = Object.assign({}, src);
    if (src._v3Evaluated) {
      Object.defineProperties(out, {
        _v3Evaluated: { value: true, enumerable: false, configurable: true, writable: true },
        _seedModifiers: { value: src._seedModifiers || [], enumerable: false, configurable: true, writable: true },
        _seedDamageParts: { value: src._seedDamageParts || [], enumerable: false, configurable: true, writable: true },
        _seedDefenses: { value: src._seedDefenses || [], enumerable: false, configurable: true, writable: true },
        _seedResources: { value: src._seedResources || [], enumerable: false, configurable: true, writable: true },
        _seedGrants: { value: src._seedGrants || [], enumerable: false, configurable: true, writable: true }
      });
    }
    if (out.schemaVersion !== 3) out.schemaVersion = 2;
    out.modifiers = Array.isArray(out.modifiers) ? out.modifiers.map(m => Object.assign({ op: 'add', type: 'Untyped', condition: null }, m)) : [];
    out.damageParts = Array.isArray(out.damageParts) ? out.damageParts : [];
    out.modes = Array.isArray(out.modes) ? out.modes : [];
    out.defenses = Array.isArray(out.defenses) ? out.defenses.slice() : [];
    out.resources = Array.isArray(out.resources) ? out.resources.slice() : [];
    out.grants = Array.isArray(out.grants) ? out.grants.slice() : [];
    out.choices = Array.isArray(out.choices) ? out.choices.slice() : [];
    if (!Array.isArray(out.tacticalBadges)) {
      out.tacticalBadges = this.formatRuleFlagBadges(out.ruleFlags, out);
    }

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
    const seenBaseAbilityNames = new Set();
    const seenItemIds = new Set();
    const seenBodySlotNames = new Set();

    const normBaseAbilityName = (s) => String(s || '')
      .toLowerCase()
      .replace(/\s*\((?:ex|su|sp|na)\)\s*/gi, ' ')
      .replace(/\s*\+\d+(?:d\d+)?.*$/i, '')
      .replace(/\s+\d+\/\w+.*$/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const addEntry = (raw, fallbackCategory = 'Feature', legoSource = 'legoEntries') => {
      if (!raw) return;
      let obj = raw;
      if (typeof raw === 'string') {
        const rawBase = normBaseAbilityName(raw);
        if (rawBase) seenBaseAbilityNames.add(rawBase);
        if (typeof this.getMasterDbEntry === 'function') {
          obj = this.getMasterDbEntry(raw, fallbackCategory);
        }
        if (!obj || typeof obj !== 'object') return;
      } else if (typeof raw === 'object') {
        const rawBase = normBaseAbilityName(raw.name || '');
        if (rawBase) seenBaseAbilityNames.add(rawBase);
        const dbMatch = (typeof this.getMasterDbEntry === 'function')
          ? (this.getMasterDbEntry(raw, fallbackCategory) || this.getMasterDbEntry(raw.id || raw.name, fallbackCategory))
          : null;
        if (dbMatch && typeof dbMatch === 'object') {
          const merged = Object.assign({}, dbMatch, raw);
          const hasDynamicV3State = Boolean(
            raw.essentia !== undefined ||
            raw.invested !== undefined ||
            raw.boundChakra ||
            raw.chakraBind ||
            raw.augmentPP !== undefined ||
            (Array.isArray(raw.blocks) && raw.blocks.length > 0) ||
            (Array.isArray(raw.effects) && raw.effects.length > 0)
          );
          if (hasDynamicV3State) {
            merged._v3Evaluated = false;
            if (!Array.isArray(raw.modifiers) || raw.modifiers.length === 0) {
              merged.modifiers = [];
            }
          } else {
            ['modifiers', 'defenses', 'resources', 'modes', 'grants', 'choices', 'damageParts'].forEach(k => {
              if ((!Array.isArray(raw[k]) || raw[k].length === 0) && Array.isArray(dbMatch[k]) && dbMatch[k].length > 0) {
                merged[k] = dbMatch[k];
              }
            });
          }
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
      const baseAbilityKey = normBaseAbilityName(norm.name || '');
      if (fullId && seenFullIds.has(fullId)) return;
      if (!fullId.includes(':') && nameLower && seenNames.has(nameLower) && !norm.overrides) return;
      if (fullId) seenFullIds.add(fullId);
      if (nameLower) seenNames.add(nameLower);
      if (baseAbilityKey) seenBaseAbilityNames.add(baseAbilityKey);
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

    // Auto-collect active V3 Class Abilities (`cab-*`) from active classes up to active class level
    const activeClasses = {};
    if (Array.isArray(ch.levelProgression) && ch.levelProgression.length > 0) {
      ch.levelProgression.forEach(row => {
        if (!row || row.active === false) return;
        const cName = String(row.className || row.class || '').trim();
        if (cName) activeClasses[cName] = (activeClasses[cName] || 0) + 1;
      });
    } else if (!ch.isNpc) {
      if (Array.isArray(ch.classLevels) && ch.classLevels.length > 0) {
        ch.classLevels.forEach(cl => {
          if (!cl || cl.active === false) return;
          const cName = String(cl.className || cl.name || '').trim();
          const cLvl = Math.max(0, Number(cl.level) || 0);
          if (cName && cLvl > 0) activeClasses[cName] = (activeClasses[cName] || 0) + cLvl;
        });
      } else if (ch.classes && typeof ch.classes === 'string') {
        String(ch.classes).split('/').forEach(part => {
          const m = part.trim().match(/^(.+?)\s+(\d+)$/);
          if (m) {
            const cName = m[1].trim();
            const cLvl = Math.max(0, parseInt(m[2], 10) || 0);
            if (cName && cLvl > 0) activeClasses[cName] = (activeClasses[cName] || 0) + cLvl;
          }
        });
      }
    }

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    Object.entries(activeClasses).forEach(([clsName, clsLvl]) => {
      if (!clsName || clsLvl <= 0 || typeof this.getClassDef !== 'function') return;
      const clsDef = this.getClassDef(clsName, ch);
      if (!clsDef || !clsDef.features || typeof clsDef.features !== 'object') return;
      const replacedSet = new Set();
      if (Array.isArray(clsDef.replaces)) {
        clsDef.replaces.forEach(r => {
          const rStr = String(r || '').trim().toLowerCase();
          if (rStr) {
            replacedSet.add(rStr);
            replacedSet.add(normBaseAbilityName(rStr));
          }
        });
      }
      for (let lvl = 1; lvl <= clsLvl; lvl++) {
        const lvlFeats = clsDef.features[lvl] || clsDef.features[String(lvl)] || [];
        if (!Array.isArray(lvlFeats)) continue;
        lvlFeats.forEach(featRef => {
          if (!featRef) return;
          const fId = typeof featRef === 'object' ? String(featRef.id || '').trim() : '';
          const fName = typeof featRef === 'object' ? String(featRef.name || '').trim() : String(featRef || '').trim();
          if (!fId && !fName) return;
          const fIdLow = fId.toLowerCase();
          const fNameLow = fName.toLowerCase();
          const fBase = normBaseAbilityName(fName);
          if ((fIdLow && replacedSet.has(fIdLow)) || (fNameLow && replacedSet.has(fNameLow)) || (fBase && replacedSet.has(fBase))) return;
          if ((fIdLow && seenFullIds.has(fIdLow)) || (fNameLow && seenNames.has(fNameLow)) || (fBase && seenBaseAbilityNames.has(fBase))) return;

          let resolvedCab = null;
          if (fId && comp && typeof comp.getById === 'function') {
            resolvedCab = comp.getById(fId);
          }
          if (!resolvedCab && fName && comp && typeof comp.getByName === 'function') {
            resolvedCab = comp.getByName(fName, 'ClassAbility')
              || comp.getByName(fName.replace(/\s*\((?:ex|su|sp|na)\)\s*$/i, '').trim(), 'ClassAbility');
          }
          if (!resolvedCab && typeof this.getMasterDbEntry === 'function') {
            resolvedCab = (fId && this.getMasterDbEntry(fId, 'ClassAbility'))
              || (fName && this.getMasterDbEntry(fName, 'ClassAbility'));
          }
          if (!resolvedCab && typeof featRef === 'object' && Array.isArray(featRef.effects) && featRef.effects.length > 0) {
            resolvedCab = featRef;
          }
          if (!resolvedCab || typeof resolvedCab !== 'object') return;
          const resIdLow = String(resolvedCab.id || fId || '').trim().toLowerCase();
          const resBase = normBaseAbilityName(resolvedCab.name || fName);
          const isV3Cab = resIdLow.startsWith('cab-')
            || String(resolvedCab.type || '').toLowerCase() === 'classability'
            || (Array.isArray(resolvedCab.effects) && resolvedCab.effects.length > 0);
          if (!isV3Cab) return;
          if ((resIdLow && replacedSet.has(resIdLow)) || (resBase && replacedSet.has(resBase))) return;
          if ((resIdLow && seenFullIds.has(resIdLow)) || (resBase && seenBaseAbilityNames.has(resBase))) return;

          addEntry(Object.assign({}, resolvedCab, { sourceClass: clsDef.name || clsName }), 'ClassAbility', 'classFeatures');
        });
      }
    });

    // Race / template Level / HD Table features: a row's referenced entries (refId, e.g. cab-*) apply once the
    // character's level / total HD reaches that row. Inline (text-only) features stay descriptive.
    if (typeof this.getRaceTemplateProgressionSources === 'function') {
      const hdNow = Number(this.buildFormulaContext(ch).level) || 1;
      this.getRaceTemplateProgressionSources(ch).forEach(src => {
        const pr = src && src.progression;
        const rows = pr && (Array.isArray(pr.milestones) ? pr.milestones : (Array.isArray(pr.levels) ? pr.levels : null));
        if (!rows) return;
        rows.forEach((row, idx) => {
          if (!row || !Array.isArray(row.features)) return;
          const rowLevel = Number(row.level) || (idx + 1);
          if (rowLevel > hdNow) return;
          row.features.forEach(f => {
            const refId = f && typeof f === 'object' ? String(f.refId || '').trim() : '';
            if (!refId || seenFullIds.has(refId.toLowerCase())) return;
            const resolved = (comp && typeof comp.getById === 'function' && comp.getById(refId))
              || (typeof this.getMasterDbEntry === 'function' && this.getMasterDbEntry(refId));
            if (!resolved || typeof resolved !== 'object' || !Array.isArray(resolved.effects) || resolved.effects.length === 0) return;
            addEntry(Object.assign({}, resolved, { sourceRace: src.name || '' }), 'ClassAbility', 'classFeatures');
          });
        });
      });
    }

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

    // Collect active 5-subsystem entries (shaped Soulmelds, bound Vestiges, active Powers/Mysteries/Utterances)
    const soulmeldList = Array.isArray(ch.incarnum?.soulmelds) ? ch.incarnum.soulmelds : (Array.isArray(ch.soulmelds) ? ch.soulmelds : []);
    soulmeldList.forEach(sm => {
      if (!sm || (typeof sm === 'object' && (sm.active === false || sm.shaped === false))) return;
      addEntry(sm, 'Soulmeld', 'soulmelds');
    });
    const vestigeList = Array.isArray(ch.pactMagic?.vestiges) ? ch.pactMagic.vestiges : (Array.isArray(ch.pact?.vestiges) ? ch.pact.vestiges : (Array.isArray(ch.vestiges) ? ch.vestiges : []));
    vestigeList.forEach(v => {
      if (!v || (typeof v === 'object' && (v.active === false || v.bound === false))) return;
      addEntry(v, 'Vestige', 'vestiges');
    });
    const powerList = Array.isArray(ch.psionics?.powers) ? ch.psionics.powers : (Array.isArray(ch.powers) ? ch.powers : []);
    powerList.forEach(p => {
      if (p && typeof p === 'object' && p.active === true) addEntry(p, 'Power', 'powers');
    });
    const mysteryList = Array.isArray(ch.shadowMagic?.mysteries) ? ch.shadowMagic.mysteries : (Array.isArray(ch.shadow?.mysteries) ? ch.shadow.mysteries : (Array.isArray(ch.mysteries) ? ch.mysteries : []));
    mysteryList.forEach(m => {
      if (m && typeof m === 'object' && m.active === true) addEntry(m, 'Mystery', 'mysteries');
    });
    const utteranceList = Array.isArray(ch.truenaming?.utterances) ? ch.truenaming.utterances : (Array.isArray(ch.utterances) ? ch.utterances : []);
    utteranceList.forEach(u => {
      if (u && typeof u === 'object' && u.active === true) addEntry(u, 'Utterance', 'utterances');
    });

    return collected;
  },

  // Single Unified V2.5 Composable Lego Evaluation Pipeline
  // Stages: 1. Grants/Synergies -> 2. Selector Modifiers -> 3. Stat/Sub-Component Modifiers -> 4. Defenses -> 5. Resources -> 6. Modes
  evaluateLegoCharacter(character, candidatePool = [], options = {}) {
    const ch = character || {};
    this._activeCharacter = ch;
    this._activeCustomEntries = (ch.customEntries && typeof ch.customEntries === 'object') ? ch.customEntries : null;
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
          grantedCapabilities.spellsAtWill.push({ source: e.id, targetId: g.targetId, filter: g.filter || null, sourceLabel: g.sourceLabel || null });
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
    const getInvested = (e) => {
      if (!e) return 0;
      const rawInv = e.essentia !== undefined ? e.essentia : e.invested;
      return (rawInv !== undefined && rawInv !== null && rawInv !== '' && !Number.isNaN(Number(rawInv))) ? Number(rawInv) : 0;
    };

    // Collect all active modifiers (from top-level and passive modes)
    const allModifiers = [];
    workingEntries.forEach(e => {
      const invVal = getInvested(e);
      const selfCtx = Object.assign({}, ctx, {
        essentia: invVal,
        self: { stacks: getStacks(e), invested: invVal }
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
        replacements[t].push({
          op,
          value: Math.floor(v),
          source: sourceEntry.name,
          sourceId: sourceEntry.id || null,
          affects: mod.affects || null,
          scope: mod.scope || 'all',
          fromStat: mod.fromStat || null,
          toStat: mod.toStat || null,
          condition: mod.condition || null,
          entryChoice: this.extractEntryChoice(sourceEntry) || null
        });
        return;
      }
      if ((/\.abilitymod$/i.test(t) || t === 'bab') && op === 'add') {
        replacements[t] = replacements[t] || [];
        replacements[t].push({
          op: 'add',
          value: Math.floor(v),
          source: sourceEntry.name,
          sourceId: sourceEntry.id || null,
          affects: mod.affects || null,
          scope: mod.scope || 'all',
          fromStat: mod.fromStat || null,
          toStat: mod.toStat || null,
          condition: mod.condition || null,
          entryChoice: this.extractEntryChoice(sourceEntry) || null
        });
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
      const cands = (replacements[slotKey] || []).filter(c => !c.scope || c.scope === 'all' || c.scope === 'not_flat_footed' || c.scope === 'light_or_no_armor');
      const addSum = cands.filter(c => c.op === 'add').reduce((acc, c) => acc + c.value, 0);
      const nonAdd = cands.filter(c => c.op !== 'add');
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
    const miscAcBonus = sumBucket('ac') + sumBucket('ac.all');
    const touchOnlyBonus = sumBucket('ac.touch');
    const flatFootedOnlyBonus = sumBucket('ac.flatFooted');

    let normalAc = 10 + acAbiMod + armorBonus + shieldBonus + natArmorBonus + deflectBonus + dodgeBonus + miscAcBonus;
    let touchAc = 10 + acAbiMod + deflectBonus + dodgeBonus + miscAcBonus + touchOnlyBonus;
    let flatFootedAc = 10 + Math.min(0, acAbiMod) + armorBonus + shieldBonus + natArmorBonus + deflectBonus + miscAcBonus + flatFootedOnlyBonus;

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
      replacements,
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

  // Activate a reactive/immediate Lego mode and apply its HP/TempHP/Buff effects onto character
  activateLegoMode(character, entryId, modeId, inputValues = {}) {
    if (!character) return null;
    const res = this.triggerLegoMode(character, entryId, modeId, inputValues);
    if (!res) return null;
    if (res.tempHpGained > 0 && character.hp) {
      character.hp.temp = Math.max(Number(character.hp.temp) || 0, res.tempHpGained);
    }
    if (res.healedHp > 0 && character.hp) {
      character.hp.current = Math.min(Number(character.hp.max) || 999, (Number(character.hp.current) || 0) + res.healedHp);
    }
    if (res.spawnedBuff) {
      if (!Array.isArray(character.buffs)) character.buffs = [];
      const existing = character.buffs.find(b => b && b.id === res.spawnedBuff.id);
      if (existing) {
        existing.active = true;
        existing.durationRounds = res.spawnedBuff.durationRounds;
        existing.durationText = `${res.spawnedBuff.durationRounds} ${res.spawnedBuff.durationRounds === 1 ? 'round' : 'rounds'}`;
      } else {
        character.buffs.push(Object.assign({}, res.spawnedBuff, {
          active: true,
          durationText: `${res.spawnedBuff.durationRounds} ${res.spawnedBuff.durationRounds === 1 ? 'round' : 'rounds'}`
        }));
      }
    }
    return res;
  },

  // Tick per-round cooldowns & Lego recharge resources when advancing combat round
  tickRoundResources(character) {
    const ch = character || {};
    const notes = [];
    const rechargedAbilities = [];
    const remainingAbilities = [];
    const curR = Number(ch.tactical?.round || ch.encounterRound) || 1;

    if (ch.specialAttackCooldowns && typeof ch.specialAttackCooldowns === 'object') {
      Object.keys(ch.specialAttackCooldowns).forEach(k => {
        const rem = Math.max(0, (Number(ch.specialAttackCooldowns[k]) || 0) - 1);
        if (rem <= 0) {
          delete ch.specialAttackCooldowns[k];
        } else {
          ch.specialAttackCooldowns[k] = rem;
        }
      });
    }

    if (ch.tactical && ch.tactical.abilityCooldowns && typeof ch.tactical.abilityCooldowns === 'object') {
      Object.keys(ch.tactical.abilityCooldowns).forEach(k => {
        const entry = ch.tactical.abilityCooldowns[k];
        const readyR = (entry && typeof entry === 'object') ? Number(entry.readyRound || 0) : Number(entry || 0);
        const abName = (entry && typeof entry === 'object' && entry.name) ? entry.name : k.replace(/_/g, ' ');
        if (readyR <= curR) {
          delete ch.tactical.abilityCooldowns[k];
          if (ch.specialAttackCooldowns) delete ch.specialAttackCooldowns[k];
          notes.push(`🔥 ${abName} Recharged & READY!`);
          rechargedAbilities.push(k);
        } else {
          const rem = readyR - curR;
          if (entry && typeof entry === 'object') {
            entry.waitRounds = rem;
          }
          if (ch.specialAttackCooldowns) {
            ch.specialAttackCooldowns[k] = rem;
          }
          notes.push(`⏳ ${abName}: ${rem} ${rem === 1 ? 'round' : 'rounds'} left`);
          remainingAbilities.push({ key: k, remaining: rem });
        }
      });
    }

    const tickResourceList = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(entry => {
        if (!entry || !Array.isArray(entry.resources)) return;
        entry.resources.forEach(r => {
          if (!r) return;
          if (typeof r.cooldownRemaining === 'number' && r.cooldownRemaining > 0) {
            r.cooldownRemaining = Math.max(0, r.cooldownRemaining - 1);
          }
        });
      });
    };
    tickResourceList(ch.legoEntries);
    tickResourceList(ch.specialAbilities);

    return { notes, rechargedAbilities, remainingAbilities };
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
      'Clone and combine the provided Pure Canonical V3 Lego templates (`schemaVersion: 3`) and adapt only the domain parameters to match the user request. Output complete V3 entries that validate against `rule_master_ai_schema.json` (`RuleMasterEntryV3`).',
      'Mechanics live only in `effects[]` blocks (`stat`, `roll`, `attack`, `defense`, `effect`, `resource`, `when`, `table`, `carrier`), `choices[]` (@Choice inputs) and `powers[]` (activated abilities with `action`, `usage`, `save`, `effects[]`). Never emit legacy `modifiers`, `damageParts`, `defenses`, `resources` or `modes` arrays.',
      '`stat` blocks use plural `targets: string[]` with canonical keys (e.g. `ac.deflection`, `atk.all`, `save.will`) plus `btype` and `mode` (`flat`, `stat`, `perCL`, `formula`, `replaceStat`); ability swaps use `mode: "replaceStat"` with `swapTarget`, `subOp`, `fromStat`, `toStat`, `scope`. Toggled or situational benefits go inside `when` branches (`flow: "while"`, `condText: "toggle:<key>"`, `"stance:<name>"` or `"@level >= N"`).',
      'For multi-benefit Homebrew, write each benefit as its own `effects[]` or `powers[]` element and describe it in `label`/`text`; all benefits stay active simultaneously.',
      `Matched Structural Lego Templates:\n${templatesJson}`,
      `User Rule / Ability Request:\n${userQuery}`
    ].join('\n\n');
  },

  // Feat-list rows that are not feats: UA character traits (UA p.86) and Complete Scoundrel skill tricks
  // (CSc p.83). They never consume a feat slot.
  isTraitOrSkillTrickRef(fStr) {
    const s = String(fStr || '');
    return s.includes('[Trait]') || s.includes('[Skill Trick]');
  },

  // Skill tricks learned on active levels; each costs 2 skill points (Complete Scoundrel p.83).
  countSkillTricks(w) {
    const rows = Array.isArray(w?.levelProgression) ? w.levelProgression : [];
    return rows.reduce((n, row) => (row && row.active !== false && Array.isArray(row.feats))
      ? n + row.feats.filter(f => String(f || '').includes('[Skill Trick]')).length
      : n, 0);
  },

  // Declarative Compendium & Master DB lookup helper (O(1) ID/BaseItemId priority + Copy-on-Write char.customEntries priority)
  getMasterDbEntry(itemOrName, typeFilter = null) {
    if (!itemOrName) return null;
    const isObj = typeof itemOrName === 'object';
    const refId = isObj ? (itemOrName.baseEntryId || itemOrName.baseItemId || itemOrName.id || null) : null;
    const rawName = String(isObj ? (itemOrName.masterDbName || itemOrName.name || '') : itemOrName).trim();
    const effType = typeFilter ? String(typeFilter).toLowerCase() : null;
    const strictType = Boolean(effType && (effType === 'race' || effType === 'domain' || effType === 'template' || effType === 'class'));

    // 0. Check Copy-on-Write per-character customEntries FIRST
    const customOv = this.resolveCustomEntryOverride(itemOrName);
    if (customOv) {
      if (!strictType || !customOv.type || String(customOv.type).toLowerCase() === effType) {
        return this.ensureV2Entry(customOv);
      }
    }

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const applyFoundWithCustomOverride = (entryObj) => {
      if (!entryObj) return null;
      const customByFound = this.resolveCustomEntryOverride(entryObj);
      if (customByFound && customByFound !== entryObj) {
        return this.ensureV2Entry(Object.assign({}, entryObj, customByFound));
      }
      return this.ensureV2Entry(entryObj);
    };
    const strippedAbilityName = rawName.replace(/\s*\((?:ex|su|sp|na)\)\s*$/i, '').trim();
    const parenMatch = rawName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const canStripChoiceParen = Boolean(
      parenMatch &&
      effType !== 'class' &&
      !/\b(variant|adventurer|thug|cloistered|acf|urban|martial|wildshape)\b/i.test(parenMatch[2])
    );
    const strippedChoiceName = canStripChoiceParen ? parenMatch[1].trim() : '';

    if (comp) {
      if (refId) {
        const byId = comp.getById(refId);
        if (byId) return applyFoundWithCustomOverride(byId);
      }
      if (rawName) {
        const byName = comp.getByName(rawName, typeFilter || (isObj ? itemOrName.type : null))
          || (strippedAbilityName && strippedAbilityName !== rawName ? comp.getByName(strippedAbilityName, typeFilter || (isObj ? itemOrName.type : null)) : null)
          || (strippedChoiceName && strippedChoiceName !== rawName ? comp.getByName(strippedChoiceName, typeFilter || (isObj ? itemOrName.type : null)) : null);
        if (byName) return applyFoundWithCustomOverride(byName);
      }
    }

    const clean = rawName.toLowerCase();
    if (!clean && !refId) return null;
    const db = (Array.isArray(this._activeCustomDb) && this._activeCustomDb.length > 0 ? this._activeCustomDb : null)
      || (typeof window !== 'undefined' && window.masterDb)
      || (typeof masterDb !== 'undefined' ? masterDb : []);
    let found = Array.isArray(db) && db.length > 0
      ? db.find(m => {
          if (!m) return false;
          if (refId && m.id === refId) return true;
          if (strictType && String(m.type || '').toLowerCase() !== effType) return false;
          if (!clean) return false;
          if (m.name && m.name.toLowerCase().trim() === clean) return true;
          if (m.masterDbName && m.masterDbName.toLowerCase().trim() === clean) return true;
          if (Array.isArray(m.aliases) && m.aliases.some(a => String(a || '').toLowerCase().trim() === clean)) return true;
          return false;
        })
      : null;

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
    if (!found && comp && typeof comp.findIndexEntry === 'function' && typeof comp.ensureChunkLoaded === 'function') {
      const idxHit = (refId && comp.findIndexEntry(refId)) || (rawName && comp.findIndexEntry(rawName, typeFilter || (isObj ? itemOrName.type : null)));
      const lazySplatFiles = [
        'srd_feats_splat.json',
        'srd_powers_splat.json',
        'srd_soulmelds_splat.json',
        'srd_vestiges_splat.json',
        'srd_mysteries_splat.json',
        'srd_utterances_splat.json',
        'srd_classes_splat.json'
      ];
      if (idxHit && lazySplatFiles.includes(idxHit.f)) {
        comp.ensureChunkLoaded(idxHit.f);
        found = (refId && comp.getById(refId)) || (rawName && comp.getByName(rawName, typeFilter || (isObj ? itemOrName.type : null))) || null;
      }
    }
    return found ? applyFoundWithCustomOverride(found) : null;
  },

  // Check if weapon is the secondary / off-hand head of a Double Weapon or explicit Off-Hand weapon
  isOffHandWeaponHead(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;
    if (name.includes('off-hand') || name.includes('offhand')) return true;
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
    if (!name || name === '-' || name === 'none') return false;
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

    let offDice = offMode?.weapon?.damageDice || offMode?.damageDice || baseObj.weapon?.damageDice || baseObj.dice || db.weapon?.damageDice || db.dice || '1d8';
    let offDmgType = offMode?.weapon?.dmgType || offMode?.dmgType || baseObj.weapon?.dmgType || baseObj.dmgType || db.weapon?.dmgType || db.dmgType || 'Bludgeoning';
    let offCritMin = Number(offMode?.weapon?.baseCritRange || offMode?.critRange || baseObj.weapon?.baseCritRange || baseObj.critMin || baseObj.critRange || db.weapon?.baseCritRange || db.critMin || db.critRange) || 20;
    let offCritMult = Number(offMode?.weapon?.critMultiplier || offMode?.critMult || baseObj.weapon?.critMultiplier || baseObj.critMult || db.weapon?.critMultiplier || db.critMult) || 2;

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

    const enh = Number(baseObj.enhancementBonus ?? baseObj.weapon?.enhancementBonus ?? db.enhancementBonus ?? db.weapon?.enhancementBonus) || 0;
    const offEffects = Array.isArray(offMode?.effects) ? JSON.parse(JSON.stringify(offMode.effects)) : [];
    if (enh > 0) {
      offEffects.push({ type: 'stat', targets: ['attack.weapon'], mode: 'flat', value: enh, btype: 'Enhancement', source: 'Weapon Enhancement' });
      offEffects.push({ type: 'stat', targets: ['damage.weapon'], mode: 'flat', value: enh, btype: 'Enhancement', source: 'Weapon Enhancement' });
    }
    return {
      schemaVersion: 3,
      type: 'Weapon',
      name: `${rawName} (Off-Hand)`,
      parent: rawName,
      grip: 'Off-Hand',
      dice: offDice,
      critRange: offCritMin,
      critMin: offCritMin,
      critMult: offCritMult,
      enhancementBonus: enh,
      dmgType: offDmgType,
      isLight: true,
      isDoubleOffHandVirtual: true,
      weapon: {
        category: baseObj.weapon?.category || db.weapon?.category || 'Exotic',
        handedness: 'light',
        damageDice: offDice,
        dmgType: offDmgType,
        baseCritRange: offCritMin,
        critMultiplier: offCritMult,
        enhancementBonus: enh
      },
      effects: offEffects,
      ruleFlags: { isLight: true, doubleWeaponOffHand: true },
      tags: ['off-hand', 'double', 'light']
    };
  },

  // Check if weapon is Light according to D&D 3.5e RAW rules
  isLightWeapon(weapon) {
    if (!weapon) return false;
    if (this.isOffHandWeaponHead(weapon)) return true;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;

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
      'kama', 'nunchaku', 'sai', 'siangham', 'unarmed strike'
    ];
    return standardLightWeapons.some(lw => name.includes(lw));
  },

  // Check if weapon is Exotic according to D&D 3.5e RAW rules
  isExoticWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;

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
    if (!name || name === '-' || name === 'none') return false;

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
    if (!name || name === '-' || name === 'none') return false;

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
      'shortbow', 'composite shortbow', 'heavy crossbow', 'light crossbow'
    ];

    if (twoHandedWeapons.some(w => name.includes(w))) {
      return true;
    }

    // Spear is two-handed in 3.5e; shortspear is one-handed
    if (name.includes('spear') && !name.includes('shortspear')) {
      return true;
    }

    const slot = (typeof weapon === 'object' ? (weapon.slot || '') : '').toLowerCase();
    const tags = (typeof weapon === 'object' && Array.isArray(weapon.tags)) ? weapon.tags.map(t => String(t).toLowerCase()) : [];
    const desc = (typeof weapon === 'object' ? (weapon.desc || weapon.benefit || weapon.description || '') : '').toLowerCase();

    if (typeof weapon === 'object') {
      if (weapon.isTwoHanded || weapon.twoHanded || weapon.category === 'Two-Handed') return true;
    }
    if (tags.some(t => t.includes('two-hand') || t.includes('2-hand') || t.includes('two handed'))) return true;
    if (slot.includes('two-hand') || slot.includes('2-hand') || slot.includes('two handed')) return true;
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
    if (!name || name === '-' || name === 'none') return false;

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
      'lance', 'ranseur', 'scythe', 'shortbow', 'composite shortbow', 'longbow', 'composite longbow'
    ];
    return standardMartialWeapons.some(mw => baseWepName.includes(mw) || name.includes(mw));
  },

  // Check if weapon is Simple according to D&D 3.5e RAW rules
  isSimpleWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;

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
      'gauntlet', 'spiked gauntlet', 'unarmed strike', 'dagger', 'punching dagger', 'light mace', 'sickle',
      'club', 'heavy mace', 'morningstar', 'shortspear', 'longspear', 'quarterstaff', 'spear',
      'crossbow', 'heavy crossbow', 'light crossbow', 'dart', 'javelin', 'sling'
    ];
    return standardSimpleWeapons.some(sw => baseWepName.includes(sw) || name.includes(sw));
  },

  // Check if weapon is a Thrown weapon according to D&D 3.5e RAW rules
  isThrownWeapon(weapon) {
    if (!weapon) return false;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;
    if (name.includes('crossbow') || (name.includes('bow') && !name.includes('club'))) return false;
    if (typeof weapon === 'object') {
      if (weapon.isThrown || weapon.thrown || weapon.ruleFlags?.thrown) return true;
      if (Array.isArray(weapon.tags) && weapon.tags.some(t => String(t).toLowerCase() === 'thrown')) return true;
      if (String(weapon.weaponType || weapon.subtype || '').toLowerCase().includes('thrown')) return true;
    }
    const db = this.getMasterDbEntry(weapon);
    if (db) {
      if (db.isThrown || db.thrown || db.ruleFlags?.thrown) return true;
      if (Array.isArray(db.tags) && db.tags.some(t => String(t).toLowerCase() === 'thrown')) return true;
    }
    const baseWepName = name.replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const standardThrownWeapons = [
      'dagger', 'club', 'shortspear', 'spear', 'javelin', 'dart', 'sling',
      'throwing axe', 'light hammer', 'trident', 'bolas', 'net', 'shuriken', 'chakram', 'harpoon'
    ];
    return standardThrownWeapons.some(tw => baseWepName.includes(tw) || name.includes(tw));
  },

  // Evaluate deterministic weapon/character scope filter for V3 `mode: 'replaceStat'` swaps
  matchesSwapScope(scope, weapon, ctx = {}) {
    const sc = String(scope || 'all').toLowerCase().trim();
    if (!sc || sc === 'all') return true;
    const ch = ctx.character || {};
    if (sc === 'not_flat_footed') return !ch.acBreakdown?.loseDexToAC;
    if (sc === 'light_or_no_armor') {
      const armCat = ch.effectiveArmorCategory || ch.acBreakdown?.armorCategory || 'None';
      return armCat !== 'Medium' && armCat !== 'Heavy';
    }
    if (!weapon) return sc !== 'mind_affecting';
    if (sc === 'finessable') return !ctx.isRangedWep && this.isFinessable(weapon);
    if (sc === 'simple_or_natural') {
      const wName = String(weapon.name || '').toLowerCase();
      const isNat = Boolean(weapon.isNatural || weapon.isNaturalWeapon || weapon.ruleFlags?.naturalWeapon || String(weapon.category || '').toLowerCase() === 'natural' || wName.includes('unarmed'));
      return isNat || this.isSimpleWeapon(weapon);
    }
    if (sc === 'thrown') return this.isThrownWeapon(weapon);
    if (sc === 'bow_or_crossbow') return Boolean(ctx.isBow || ctx.isCrossbow);
    if (sc === 'discipline_weapons') return Boolean(ctx.isShadowStance && this.isShadowHandWeapon(weapon));
    if (sc === 'chosen_weapon') {
      const chRaw = String(ctx.entryChoice || '').toLowerCase().trim();
      if (!chRaw) return false;
      const wLow = String(weapon.name || '').toLowerCase();
      const bLow = String(weapon.baseItemId || '').toLowerCase().replace(/^wpn[-_]/, '').replace(/[-_]/g, ' ');
      return wLow.includes(chRaw) || chRaw.includes(wLow) || (bLow && (bLow.includes(chRaw) || chRaw.includes(bLow)));
    }
    return true;
  },

  // Resolve a V3 `replacements[slotKey]` list against a baseline value
  resolveSwapSlot(replacementsMap, slotKey, defaultVal, defaultLabel = '', scopeCtx = {}) {
    const rawList = (replacementsMap && Array.isArray(replacementsMap[slotKey])) ? replacementsMap[slotKey] : [];
    const cands = rawList.filter(c => c && this.matchesSwapScope(c.scope, scopeCtx.weapon || null, Object.assign({}, scopeCtx, { entryChoice: c.entryChoice })));
    if (cands.length === 0) return { value: defaultVal, label: defaultLabel, addItems: [], changed: false, winningToStat: null };
    const addCands = cands.filter(c => c.op === 'add');
    const nonAdd = cands.filter(c => c.op !== 'add');
    let baseVal = defaultVal;
    let label = defaultLabel;
    let winningToStat = null;
    let changed = false;
    if (nonAdd.length > 0) {
      const forced = nonAdd.filter(c => c.op === 'replace' || c.op === 'set');
      if (forced.length > 0) {
        const best = forced.reduce((a, b) => (b.value >= a.value ? b : a), forced[0]);
        baseVal = best.value;
        winningToStat = best.toStat || null;
        const stUp = best.toStat && /^[a-z]{3}$/i.test(best.toStat) ? best.toStat.toUpperCase() : null;
        label = stUp ? `${stUp} (${best.source})` : `${best.source}`;
        changed = true;
      } else {
        const best = nonAdd.reduce((a, b) => (b.value >= a.value ? b : a), nonAdd[0]);
        if (best.value > defaultVal) {
          baseVal = best.value;
          winningToStat = best.toStat || null;
          const stUp = best.toStat && /^[a-z]{3}$/i.test(best.toStat) ? best.toStat.toUpperCase() : null;
          label = stUp ? `${stUp} (${best.source})` : `${best.source}`;
          changed = true;
        }
      }
    }
    const addItems = addCands.filter(c => c.value !== 0).map(c => {
      const stUp = c.toStat && /^[a-z]{3}$/i.test(c.toStat) ? c.toStat.toUpperCase() : null;
      return { val: c.value, source: stUp ? `${c.source} (${stUp})` : c.source, toStat: c.toStat || null };
    });
    return { value: baseVal, label, addItems, changed: changed || addItems.length > 0, winningToStat };
  },

  // Canonical Armor / Shield chassis (PHB p.123 Table 7-6, DMG p.216 Magic Armor): the one place that derives an
  // item's base Armor or Shield bonus plus its enhancement bonus. The item's top-level `enhancementBonus` is canonical
  // (Rule Crafter and the SRD gear assembler write it); `armor.enhancementBonus` mirrors the same value and is only a
  // fallback, never additive. Returns null for items that are neither armor nor a shield.
  resolveArmorChassis(item, dbEntry = null) {
    if (!item || typeof item !== 'object') return null;
    const firstNum = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v);
      }
      return null;
    };
    const db = dbEntry && typeof dbEntry === 'object' ? dbEntry : null;
    const a = item.armor && typeof item.armor === 'object' ? item.armor : {};
    const da = db && db.armor && typeof db.armor === 'object' ? db.armor : {};
    const aType = String(a.armorType || da.armorType || '').toLowerCase();
    const typeOf = (o) => String((o && (o.type || '')) || '').toLowerCase();
    const catOf = (o) => String((o && (o.category || '')) || '').toLowerCase();
    const isShield = typeOf(item) === 'shield' || catOf(item) === 'shield' || a.kind === 'shield'
      || aType === 'shield' || aType.includes('buckler') || typeOf(db) === 'shield' || catOf(db) === 'shield';
    const isArmor = !isShield && (typeOf(item) === 'armor' || catOf(item) === 'armor' || typeOf(db) === 'armor'
      || ['light', 'medium', 'heavy'].includes(aType) || Object.keys(a).length > 0);
    if (!isShield && !isArmor) return null;
    const base = firstNum(
      a.armorBonus, a.acBonus, item.armorBonus, item.shieldBonus, item.armorStats?.baseAc, item.acBonus,
      da.armorBonus, da.acBonus, db?.armorBonus, db?.shieldBonus, db?.armorStats?.baseAc, db?.acBonus
    ) || 0;
    const enh = Math.max(0, firstNum(item.enhancementBonus, a.enhancementBonus, db?.enhancementBonus, da.enhancementBonus) || 0);
    const total = base > 0 ? base + enh : 0;
    const kind = isShield ? 'shield' : 'armor';
    const name = String(item.name || db?.name || (isShield ? 'Shield' : 'Armor'));
    const label = enh > 0 ? `${name} (+${base} base, +${enh} Enhancement)` : name;
    return {
      kind,
      base,
      enh,
      total,
      target: isShield ? 'ac.shield' : 'ac.armor',
      bonusType: isShield ? 'Shield' : 'Armor',
      label
    };
  },

  // PHB p.125 / Table 7-5 shield bash weapon, built once for both the attack chain and the combat card.
  // Medium damage: light shield 1d3, heavy shield 1d4; with Shield Spikes 1d4 / 1d6 piercing; 20/x2; scaled one die
  // step per size category away from Medium (DMG p.28). A tower shield cannot bash (PHB p.125).
  // Enhancement contract (`item.bash = { mode, enhancementBonus }`):
  //   'linked' (default)  -> bash attack and damage use the shield's own enhancement bonus;
  //   'independent' (RAW) -> bash uses item.bash.enhancementBonus (the shield's AC enhancement does not apply).
  // Returns null when the item is not a shield or cannot bash (canShieldBash === false, tower shield).
  buildShieldBashWeapon(item, character = null) {
    if (!item || typeof item !== 'object' || !this.isShieldItem(item)) return null;
    if (this.isTowerShield(item)) return null;
    const customOv = this.resolveCustomEntryOverride(item, character);
    const refEntry = (customOv && customOv !== item) ? customOv : this.getMasterDbEntry(item, 'Shield');
    if (item.canShieldBash === false || (refEntry && refEntry.canShieldBash === false)) return null;

    const nameLower = String(item.name || '').toLowerCase();
    // Authored bash chassis (Rule Crafter / item) vs. the SRD entry's synthesized weapon view (Medium table values).
    const authoredW = (customOv && customOv !== item && customOv.weapon) || item.weapon || null;
    const wObj = authoredW || (refEntry && refEntry.weapon) || null;
    const chassis = this.resolveArmorChassis(item, refEntry) || { base: 0, enh: 0, total: 0 };
    const isBuckler = nameLower.includes('buckler') || String(item.armor?.armorType || '').toLowerCase().includes('buckler');
    const handed = wObj ? String(wObj.handedness || wObj.handed || '').toLowerCase() : '';
    const isHeavy = /light/.test(handed) ? false
      : (/heavy/.test(handed) ? true
        : (nameLower.includes('heavy') || (!nameLower.includes('light') && !isBuckler && chassis.base >= 2)));
    const enhList = Array.isArray(item.enhancements) ? item.enhancements : [];
    const isSpiked = Boolean(
      item.spiked || item.shieldSpikes || item.ruleFlags?.shieldSpikes || refEntry?.ruleFlags?.shieldSpikes ||
      /\bspiked\b/.test(nameLower) ||
      enhList.some(e => /shield.?spikes/i.test(String((e && (e.id || e.name)) || e || '')))
    );

    const mediumDice = isSpiked ? (isHeavy ? '1d6' : '1d4') : (isHeavy ? '1d4' : '1d3');
    // An authored bash die (Rule Crafter weapon chassis) wins; a hydrated copy of the Medium table value does not,
    // so the size scaling below still applies to it.
    const authoredRaw = (authoredW && (authoredW.damageDice || authoredW.dice)) || item.dice || null;
    const authoredDice = authoredRaw && String(authoredRaw).trim().toLowerCase() !== mediumDice ? authoredRaw : null;
    let dice;
    if (authoredDice) {
      dice = String(authoredDice);
    } else {
      const SIZE_STEPS = { fine: -4, diminutive: -3, tiny: -2, small: -1, medium: 0, large: 1, huge: 2, gargantuan: 3, colossal: 4 };
      const sizeKey = character ? this.getSizeCategoryKey(character) : null;
      const steps = sizeKey ? (SIZE_STEPS[sizeKey] || 0) : 0;
      dice = steps !== 0 ? this.stepDamageDice(mediumDice, steps) : mediumDice;
    }
    const critMin = Number(wObj && (wObj.effectiveCritRange || wObj.baseCritRange || wObj.critRange)) || 20;
    const critMult = Number(wObj && (wObj.critMultiplier || wObj.critMult)) || 2;
    const dmgType = (wObj && (wObj.dmgType || wObj.damageType)) || (isSpiked ? 'Piercing' : 'Bludgeoning');
    const rangeIncrement = Number(wObj && wObj.rangeIncrement) || 0;

    const bashCfg = (item.bash && typeof item.bash === 'object') ? item.bash : {};
    const mode = bashCfg.mode === 'independent' ? 'independent' : 'linked';
    const enhancementBonus = mode === 'independent'
      ? Math.max(0, Number(bashCfg.enhancementBonus) || 0)
      : Math.max(0, Number(chassis.enh) || 0);

    // Copy identity fields only: the shield's AC modifiers, V3 effects, armor chassis and armor masterwork
    // (which lowers armor check penalty, PHB p.126) must not leak into the bash attack.
    return {
      id: item.id ? `${item.id}::shield-bash` : undefined,
      inventoryId: item.inventoryId,
      name: `${item.name} (Shield Bash)`,
      type: item.type || 'Shield',
      category: item.category || 'Shield',
      material: item.material,
      proficiency: 'Martial',
      handedness: isHeavy ? 'One-Handed' : 'Light',
      grip: 'Off-Hand',
      dice,
      damageParts: [{ dice, bonus: 0, type: dmgType, multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }],
      critMin,
      critRange: critMin,
      critMult,
      dmgType,
      rangeIncrement: rangeIncrement > 0 ? rangeIncrement : null,
      enhancementBonus,
      isMasterwork: mode === 'independent' && Boolean(bashCfg.masterwork),
      bashMode: mode,
      shieldEnhancement: Number(chassis.enh) || 0,
      shieldAcTotal: Number(chassis.total) || 0,
      isShieldBash: true,
      isSpiked,
      isLight: !isHeavy,
      isBuckler,
      modifiers: [],
      effects: [],
      tags: ['off-hand', 'shield-bash']
    };
  },

  // Check if item is a Shield according to D&D 3.5e RAW rules
  isShieldItem(item) {
    if (!item) return false;
    const name = (typeof item === 'string' ? item : (item.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return false;
    if (typeof item === 'object') {
      if (item.shield || item.armor?.kind === 'shield' || item.category === 'Shield' || item.type === 'Shield' || (item.slot && item.slot.toLowerCase().includes('shield'))) return true;
    }
    const srdShields = (this.getActiveRuleset() && this.getActiveRuleset().srdShields) || {};
    return Object.keys(srdShields).some(k => name.includes(k)) || name.includes('shield') || name.includes('buckler');
  },

  // Two-Weapon Defense wield test (PHB p.102): a double weapon in the main hand, or a manufactured weapon in each hand.
  // Natural weapons, unarmed strikes and shields do not count. Reads the equipped mainHand / offHand body slots;
  // `offHandSuppressed` is true when a two-handed main-hand weapon leaves the off-hand item unusable.
  isWieldingTwoWeaponsOrDouble(character, offHandSuppressed = false) {
    const slots = (character && character.bodySlots) || {};
    const isManufacturedWeapon = (it) => {
      if (!it || typeof it !== 'object' || it.active === false || !it.name || it.name === '-') return false;
      if (this.isShieldItem(it)) return false;
      const name = String(it.name).toLowerCase();
      if (name.includes('unarmed strike')) return false;
      if (it.isNaturalWeapon || it.ruleFlags?.naturalWeapon || String(it.category || '').toLowerCase() === 'natural') return false;
      return this.isDoubleWeapon(it) || this.isOffHandWeaponHead(it) || this.isSimpleWeapon(it) || this.isMartialWeapon(it) || this.isExoticWeapon(it);
    };
    const mh = slots.mainHand;
    if (isManufacturedWeapon(mh) && this.isDoubleWeapon(mh)) return true;
    return !offHandSuppressed && isManufacturedWeapon(mh) && isManufacturedWeapon(slots.offHand);
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

    // In Level-up Wizard mode, if lvlup-class-select exists in mounted DOM, add it too
    if (typeof document !== 'undefined' && (typeof window === 'undefined' || window._modalsMounted !== false)) {
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

    // Apply class proficiencies (Union across all multiclasses per RAW, reading active ruleset plugin)
    const rsProfs = (this.getActiveRuleset(character) && this.getActiveRuleset(character).classProficiencies) || {};
    classNames.forEach(cName => {
      const profData = rsProfs[cName] || rsProfs[cName.split(' ')[0]];
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
        const def = this.getClassDef(cName, character) || (typeof DND35_CLASS_DEFS !== 'undefined' ? DND35_CLASS_DEFS[cName] : null) || {};
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

      if (clean.includes('armor proficiency (light)')) {
        res.armors.light = true;
      }
      if (clean.includes('armor proficiency (medium)')) {
        res.armors.medium = true;
      }
      if (clean.includes('armor proficiency (heavy)')) {
        res.armors.heavy = true;
      }
      if (clean.includes('tower shield proficiency')) {
        res.shields.tower = true;
      }
      if (clean.includes('shield proficiency')) {
        res.shields.shield = true;
      }
      if (clean.includes('simple weapon proficiency')) {
        res.weapons.simple = true;
      }
      if (clean.includes('martial weapon proficiency')) {
        const match = clean.match(/martial weapon proficiency\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        } else if (clean.includes('all')) {
          res.weapons.martial = true;
        } else {
          res.weapons.martial = true;
        }
      }
      if (clean.includes('exotic weapon proficiency')) {
        const match = clean.match(/exotic weapon proficiency\s*\((.*?)\)/i);
        if (match && match[1]) {
          res.weapons.specific.add(match[1].trim().toLowerCase());
        }
      }
      if (clean.includes('weapon aptitude')) {
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
    // Touch spells and rays need no weapon proficiency (PHB p.141).
    if (typeof weapon === 'object' && weapon.isSpellAttack) return true;
    const name = (typeof weapon === 'string' ? weapon : (weapon.name || '')).toLowerCase().trim();
    if (!name || name === '-' || name === 'none') return true;

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
      if (isHandAndAHalf && (gripStr.includes('2-hand') || gripStr.includes('two-hand'))) {
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
    if (!name || name === '-' || name === 'none') return true;

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
      const srdArmors = (this.getActiveRuleset(character) && this.getActiveRuleset(character).srdArmors) || {};
      for (const [key, val] of Object.entries(srdArmors)) {
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
    if (!name || name === '-' || name === 'none') return true;

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
      f.includes('jotunbrud')
    );
  },

  // Resolve bonus stacking according to active ruleset (D&D 3.5e RAW default)
  resolveBonusStacking(bonusList, character = null) {
    const activeRuleset = this.getActiveRuleset(character || this._activeCharacter);
    const rulesetStacking = Array.isArray(activeRuleset?.stackingBonusTypes)
      ? activeRuleset.stackingBonusTypes.map(t => String(t).toLowerCase())
      : ['dodge', 'circumstance', 'racial', 'untyped', 'synergy'];
    const stackingTypes = rulesetStacking.includes('template') ? rulesetStacking : [...rulesetStacking, 'template'];
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

  // Same stacking rule as resolveBonusStacking, per item: returns copies tagged `applied: true|false`.
  // A typed bonus that is lower than (or equal to and after) another bonus of the same type does not stack
  // (e.g. Masterwork +1 vs +2 weapon enhancement vs Greater Magic Weapon). The applied items sum to resolveBonusStacking.
  tagAppliedBonuses(bonusList, character = null) {
    const activeRuleset = this.getActiveRuleset(character || this._activeCharacter);
    const rulesetStacking = Array.isArray(activeRuleset?.stackingBonusTypes)
      ? activeRuleset.stackingBonusTypes.map(t => String(t).toLowerCase())
      : ['dodge', 'circumstance', 'racial', 'untyped', 'synergy'];
    const stackingTypes = rulesetStacking.includes('template') ? rulesetStacking : [...rulesetStacking, 'template'];
    const bestIdx = {};
    const list = Array.isArray(bonusList) ? bonusList : [];
    list.forEach((item, idx) => {
      const type = (item.type || 'untyped').toLowerCase();
      const val = Number(item.val) || 0;
      if (val < 0 || stackingTypes.includes(type)) return;
      if (bestIdx[type] === undefined || val > (Number(list[bestIdx[type]].val) || 0)) bestIdx[type] = idx;
    });
    return list.map((item, idx) => {
      const type = (item.type || 'untyped').toLowerCase();
      const val = Number(item.val) || 0;
      const applied = val < 0 || stackingTypes.includes(type) || bestIdx[type] === idx;
      return { ...item, applied };
    });
  },

  // Parse modifiers and stat bonuses from a Canonical V2 equipment item (zero heuristic regex guessing per Rule #10.3)
  // True when an item carries the given V3 Rule Switch flag through its own ruleFlags or one of its enhancements
  // (e.g. `ghostTouchArmor` from the Ghost Touch, Armor enhancement). Enhancements are ids or { id } objects.
  itemHasEnhancementFlag(item, flag) {
    if (!item || typeof item !== 'object' || !flag) return false;
    if (item.ruleFlags && item.ruleFlags[flag]) return true;
    const list = Array.isArray(item.enhancements) ? item.enhancements : [];
    return list.some(e => {
      const entry = this.getMasterDbEntry((e && typeof e === 'object') ? (e.id || e.name) : e);
      return Boolean(entry && Array.isArray(entry.effects) && entry.effects.some(b => b && b.flag === flag));
    });
  },

  // PHB p.296 (incorporeal subtype): an incorporeal touch attack ignores armor, natural armor and shield bonuses
  // unless they are force effects (Mage Armor, Shield, Bracers of Armor, Ring of Force Shield) or the armor / shield
  // has the Ghost Touch property (DMG p.224). Spells are matched by their Force descriptor in the compendium.
  isForceAcSource(sourceName) {
    const clean = String(sourceName || '').replace(/^[^A-Za-z0-9]+/, '').trim();
    if (!clean) return false;
    if (/\b(bracers of armor|ring of force shield)\b/i.test(clean)) return true;
    const spell = this.getMasterDbEntry(clean.replace(/\s*\((?:spell|buff)\)\s*$/i, ''), 'Spell');
    const desc = spell ? (Array.isArray(spell.descriptors) ? spell.descriptors.join(' ') : String(spell.descriptors || '')) : '';
    return /\bforce\b/i.test(desc);
  },

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
      miscAc: [],
      acPenalty: 0,
      conditionalAc: [],
      maxDex: item.maxDex !== undefined && item.maxDex !== null && item.maxDex !== ''
        ? Number(item.maxDex)
        : (item.armor?.maxDex !== undefined && item.armor?.maxDex !== null && item.armor?.maxDex !== ''
          ? Number(item.armor.maxDex)
          : (dbEntry?.maxDex !== undefined && dbEntry?.maxDex !== null && dbEntry?.maxDex !== ''
            ? Number(dbEntry.maxDex)
            : (dbEntry?.armor?.maxDex !== undefined && dbEntry?.armor?.maxDex !== null && dbEntry?.armor?.maxDex !== '' ? Number(dbEntry.armor.maxDex) : null))),
      acp: item.checkPenalty !== undefined && item.checkPenalty !== null && item.checkPenalty !== ''
        ? Number(item.checkPenalty)
        : (item.armor?.armorCheckPenalty !== undefined && item.armor?.armorCheckPenalty !== null && item.armor?.armorCheckPenalty !== ''
          ? Number(item.armor.armorCheckPenalty)
          : (dbEntry?.checkPenalty !== undefined && dbEntry?.checkPenalty !== null && dbEntry?.checkPenalty !== ''
            ? Number(dbEntry.checkPenalty)
            : (dbEntry?.armor?.armorCheckPenalty !== undefined && dbEntry?.armor?.armorCheckPenalty !== null && dbEntry?.armor?.armorCheckPenalty !== '' ? Number(dbEntry.armor.armorCheckPenalty) : 0))),
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
      // The chassis projection (resolveArmorChassis) is applied exactly once below.
      if (m.chassis) continue;
      const hasFormula = m.formula !== undefined && m.formula !== null && String(m.formula).trim() !== '';
      const val = this.evaluateFormula(hasFormula ? m.formula : m.value, evalCtx);
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

      // AC modifiers that are situational (`vs. Evil`), penalties (Bracers of Defenselessness) or of a type with no
      // dedicated column (luck / insight / sacred / profane / untyped) are reported separately so recalculateCharacter
      // can list, subtract or stack them by type instead of folding them into a base column.
      const tLower = target.toLowerCase();
      const acSubItem = tLower.startsWith('ac.') ? tLower.slice(3) : tLower;
      const isAcItemTarget = tLower === 'ac' || tLower.startsWith('ac.') || ['armor', 'shield', 'natural', 'deflection', 'dodge'].includes(tLower);
      const isAcSubComponent = acSubItem === 'abilitymod' || acSubItem === 'base' || (acSubItem === 'total' && String(m.op || 'add').toLowerCase() !== 'add');
      if (isAcItemTarget && !isAcSubComponent) {
        const condStr = (typeof m.condition === 'string' && m.condition.trim()) ? m.condition.trim() : null;
        if (condStr) {
          const label = acSubItem === 'deflection' || bType === 'deflection' ? 'Deflection'
            : (acSubItem === 'dodge' || bType === 'dodge' ? 'Dodge'
              : (acSubItem === 'natural' || bType.includes('natural') ? 'Natural'
                : (acSubItem === 'shield' || bType === 'shield' ? 'Shield'
                  : (acSubItem === 'armor' || bType === 'armor' ? 'Armor' : (bType.charAt(0).toUpperCase() + bType.slice(1))))));
          res.conditionalAc.push({ target: 'AC', val, type: label, condition: condStr, source: item.name });
          continue;
        }
        if (val < 0) {
          res.acPenalty += Math.abs(val);
          continue;
        }
        const isStandardColumn = ['armor', 'shield', 'natural', 'deflection'].includes(acSubItem)
          || ['armor', 'shield', 'deflection'].includes(bType)
          || bType.includes('natural')
          || bType === 'dodge'
          || (acSubItem === 'dodge' && (bType === 'untyped' || bType === 'haste'));
        if (!isStandardColumn) {
          res.miscAc.push({ val, source: item.name, type: bType.charAt(0).toUpperCase() + bType.slice(1) });
          continue;
        }
      }

      if (target === 'ac.armor' || target === 'armor') res.armor = Math.max(res.armor, val);
      else if (target === 'ac.shield' || target === 'shield') res.shield = Math.max(res.shield, val);
      else if (target === 'ac.natural' || target === 'natural' || ((target === 'ac.total' || target === 'ac') && bType.includes('natural'))) {
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

    // Armor / Shield chassis (base + enhancement) from the single canonical resolver. Armor bonuses (and Shield
    // bonuses) do not stack with each other (PHB p.171), so an explicit same-column modifier competes by max and
    // exactly one Armor- or Shield-typed modifier is emitted for the column.
    const chassis = this.resolveArmorChassis(item, dbEntry);
    if (chassis && chassis.total > 0) {
      res.armorChassis = chassis;
      const col = chassis.kind;
      const isColumnMod = (m) => m && (m.target === chassis.target || m.target === col) && (m.type === col || m.type === 'untyped');
      if (chassis.total >= res[col]) {
        res[col] = chassis.total;
        res[`${col}SourceLabel`] = chassis.label;
        res.modifiers = res.modifiers.filter(m => !isColumnMod(m));
        res.modifiers.push({ target: chassis.target, value: chassis.total, type: col, condition: null, source: chassis.label });
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

  // Pure Canonical V3 default buffs & conditions resolvers (sourced from SrdCompendium)
  _buildDefaultBuffFromCompendium(spec) {
    const srd = this.getMasterDbEntry(spec.srdId || spec.name, spec.lookupType || 'Spell');
    const effects = (srd && Array.isArray(srd.effects) && srd.effects.length > 0)
      ? JSON.parse(JSON.stringify(srd.effects))
      : JSON.parse(JSON.stringify(spec.fallbackEffects || []));
    const rf = Object.assign({}, (srd && srd.ruleFlags) || {}, spec.ruleFlags || {});
    const out = {
      id: spec.id,
      schemaVersion: 3,
      name: spec.name,
      type: spec.type || 'Buff',
      source: spec.source || 'Spell',
      category: spec.category || 'Combat',
      durationCategory: spec.durationCategory || 'short',
      active: Boolean(spec.active),
      rounds: spec.rounds !== undefined ? spec.rounds : 10,
      durationText: spec.durationText || (srd && srd.duration) || '1 min / CL',
      notes: spec.notes || (srd && (srd.shortDescription || srd.text)) || '',
      effects,
      modes: [],
      ruleFlags: rf
    };
    if (spec.isDebuff) out.isDebuff = true;
    if (spec.negativeLevels) out.negativeLevels = spec.negativeLevels;
    if (spec.dmgDice) out.dmgDice = spec.dmgDice;
    return out;
  },

  getDefaultBuffs() {
    const specs = [
      { id: 'buf-mage-armor', srdId: 'spl-mage-armor', name: 'Mage Armor', category: 'AC', durationCategory: 'hour', rounds: 50, durationText: '1 hr / CL (5 Hours)', notes: '+4 Armor bonus to AC (does not stack with worn armor; highest applies)', fallbackEffects: [{ type: 'stat', targets: ['ac.armor'], mode: 'flat', value: 4, btype: 'Armor' }] },
      { id: 'buf-shield', srdId: 'spl-shield', name: 'Shield (Spell)', category: 'AC', rounds: 10, durationText: '1 min / CL (5 Min)', notes: '+4 Shield bonus to AC; negates Magic Missile attacks', ruleFlags: { immuneMagicMissile: true }, fallbackEffects: [{ type: 'stat', targets: ['ac.shield'], mode: 'flat', value: 4, btype: 'Shield' }] },
      { id: 'buf-bulls-strength', srdId: 'spl-bulls-strength', name: "Bull's Strength", source: 'Spell / Potion', category: 'Stat', rounds: 10, durationText: '1 min / CL (5 Min)', notes: '+4 Enhancement bonus to STR (does not stack with Belt of Giant Strength)', fallbackEffects: [{ type: 'stat', targets: ['ability.str'], mode: 'flat', value: 4, btype: 'Enhancement' }] },
      { id: 'buf-cats-grace', srdId: 'spl-cats-grace', name: "Cat's Grace", source: 'Spell / Potion', category: 'Stat', rounds: 10, durationText: '1 min / CL (5 Min)', notes: '+4 Enhancement bonus to DEX (does not stack with Gloves of Dexterity)', fallbackEffects: [{ type: 'stat', targets: ['ability.dex'], mode: 'flat', value: 4, btype: 'Enhancement' }] },
      { id: 'buf-bears-endurance', srdId: 'spl-bears-endurance', name: "Bear's Endurance", source: 'Spell / Potion', category: 'Stat', rounds: 10, durationText: '1 min / CL', notes: '+4 Enhancement bonus to CON (+2 HP/level, +2 Fortitude save)', fallbackEffects: [{ type: 'stat', targets: ['ability.con'], mode: 'flat', value: 4, btype: 'Enhancement' }] },
      { id: 'buf-haste', srdId: 'spl-haste', name: 'Haste', category: 'Combat', rounds: 6, durationText: '1 rd / CL (6 Rounds)', notes: '+1 Attack, +1 Dodge AC, +1 Reflex, +30 ft Speed, +1 extra attack on Full Attack', ruleFlags: { hasted: true, extraAttackFullAttack: true }, fallbackEffects: [{ type: 'stat', targets: ['attack.all'], mode: 'flat', value: 1, btype: 'Untyped' }, { type: 'stat', targets: ['ac.dodge', 'save.ref'], mode: 'flat', value: 1, btype: 'Dodge' }, { type: 'stat', targets: ['speed.all'], mode: 'flat', value: 30, btype: 'Enhancement' }] },
      { id: 'buf-bless', srdId: 'spl-bless', name: 'Bless', category: 'Morale', rounds: 10, durationText: '1 min / CL', notes: '+1 Morale bonus on attack rolls and saving throws against fear', fallbackEffects: [{ type: 'stat', targets: ['attack.all'], mode: 'flat', value: 1, btype: 'Morale' }] },
      { id: 'buf-prayer-positive', srdId: 'spl-prayer', name: 'Prayer', category: 'Luck', rounds: 6, durationText: '1 rd / CL', notes: '+1 Luck bonus on attack rolls, weapon damage, saves, and skill checks', fallbackEffects: [{ type: 'stat', targets: ['attack.all', 'damage.weapon', 'save.all', 'skill.all'], mode: 'flat', value: 1, btype: 'Luck' }] },
      { id: 'buf-barkskin', srdId: 'spl-barkskin', name: 'Barkskin', category: 'AC', rounds: 50, durationText: '10 min / CL', notes: '+2 to +5 Enhancement bonus to Natural Armor (+1 per 3 CL above 3rd, max +5 at CL 12)', fallbackEffects: [{ type: 'stat', targets: ['ac.natural'], mode: 'formula', formula: '2 + min(3, max(0, floor((@cl - 3) / 3)))', btype: 'Natural Armor Enhancement' }] },
      { id: 'buf-shield-of-faith', srdId: 'spl-shield-of-faith', name: 'Shield of Faith', category: 'AC', rounds: 10, durationText: '1 min / CL', notes: '+2 to +5 Deflection bonus to AC (+1 per 6 CL, max +5 at CL 18)', fallbackEffects: [{ type: 'stat', targets: ['ac.deflection'], mode: 'formula', formula: '2 + min(3, floor(@cl / 6))', btype: 'Deflection' }] },
      { id: 'buf-divine-favor', srdId: 'spl-divine-favor', name: 'Divine Favor', category: 'Combat', rounds: 10, durationText: '1 min (10 Rounds)', notes: '+1 to +3 Luck bonus on attack and weapon damage rolls (+1 per 3 CL, min +1, max +3)', fallbackEffects: [{ type: 'stat', targets: ['attack.all', 'damage.weapon'], mode: 'formula', formula: 'min(3, max(1, floor(@cl / 3)))', btype: 'Luck' }] },
      { id: 'buf-punishing-stance', srdId: 'tob-stance-punishing-stance', lookupType: 'Stance', name: 'Punishing Stance', source: 'Stance', category: 'Stance', durationCategory: 'permanent', active: true, rounds: null, durationText: 'Continuous', dmgDice: '1d6', notes: '+1d6 melee weapon damage, -2 penalty to AC', fallbackEffects: [{ type: 'stat', targets: ['ac.total'], mode: 'flat', value: -2, btype: 'Penalty' }, { type: 'roll', kind: 'Damage', dice: '1d6', bonus: 0, dmgType: 'Physical', source: 'Punishing Stance' }] }
    ];
    return specs.map(s => this._buildDefaultBuffFromCompendium(s));
  },

  getDefaultDebuffs() {
    const specs = [
      { id: 'cnd-energy-drained', srdId: 'cnd-energy-drained', lookupType: 'Condition', name: 'Energy Drain (-4 Lvl)', type: 'Condition', source: 'Spell / Undead', category: 'Debuff', durationCategory: 'condition', isDebuff: true, rounds: null, durationText: 'Permanent (Requires Restoration)', negativeLevels: 4, notes: 'D&D 3.5e RAW: 4 Negative Levels! -4 Attack, -4 Saving Throws, -4 Skill/Ability Checks, -20 Max/Current HP, -4 Effective Caster Level.', ruleFlags: { actionRestriction: 'Energy Drained (-4 Negative Levels): -4 on all attacks, saves, skills, ability checks, -20 Max HP, -4 effective Caster Level.' }, fallbackEffects: [{ type: 'stat', targets: ['attack.all', 'save.all', 'skill.all'], mode: 'flat', value: -4, btype: 'Penalty' }, { type: 'stat', targets: ['hp.max'], mode: 'flat', value: -20, btype: 'Penalty' }] },
      { id: 'cnd-sickened', srdId: 'cnd-sickened', lookupType: 'Condition', name: 'Sickened', type: 'Condition', source: 'Condition', category: 'Debuff', durationCategory: 'condition', isDebuff: true, rounds: 10, durationText: '10 Rounds', notes: 'D&D 3.5e RAW: -2 penalty on all attack rolls, weapon damage rolls, saving throws, skill checks, and ability checks', fallbackEffects: [{ type: 'stat', targets: ['attack.all', 'damage.weapon', 'save.all', 'skill.all'], mode: 'flat', value: -2, btype: 'Penalty' }] },
      { id: 'cnd-shaken', srdId: 'cnd-shaken', lookupType: 'Condition', name: 'Shaken', type: 'Condition', source: 'Condition', category: 'Debuff', durationCategory: 'condition', isDebuff: true, rounds: 10, durationText: '10 Rounds', notes: 'D&D 3.5e RAW: Fear condition. -2 penalty on attack rolls, saving throws, skill checks, and ability checks', fallbackEffects: [{ type: 'stat', targets: ['attack.all', 'save.all', 'skill.all'], mode: 'flat', value: -2, btype: 'Penalty' }] },
      { id: 'cnd-fatigued', srdId: 'cnd-fatigued', lookupType: 'Condition', name: 'Fatigued', type: 'Condition', source: 'Condition', category: 'Debuff', durationCategory: 'condition', isDebuff: true, rounds: null, durationText: '8 Hours Rest', notes: 'D&D 3.5e RAW: Cannot run or charge; -2 penalty to STR and DEX.', ruleFlags: { actionRestriction: 'Cannot run or charge (-2 Str, -2 Dex). 8 hours complete rest removes Fatigue.' }, fallbackEffects: [{ type: 'stat', targets: ['ability.str', 'ability.dex'], mode: 'flat', value: -2, btype: 'Penalty' }] },
      { id: 'cnd-entangled', srdId: 'cnd-entangled', lookupType: 'Condition', name: 'Entangled', type: 'Condition', source: 'Condition', category: 'Debuff', durationCategory: 'condition', isDebuff: true, rounds: 5, durationText: '5 Rounds', notes: 'D&D 3.5e RAW: Move at half speed, cannot run or charge, -2 penalty on attack rolls, -4 penalty to DEX (-2 AC and -2 Reflex)', ruleFlags: { halfSpeed: true, actionRestriction: 'Ensnared: moves at half speed, cannot run or charge, Concentration DC 15 + spell level to cast.' }, fallbackEffects: [{ type: 'stat', targets: ['attack.all'], mode: 'flat', value: -2, btype: 'Penalty' }, { type: 'stat', targets: ['ability.dex'], mode: 'flat', value: -4, btype: 'Penalty' }] },
      { id: 'buf-slow', srdId: 'spl-slow', lookupType: 'Spell', name: 'Slow (Spell)', type: 'Condition', source: 'Spell', category: 'Debuff', durationCategory: 'short', isDebuff: true, rounds: 6, durationText: '1 rd / CL (6 Rounds)', notes: 'D&D 3.5e RAW: Only a single move or standard action per turn, -1 penalty to AC, attack rolls, and Reflex saves, half speed', ruleFlags: { halfSpeed: true, actionRestriction: 'Slowed: Only a single Move or Standard action per turn, moves at half speed.' }, fallbackEffects: [{ type: 'stat', targets: ['ac.total', 'attack.all', 'save.ref'], mode: 'flat', value: -1, btype: 'Penalty' }] }
    ];
    return specs.map(s => this._buildDefaultBuffFromCompendium(s));
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
    const fractionOnly = str.match(/(?:(?:\+?(\d+)\s*(?:every|per)\s*(\d+)\s*(?:lvl|level))|1\/(\d+)\s*(?:lvl|level)?)/i);
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
    if (cleanName.includes('magic missile')) {
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
    if (cleanName.includes('scorching ray')) {
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
    if (cleanName === 'fireball' || cleanName.includes('lightning bolt')) {
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
        projectileName: 'Burst',
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
    if (cleanName.includes('searing light')) {
      let diceCount = 1, dieSides = 8, capDesc = '';
      if (cleanName.includes('vulnerable')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 8;
        capDesc = `${diceCount}d8 (Light-Vulnerable Undead)`;
      } else if (cleanName.includes('undead')) {
        diceCount = Math.min(10, Math.max(1, cl));
        dieSides = 6;
        capDesc = `${diceCount}d6 (Undead)`;
      } else if (cleanName.includes('construct')) {
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
    if (cleanName.includes('ray of enfeeblement')) {
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

    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    const candidateModifiers = [];
    domainNames.forEach(domName => {
      const custDom = this.resolveCustomEntryOverride(domName, character, { family: 'domain' });
      const srdDom = custDom
        || this.getMasterDbEntry(domName, 'Domain')
        || ((comp && typeof comp.getDomain === 'function') ? comp.getDomain(domName) : null);
      const evDom = srdDom ? this.ensureV2Entry(srdDom, { character }) : null;
      const mods = (evDom && Array.isArray(evDom.modifiers)) ? evDom.modifiers : [];
      const displayDom = srdDom?.name || (domName.charAt(0).toUpperCase() + domName.slice(1));
      mods.forEach(mod => {
        if (mod && String(mod.target || '').startsWith('casterLevel')) {
          candidateModifiers.push({ ...mod, condition: mod.condition || mod.sourceLabel || null, _sourceLabel: `${displayDom} Domain` });
        }
      });
    });

    // Harvest any `casterLevel.*` V3 effects from active character feats and active buffs
    const extraSources = [
      ...(Array.isArray(character?.feats) ? character.feats.filter(f => f && f.active !== false).map(f => ({ entry: f, label: f.name || 'Feat' })) : []),
      ...(Array.isArray(character?.buffs) ? character.buffs.filter(b => b && b.active !== false).map(b => ({ entry: b, label: b.name || 'Buff' })) : [])
    ];
    extraSources.forEach(({ entry, label }) => {
      const dbRef = this.getMasterDbEntry(entry) || {};
      const merged = Object.assign({}, dbRef, entry, {
        effects: (Array.isArray(entry.effects) && entry.effects.length > 0) ? entry.effects : dbRef.effects
      });
      const ev = this.ensureV2Entry(merged, { character });
      const mods = (ev && Array.isArray(ev.modifiers)) ? ev.modifiers : [];
      mods.forEach(mod => {
        if (mod && String(mod.target || '').startsWith('casterLevel')) {
          candidateModifiers.push({ ...mod, condition: mod.condition || mod.sourceLabel || null, _sourceLabel: label });
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
      const condLower = typeof mod.condition === 'string' ? mod.condition.trim().toLowerCase() : '';
      if (target === 'casterlevel' || target === 'casterlevel.all') {
        if (!condLower) {
          matches = true;
        } else if (/\bchaos\b|\bchaotic\b/.test(condLower)) {
          matches = descriptorSet.has('chaotic') || descriptorSet.has('chaos');
        } else if (/\blaw\b|\blawful\b/.test(condLower)) {
          matches = descriptorSet.has('lawful') || descriptorSet.has('law');
        } else if (/\bgood\b/.test(condLower)) {
          matches = descriptorSet.has('good');
        } else if (/\bevil\b/.test(condLower)) {
          matches = descriptorSet.has('evil');
        } else if (/\bhealing\b/.test(condLower)) {
          matches = effectiveSubschool.includes('healing') || descriptorSet.has('healing');
        } else if (/\bcreation\b/.test(condLower)) {
          matches = effectiveSubschool.includes('creation') || descriptorSet.has('creation');
        } else if (/\bdivination\b|\babjuration\b|\bconjuration\b|\benchantment\b|\bevocation\b|\billusion\b|\bnecromancy\b|\btransmutation\b/.test(condLower)) {
          const schMatch = condLower.match(/\b(divination|abjuration|conjuration|enchantment|evocation|illusion|necromancy|transmutation)\b/);
          matches = Boolean(schMatch && schoolStr.includes(schMatch[1]));
        } else {
          const wordTokens = condLower.replace(/\bspells?\b/g, '').trim().split(/[\s,()/]+/).filter(Boolean);
          matches = wordTokens.length > 0 && wordTokens.some(tok => descriptorSet.has(tok) || effectiveSubschool.includes(tok) || schoolStr.includes(tok));
        }
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
      const custDom = this.resolveCustomEntryOverride(domName, character, { family: 'domain' });
      const mdbDom = this.getMasterDbEntry(domName, 'Domain');
      const compDom = (comp && typeof comp.getDomain === 'function') ? comp.getDomain(domName) : null;
      const srdDom = custDom || mdbDom || compDom;
      const evDom = srdDom ? this.ensureV2Entry(srdDom, { character }) : null;
      const v3Gp = srdDom?.grants?.grantedPower;
      entries.push({
        id: srdDom?.id || `dom-${String(domName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        schemaVersion: 3,
        name: srdDom?.name || domName,
        grants: srdDom?.grants ? JSON.parse(JSON.stringify(srdDom.grants)) : null,
        effects: Array.isArray(srdDom?.effects) ? JSON.parse(JSON.stringify(srdDom.effects)) : [],
        modifiers: Array.isArray(evDom?.modifiers) ? evDom.modifiers : [],
        ruleFlags: { ...(srdDom?.ruleFlags || {}), ...(evDom?.ruleFlags || {}) },
        spellLikeAbilities: Array.isArray(v3Gp?.spellLikeAbilities)
          ? v3Gp.spellLikeAbilities
          : (Array.isArray(srdDom?.grantedPower?.spellLikeAbilities) ? srdDom.grantedPower.spellLikeAbilities : []),
        description: v3Gp?.text || srdDom?.grantedPower?.description || srdDom?.text || srdDom?.description || ''
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
      resolved.push(this.ensureV2Entry(tmpl, { character }));
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
      if (cn.includes('cleric')) clericLvl++;
      else if (cn.includes('paladin')) paladinLvl++;
      else if (cn.includes('dread necromancer')) dreadNecroLvl++;
    });
    if (clericLvl > 0 && clericLvl === progList.length && Number(character.level) > progList.length) {
      clericLvl = Number(character.level);
    }
    if (clericLvl === 0 && paladinLvl === 0 && dreadNecroLvl === 0) {
      const cStr = String(character.classes || character.class || '').toLowerCase();
      if (cStr.includes('cleric')) clericLvl = Number(character.level) || 1;
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
      const dbFeat = this.getMasterDbEntry(f, 'Feat');
      const evFeat = this.ensureV2Entry(typeof f === 'object' ? Object.assign({}, dbFeat || {}, f) : (dbFeat || { name: f }), { character });
      const mods = Array.isArray(evFeat?.modifiers) ? evFeat.modifiers : [];
      const turnMod = mods.find(m => m && String(m.target || '').toLowerCase() === 'turnundead');
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
          schemaVersion: 3,
          domain: domName,
          name: 'Feat of Strength',
          icon: '💪',
          actionType: 'Free Action',
          maxUses: 1,
          durationText: '1 round',
          summary: `+${domainCasterLvl} Enhancement to STR for 1 round`,
          kind: 'buff',
          effects: [{ type: 'stat', targets: ['ability.str'], mode: 'flat', value: domainCasterLvl, btype: 'Enhancement' }]
        });
      }
      if (rf.protectiveWard) {
        activeDomainPowers.push({
          id: 'dom_protection_ward',
          schemaVersion: 3,
          domain: domName,
          name: 'Protective Ward',
          icon: '🛡️',
          actionType: 'Standard Action',
          maxUses: 1,
          durationText: '1 hour (next save)',
          summary: `+${domainCasterLvl} Resistance bonus on next saving throw`,
          kind: 'buff',
          effects: [{ type: 'stat', targets: ['save.all'], mode: 'flat', value: domainCasterLvl, btype: 'Resistance' }]
        });
      }
      if (rf.smiteAttack) {
        activeDomainPowers.push({
          id: 'dom_destruction_smite',
          schemaVersion: 3,
          domain: domName,
          name: 'Destruction Smite',
          icon: '⚔️',
          actionType: 'Free Action (Declare)',
          maxUses: 1,
          durationText: '1 round (single melee attack)',
          summary: `+4 Attack and +${domainCasterLvl} Damage on single melee attack`,
          kind: 'buff',
          effects: [
            { type: 'stat', targets: ['attack.all'], mode: 'flat', value: 4, btype: 'Untyped' },
            { type: 'stat', targets: ['damage.weapon'], mode: 'flat', value: domainCasterLvl, btype: 'Untyped' }
          ]
        });
      }
      if (rf.boostChaBy4OncePerDay) {
        activeDomainPowers.push({
          id: 'dom_charm_boost',
          schemaVersion: 3,
          domain: domName,
          name: 'Charm Boost (+4 CHA)',
          icon: '✨',
          actionType: 'Free Action',
          maxUses: 1,
          durationText: '1 min',
          summary: '+4 Untyped bonus to CHA for 1 minute',
          kind: 'buff',
          effects: [{ type: 'stat', targets: ['ability.cha'], mode: 'flat', value: 4, btype: 'Untyped' }]
        });
      }
      if (rf.freedomOfMovementRoundsPerDay) {
        activeDomainPowers.push({
          id: 'dom_travel_fom',
          schemaVersion: 3,
          domain: domName,
          name: 'Freedom of Movement (Travel)',
          icon: '🪽',
          actionType: 'Automatic / Free',
          maxUses: domainCasterLvl,
          unitLabel: 'rds/day',
          durationText: '1 round',
          summary: `Act normally regardless of magical impediments (${domainCasterLvl} rds/day)`,
          kind: 'buff',
          effects: [{ type: 'defense', mode: 'Immunity', what: 'Paralysis and Grapple' }],
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
        const wisScore = Number(character?.abilities?.wis ?? character?.baseAbilities?.wis ?? 10);
        const wisMod = this.getAbilityMod(wisScore);
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
            schemaVersion: 3,
            domain: domName,
            name: 'Inspire Allies',
            icon: '👑',
            actionType: 'Standard Action',
            maxUses: parsedMaxUses,
            durationText: `${durRds} round${durRds > 1 ? 's' : ''}`,
            summary: `+2 Morale bonus on saving throws, attack rolls, ability/skill checks, and weapon damage (${durRds} rds)`,
            kind: 'buff',
            effects: [
              { type: 'stat', targets: ['save.all', 'attack.all', 'damage.weapon', 'skill.all'], mode: 'flat', value: 2, btype: 'Morale' }
            ]
          });
        } else {
          const slaEntry = this.getMasterDbEntry(slaName, 'Special Ability') || this.getMasterDbEntry(slaName, 'Spell') || this.getMasterDbEntry(slaName, 'Feat');
          const slaEffects = Array.isArray(slaEntry?.effects) ? JSON.parse(JSON.stringify(slaEntry.effects)) : [];
          activeDomainPowers.push({
            id: `dom_${domName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_sla_${slaName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            schemaVersion: 3,
            domain: domName,
            name: `${slaName} (Sp)`,
            icon: '🔮',
            actionType: slaEntry?.action || 'Standard Action',
            maxUses: parsedMaxUses,
            unitLabel: unitLabel,
            durationText: slaEntry?.duration || `CL ${domainCasterLvl}`,
            summary: sla?.desc || slaEntry?.shortDescription || slaEntry?.benefit || slaEntry?.description || dom.description || `${domName} Domain Active Power (${usesStr} at CL ${domainCasterLvl})`,
            kind: slaEffects.some(e => e && e.type === 'stat') ? 'buff' : 'sla',
            effects: slaEffects,
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

    // Strip any appended energy/ability choice suffix like "(Fire)" or "(DEX)" when looking up the canonical base spell/power
    const rawSpellName = String(spell.name || '').trim();
    const baseLookupName = rawSpellName.replace(/\s*\((?:fire|cold|acid|electricity|sonic|str|dex|con|int|wis|cha)\)\s*$/i, '').trim();

    // 1. Merge with Canonical V3 Compendium / Custom DB Entry
    const dbEntry = this.getMasterDbEntry(spell, 'Spell')
      || this.getMasterDbEntry(spell, 'Power')
      || this.getMasterDbEntry({ name: baseLookupName }, 'Spell')
      || this.getMasterDbEntry({ name: baseLookupName }, 'Power')
      || {};
    const rawName = String(rawSpellName || dbEntry.name || '').trim();
    const cleanName = baseLookupName.toLowerCase();

    const rawEffects = (Array.isArray(spell.effects) && spell.effects.length > 0)
      ? spell.effects
      : (Array.isArray(dbEntry.effects) ? dbEntry.effects : []);
    const mergedForV3 = Object.assign({}, dbEntry, spell, {
      schemaVersion: 3,
      effects: rawEffects,
      ruleFlags: { ...(dbEntry.ruleFlags || {}), ...(spell.ruleFlags || {}) }
    });
    const evSpell = this.evaluateV3Entry(mergedForV3, { ...evalCtx, ml: cl, character });
    let modifiers = Array.isArray(evSpell.modifiers) ? evSpell.modifiers : [];
    let sizeModifier = spell.sizeModifier || dbEntry.sizeModifier || (evSpell.sizeSteps ? { targetType: 'creature', scaling: { steps: evSpell.sizeSteps } } : null);
    let tempHpFormula = evSpell.tempHpFormula || spell.tempHpFormula || dbEntry.tempHpFormula || null;
    let ruleFlags = { ...(evSpell.ruleFlags || {}) };
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
    const chosenEnergy = spell.chosenEnergy || this.extractEntryChoice(spell) || null;
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

    // 5. Evaluate Duration string at Caster Level directly from V3 spell metadata
    const rawDur = String(spell.spell?.duration || dbEntry.spell?.duration || spell.duration || dbEntry.duration || '1 min./level').trim();
    let durationText = rawDur;
    if (/10\s*min\.?\/level/i.test(rawDur)) durationText = `${cl * 10} min`;
    else if (/\b1\s*min\.?\/level/i.test(rawDur)) durationText = `${cl} min`;
    else if (/24\s*hours?/i.test(rawDur)) durationText = '24 hr';
    else if (/\b1\s*(?:hour|hr)\.?\/level/i.test(rawDur)) durationText = `${cl} hr`;
    else if (/\b1\s*round\/level/i.test(rawDur)) durationText = `${cl} rounds`;

    return {
      schemaVersion: 3,
      isBuffSpell: true,
      id: spell.id || dbEntry.id || `buff-${cleanName.replace(/[^a-z0-9]+/g, '-')}`,
      name: baseLookupName || rawName,
      casterLevel: cl,
      targetMode,
      effects: JSON.parse(JSON.stringify(rawEffects)),
      choices: Array.isArray(spell.choices) && spell.choices.length > 0
        ? JSON.parse(JSON.stringify(spell.choices))
        : (Array.isArray(dbEntry.choices) && dbEntry.choices.length > 0 ? JSON.parse(JSON.stringify(dbEntry.choices)) : []),
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

  // Central Recalculation Engine for Character State (Abilities, AC, Saves, Speed, Buffs) - Canonical V2/V3
  recalculateCharacter(character, masterDb = [], tacticalOptions = {}) {
    if (!character) return;
    const options = tacticalOptions || {};
    this._activeCharacter = character;
    this._activeCustomEntries = (character.customEntries && typeof character.customEntries === 'object') ? character.customEntries : null;

    // 0. Gatekeeper: Ensure Character Data is Pure Canonical V3
    const migrator0 = (typeof window !== 'undefined' && window.SchemaMigrator)
      || (typeof SchemaMigrator !== 'undefined' ? SchemaMigrator : null);
    if (character.schemaVersion !== 3 && migrator0 && typeof migrator0.upgradeCharacterToV3 === 'function') {
      migrator0.upgradeCharacterToV3(character);
    }

    const charLvl = Number(character.level) || (Array.isArray(character.levelProgression) ? character.levelProgression.filter(l => l.active !== false).length : 1) || 1;
    const bab = Number(character.bab) || 0;
    const chaModForCtx = this.getAbilityMod(character.abilities?.cha || character.baseAbilities?.cha || 10);
    const evalContext = this.buildFormulaContext(character, { cl: charLvl, level: charLvl, bab, chaMod: chaModForCtx });

    const resolveStacks = (val) => (val !== undefined && val !== null && val !== '' && !Number.isNaN(Number(val))) ? Number(val) : 1;

    // V2.5 Unified Composable Lego Evaluation Pre-Pass (Synergy Auto-Unlocks, Entity Selector Mutations, Defenses, Resources, Modes)
    const rawPool = Array.isArray(masterDb) && masterDb.length > 0 ? masterDb : (Array.isArray(character.customDb) ? character.customDb : []);
    this._activeCustomDb = rawPool;
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
    const miscAcBonuses = [];
    const touchOnlyAcBonuses = [];
    const flatFootedOnlyAcBonuses = [];
    const sizeAcAdjustments = [];
    const acPenaltySources = [];
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
    const grappleBonusBuckets = [];
    const tempHpBuckets = [];

    let hasSteadfastDetermination = false;
    let hasShieldWard = false;
    let hasTwoWeaponDefense = false;
    let minMaxDex = null;
    let totalAcp = 0;
    let resistBonus = 0;
    let itemSpeedBonus = 0;
    let buffSpeedBonus = 0;
    let buffSpeedPenalty = 0;
    let swimSpeed = 0;
    let climbSpeed = 0;
    let flySpeed = 0;
    let burrowSpeed = 0;
    let bonusPowerPoints = 0;
    let grappleModBonus = 0;
    const bonusSpellSlotsByLevel = {};
    const conditionalAcBonuses = [];
    const conditionalSaveBonuses = [];
    let buffAcPenalty = 0;
    let buffSkillBonus = 0;
    let debuffHpPenalty = 0;
    let draconicToughnessHp = 0;
    let v3FlawHpPenalty = 0;
    let hasV3FrailApplied = false;
    let conditionLoseDexToAC = false;
    let conditionFlatFooted = false;
    let conditionEffectiveDexZero = false;
    let conditionHalfSpeed = false;
    let activePrimalCount = 0;
    let activeHeartCount = 0;
    const activeConditionWarnings = [];

    // Universal Canonical V2/V3 Modifiers Processor
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
        let val = 0;
        if (hasFormula) {
          const fVal = Number(this.evaluateFormula(mod.formula, ctx));
          val = Number.isFinite(fVal) ? fVal : (Number(mod.value) || 0);
        } else {
          val = Number(mod.value) || 0;
        }
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
        // `ac.abilityMod` / `ac.base` and non-additive `ac.total` ops (replace/set/max) are resolved by the V2.5 Lego
        // pipeline (legoEval.ac). An additive `ac.total` modifier (Blinded / Stunned / Cowering -2, Slow -1,
        // Enlarge Person size -1, Inspire Heroics dodge, Eyes of the Oracle insight) is an ordinary AC bonus or penalty.
        const acOp = String(mod.op || 'add').toLowerCase();
        if (acSub === 'abilitymod' || acSub === 'base' || (acSub === 'total' && acOp !== 'add')) {
          return;
        }
        if (target === 'ac' || target.startsWith('ac.') || ['armor', 'shield', 'natural', 'deflection', 'dodge'].includes(acSub)) {
          if (acSub === 'shieldbonus' || mod.stacksWithShield === true) {
            const cleanSrc = sourceName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim() || sourceName;
            const normSrc = cleanSrc.toLowerCase().startsWith('shield specialization') ? 'Shield Specialization' : cleanSrc;
            if (!shieldBonuses.some(b => b.source && b.source.toLowerCase() === normSrc.toLowerCase())) {
              shieldBonuses.push({ val, source: normSrc, type: 'untyped' });
            }
            return;
          }
          if (sourceCategory === 'feat' && (acSub === 'shield' || mTypeLower === 'shield') && !sourceName.toLowerCase().includes('two-weapon defense')) {
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
          if (acSub === 'touch') {
            touchOnlyAcBonuses.push({ val, source: sourceName, type: mType });
            return;
          }
          if (acSub === 'flatfooted' || acSub === 'flat_footed' || acSub === 'flat') {
            flatFootedOnlyAcBonuses.push({ val, source: sourceName, type: mType });
            return;
          }
          if (mTypeLower === 'size' || acSub === 'size') {
            // PHB Table 8-1: a size change (Enlarge / Reduce Person, Expansion) moves the size modifier, which applies to normal, touch and flat-footed AC.
            sizeAcAdjustments.push({ val, source: sourceName, type: 'Size' });
          } else if (val < 0 || mTypeLower === 'penalty') {
            buffAcPenalty += Math.abs(val);
            acPenaltySources.push(String(sourceName || '').toLowerCase());
          } else if (acSub === 'shield' || mTypeLower === 'shield') {
            shieldBonuses.push({ val, source: sourceName, type: 'Shield', incorporeal: this.isForceAcSource(sourceName) });
          } else if (acSub === 'deflection' || mTypeLower === 'deflection') {
            deflectionBonuses.push({ val, source: sourceName, type: 'Deflection' });
          } else if (acSub === 'natural' || mTypeLower.includes('natural')) {
            const natType = sourceCategory === 'template'
              ? 'template'
              : ((mTypeLower.includes('ench') || sourceName.toLowerCase().includes('barkskin') || sourceName.toLowerCase().includes('amulet of natural armor'))
                ? 'Natural_Armor_Ench'
                : 'Natural');
            naturalBonuses.push({ val, source: sourceName, type: natType });
          } else if (acSub === 'armor' || mTypeLower === 'armor') {
            armorBonuses.push({ val, source: sourceName, type: 'Armor', incorporeal: this.isForceAcSource(sourceName) });
          } else if (mTypeLower === 'dodge' || mTypeLower === 'haste' || (acSub === 'dodge' && mTypeLower === 'untyped')) {
            dodgeBonuses.push({ val, source: sourceName, type: mTypeLower === 'haste' ? mType : 'Dodge' });
          } else {
            // Insight, luck, sacred, profane, divine, inherent, cover, circumstance and untyped AC bonuses (Foresight,
            // Recitation, Staff of Power, Monk AC Bonus) apply to normal, touch and flat-footed AC and are not lost with Dex
            // (PHB p.136: flat-footed loses only the Dex bonus; dodge bonuses go with it, PHB p.177).
            miscAcBonuses.push({ val, source: sourceName, type: mType.charAt(0).toUpperCase() + mType.slice(1) });
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

        // Speed (`speed.swim`, `speed.climb`, `speed.fly`, `speed.burrow` vs Land Speed `speed`, `speed.land`, `speed.all`)
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
        if (target === 'speed.burrow') {
          if (val > burrowSpeed) burrowSpeed = val;
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

        // Psionic Power Points (`psionics.powerPoints`, `psionic.powerPoints`, `psionic`, `powerpoints`)
        if (target === 'psionics.powerpoints' || target === 'psionic.powerpoints' || target === 'psionic' || target === 'powerpoints') {
          const srcLow = String(sourceName || '').toLowerCase();
          if (!srcLow.includes('wild talent') && !srcLow.includes('hidden talent')) {
            bonusPowerPoints += val;
          }
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

        // Combat Maneuver / Grapple (`cmb`, `grapple`, `atk.grapple`, `attack.grapple`, `opposed.grapple`)
        if (target === 'cmb' || target === 'grapple' || target === 'atk.grapple' || target === 'attack.grapple' || target === 'opposed.grapple') {
          grappleBonusBuckets.push({ val, type: mType, source: sourceName });
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

        // Temporary HP (`hp.temp`, `temp_hp`)
        if (target === 'hp.temp' || target === 'temp_hp') {
          if (val > 0) tempHpBuckets.push({ val, type: mType, source: sourceName });
          return;
        }

        // HP per Level (`hp.perLvl`, `hp.perLevel`)
        if (target === 'hp.perlvl' || target === 'hp.perlevel') {
          const isPreScaled = hasFormula && /@(?:level|lvl|hd)\b/i.test(String(mod.formula));
          const hpAdd = isPreScaled ? val : (val * charLvl);
          if (hpAdd < 0) {
            if (sourceCategory === 'feat') {
              v3FlawHpPenalty += Math.abs(hpAdd);
              if (String(sourceName || '').toLowerCase().includes('frail')) hasV3FrailApplied = true;
            } else {
              debuffHpPenalty += Math.abs(hpAdd);
            }
          } else {
            draconicToughnessHp += hpAdd;
          }
          return;
        }

        // Defenses (`dr`, `sr`, `fastHealing`, `resist.<elem>`)
        if (target === 'fasthealing' || target === 'fast_healing' || target === 'hp.fasthealing') {
          if (character.evaluatedDefenses) {
            character.evaluatedDefenses.fastHealing = Math.max(Number(character.evaluatedDefenses.fastHealing) || 0, val);
          }
          return;
        }
        if (target === 'sr' || target === 'spellresistance') {
          if (character.evaluatedDefenses) {
            character.evaluatedDefenses.sr = Math.max(Number(character.evaluatedDefenses.sr) || 0, val);
          }
          return;
        }
        if (target === 'dr' || target.startsWith('dr.')) {
          if (character.evaluatedDefenses && Array.isArray(character.evaluatedDefenses.dr)) {
            const bypass = mod.bypass || (target.startsWith('dr.') ? target.slice(3) : '-');
            if (!character.evaluatedDefenses.dr.some(d => d && d.source === sourceName && d.value === val)) {
              character.evaluatedDefenses.dr.push({ value: val, bypass, source: sourceName });
            }
          }
          return;
        }
        if (target.startsWith('resist.') || target.startsWith('resistance.')) {
          if (character.evaluatedDefenses) {
            if (!character.evaluatedDefenses.resistances) character.evaluatedDefenses.resistances = {};
            const elem = target.split('.')[1];
            if (elem) {
              character.evaluatedDefenses.resistances[elem] = Math.max(Number(character.evaluatedDefenses.resistances[elem]) || 0, val);
            }
          }
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

        const slotIncorp = this.itemHasEnhancementFlag(slotData, 'ghostTouchArmor') || this.isForceAcSource(slotData.name);
        if (mods.armor > 0) armorBonuses.push({ val: mods.armor, source: mods.armorSourceLabel || slotData.name, type: 'Armor', incorporeal: slotIncorp });
        if (mods.shield > 0) shieldBonuses.push({ val: mods.shield, source: mods.shieldSourceLabel || slotData.name, type: 'Shield', incorporeal: slotIncorp });
        if (mods.natural > 0) naturalBonuses.push({ val: mods.natural, source: slotData.name, type: mods.naturalBonusType || mods.bonusType || 'Natural' });
        if (mods.deflection > 0) deflectionBonuses.push({ val: mods.deflection, source: slotData.name, type: 'Deflection' });
        if (mods.dodge > 0) dodgeBonuses.push({ val: mods.dodge, source: slotData.name, type: 'Dodge' });
        (mods.miscAc || []).forEach(b => miscAcBonuses.push(b));
        (mods.conditionalAc || []).forEach(c => conditionalAcBonuses.push(c));
        if (mods.acPenalty > 0) {
          buffAcPenalty += mods.acPenalty;
          acPenaltySources.push(String(slotData.name || '').toLowerCase());
        }

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
          if (Array.isArray(resolvedSpec.effects) && resolvedSpec.effects.length > 0) {
            rawBuff.schemaVersion = 3;
            rawBuff.effects = resolvedSpec.effects;
            delete rawBuff.modifiers;
            const reEv = this.evaluateV3Entry({ ...rawBuff, casterLevel: buffCl }, { ...buffCtx, character });
            buff.modifiers = reEv.modifiers;
            buff.ruleFlags = { ...(buff.ruleFlags || {}), ...(reEv.ruleFlags || {}) };
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
      const evalTempFormulaVal = (buff.tempHpFormula && !/\d*d\d+/i.test(String(buff.tempHpFormula)))
        ? Math.max(0, Number(this.evaluateFormula(buff.tempHpFormula, buffCtx)) || 0)
        : 0;
      const buffTempHp = Number(rawBuff.grantedTempHp) || Number(buff.ruleFlags?.tempHp) || evalTempFormulaVal || Number((buff.modifiers || []).find(m => m && String(m.target || '').toLowerCase() === 'hp.temp')?.value) || 0;
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
      // The Flat-Footed condition is kept apart: Uncanny Dodge keeps the Dex bonus when flat-footed (PHB p.26, p.50),
      // but not against the other Dex-losing conditions (Blinded, Stunned, Cowering, Pinned).
      const isFlatFootedCondition = String(buff.id || '').toLowerCase().split(':').pop() === 'cnd-flat-footed';
      if (rf.loseDexToAC && isFlatFootedCondition && !rf.effectiveDexZero) conditionFlatFooted = true;
      else if (rf.loseDexToAC) conditionLoseDexToAC = true;
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

    // 3.5. Evaluate Feats, Special Abilities & Homebrew (Canonical V2/V3)
    if (character.flatFooted || character.tactical?.flatFooted || tacticalOptions?.flatFooted) {
      conditionFlatFooted = true;
    }
    if (character.loseDexToAC) {
      conditionLoseDexToAC = true;
    }
    // Refresh evalContext with post-Step-2.5/3 ability scores and condition state so V3 `when` conditions (`notFlatFooted`, `wieldingChosenShield`) and ability formulas (`@intMod`, `@chaMod`) see live state
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
      const base = Number(character.baseAbilities?.[stat] ?? character.abilities?.[stat] ?? 10);
      const curScore = base + this.resolveBonusStacking(abilityBuckets[stat], character);
      evalContext[stat] = curScore;
      evalContext[`${stat}Mod`] = this.getAbilityMod(curScore);
    });
    evalContext.flatFooted = Boolean(conditionFlatFooted);
    evalContext.loseDexToAC = Boolean(conditionLoseDexToAC);

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
      ...(character.flaws || []),
      ...(character.traits || []),
      ...(character.skillTricks || []),
      ...(character.specialAbilities || [])
    ];
    const existingFeatCounts = new Map();
    allAbilitiesAndFeats.forEach(f => {
      const clean = stripFeatTag(typeof f === 'string' ? f : (f?.name || ''));
      if (clean) existingFeatCounts.set(clean, (existingFeatCounts.get(clean) || 0) + 1);
    });
    const progFeatOccurrences = new Map();
    activeProgRows.forEach(r => {
      [...(r.feats || []), ...(r.specialAbilities || [])].forEach(fStr => {
        const clean = stripFeatTag(typeof fStr === 'string' ? fStr : (fStr?.name || ''));
        if (!clean || clean.startsWith('+1 stat') || clean.includes('stat:') || clean.includes('cl = level')) return;
        const seenInProg = (progFeatOccurrences.get(clean) || 0) + 1;
        progFeatOccurrences.set(clean, seenInProg);
        const currentCount = existingFeatCounts.get(clean) || 0;
        const dbMatch = this.getMasterDbEntry(clean);
        const maxAllowed = (dbMatch && (Number(dbMatch.maxRanks) > 1 || dbMatch.stackable === true))
          ? (Number(dbMatch.maxRanks) > 1 ? Number(dbMatch.maxRanks) : 20)
          : 1;
        if (currentCount < Math.min(maxAllowed, seenInProg)) {
          existingFeatCounts.set(clean, currentCount + 1);
          allAbilitiesAndFeats.push(typeof fStr === 'string' ? { name: fStr, category: String(fStr).includes('Boon') ? 'Homebrew' : 'Feat' } : fStr);
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

      // Re-evaluate V3 entry with live evalContext (post-equipment/buff abilities, flatFooted, chosen shield/weapon) when V3 effects[] exist
      const hasV3EffectsOnEntry = Boolean(
        (Array.isArray(featObj.effects) && featObj.effects.length > 0) ||
        (Array.isArray(featObj.blocks) && featObj.blocks.length > 0) ||
        (Array.isArray(dbEntry?.effects) && dbEntry.effects.length > 0) ||
        (Array.isArray(dbEntry?.blocks) && dbEntry.blocks.length > 0)
      );
      let v3LiveEntry = null;
      if (hasV3EffectsOnEntry && (!mutatedEntry || !mutatedEntry._mutated)) {
        const mergedForV3 = Object.assign({}, dbEntry || {}, featObj, {
          id: featObj.id || dbEntry?.id,
          name: rawName || dbEntry?.name,
          effects: (Array.isArray(featObj.effects) && featObj.effects.length > 0) ? featObj.effects : dbEntry?.effects,
          blocks: (Array.isArray(featObj.blocks) && featObj.blocks.length > 0) ? featObj.blocks : dbEntry?.blocks,
          _v3Evaluated: false,
          modifiers: []
        });
        v3LiveEntry = this.evaluateV3Entry(mergedForV3, evalContext);
      }

      // Apply V2 modifiers from mutated Lego entry, live V3 evaluation, feat object, or compendium entry
      let featMods = (mutatedEntry && mutatedEntry._mutated && Array.isArray(mutatedEntry.modifiers) && mutatedEntry.modifiers.length > 0)
        ? mutatedEntry.modifiers
        : (v3LiveEntry && Array.isArray(v3LiveEntry.modifiers)
          ? v3LiveEntry.modifiers
          : ((Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0)
            ? featObj.modifiers
            : (dbEntry && Array.isArray(dbEntry.modifiers) ? dbEntry.modifiers : [])));

      // Auto-hydrate legacy Homebrew entries (e.g. "Homebrew: HP +20", "Homebrew: Ride +4", "Homebrew: Natural Armor AC (+2 (+1/4 Lvl))") if saved without V2 modifiers or missing scaling formula
      const needsScalingFormulaHydration = (cleanName.includes('boon') || cleanName.includes('grant') || String(featObj.category || '').toLowerCase().includes('boon'))
        && /([+-]?\d+)\s*(?:\/|\bper\b|\bevery\b)\s*(\d+)?\s*(?:lvl|level|cl)s?\b/i.test(`${cleanName} ${featObj.benefit || featObj.description || ''}`)
        && !featMods.some(m => m && m.formula);
      if ((featMods.length === 0 || needsScalingFormulaHydration) && (cleanName.includes('boon') || cleanName.includes('grant') || String(featObj.category || '').toLowerCase().includes('boon'))) {
        if (typeof window !== 'undefined' && typeof window.synthesizeHomebrewFromQuery === 'function') {
          const synth = window.synthesizeHomebrewFromQuery(cleanName, featObj.benefit || featObj.description || '', 'Homebrew');
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

      const rf = { ...(dbEntry?.ruleFlags || {}), ...(featObj.ruleFlags || {}), ...(v3LiveEntry?.ruleFlags || {}) };
      if (rf.conToWillSave) {
        hasSteadfastDetermination = true;
      }
      if ((rf.hpPerLevel || cleanName.includes('draconic toughness')) && !featMods.some(m => m && ['hp', 'hp.max', 'hp.perlvl', 'hp.perlevel'].includes(String(m.target || '').toLowerCase()))) {
        draconicToughnessHp += charLvl;
      }
      if (!hasV3EffectsOnEntry && (rf.dodgeBonus || cleanName === 'dodge')) {
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
      if (!hasV3EffectsOnEntry && (rf.mobilityBonus || cleanName === 'mobility')) {
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
      if (!hasV3EffectsOnEntry && (rf.shieldSpecialization || cleanName.startsWith('shield specialization'))) {
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
      if (rf.twoWeaponDefense) {
        hasTwoWeaponDefense = true;
      }

      // Dynamic scaling natural armor boons (e.g. "Nat AC 2+1/4lvl") if not already in V2 modifiers
      if (featMods.length === 0 && (cleanName.includes('nat ac') || cleanName.includes('natural armor'))) {
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
    const validExtraLegoSources = new Set(['legoEntries', 'classFeatures', 'soulmelds', 'vestiges', 'powers', 'mysteries', 'utterances']);
    (legoEval.entries || []).forEach(le => {
      if (!le) return;
      if (!validExtraLegoSources.has(le._legoSource) && le._autoUnlocked !== true) {
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
      const rawInv = le.essentia !== undefined ? le.essentia : le.invested;
      const leInvested = (rawInv !== undefined && rawInv !== null && rawInv !== '' && !Number.isNaN(Number(rawInv))) ? Number(rawInv) : 0;
      const leCtx = { ...evalContext, essentia: leInvested, self: { stacks: leStacks, invested: leInvested } };
      let leToApply = le;
      if (!le._mutated && ((Array.isArray(le.effects) && le.effects.length > 0) || (Array.isArray(le.blocks) && le.blocks.length > 0))) {
        leToApply = this.evaluateV3Entry(Object.assign({}, le, { _v3Evaluated: false, modifiers: [] }), leCtx);
      }
      if (Array.isArray(leToApply.modifiers) && leToApply.modifiers.length > 0) {
        applyV2Modifiers(leToApply.modifiers, leToApply.name || leToApply.id || 'Lego Entry', 'feat', leCtx);
      }
      if (leToApply.ruleFlags?.conToWillSave) hasSteadfastDetermination = true;
      if (leToApply.ruleFlags?.shieldToTouchAc) hasShieldWard = true;
      if (leToApply.ruleFlags?.twoWeaponDefense) hasTwoWeaponDefense = true;
      (leToApply.modes || []).forEach(mode => {
        if (mode && (String(mode.actionType || '').toLowerCase() === 'passive' || mode.isPassive) && Array.isArray(mode.modifiers) && mode.modifiers.length > 0) {
          applyV2Modifiers(mode.modifiers, leToApply.name || leToApply.id || 'Lego Entry', 'feat', leCtx);
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
        // Only apply save/ability/luck modifiers for slotless/gearPool items that aren't already slotted in bodySlots
        const inBodySlot = character.bodySlots && Object.values(character.bodySlots).some(s => s && s.name && s.name !== '-' && ((item.id && s.id === item.id) || s.name === item.name));
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
      // Racial conditional AC / save bonuses (vs. Giants, vs. Poison, vs. Fear, ...) come from the Race record's
      // V3 `effects[]` (bridged into `raceObj.modifiers` above); no race-name matching here.
    }

    // 3.92. Collect Character Template Modifiers (Canonical V3 `srd_templates.json`)
    const activeTemplateEntries = this.getCharacterActiveTemplateEntries(character);
    const raceTraitsForLa = typeof this.getRaceTraits === 'function' ? this.getRaceTraits(character) : null;
    let totalLevelAdjustment = raceTraitsForLa ? raceTraitsForLa.levelAdjustment : (Number(this.getMasterDbEntry(character.race, 'Race')?.levelAdjustment) || 0);
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
        const la = Number(tmpl.race?.levelAdjustment ?? tmpl.levelAdjustment ?? tmpl.ruleFlags?.levelAdjustment) || 0;
        const cr = Number(tmpl.crIncrease ?? tmpl.ruleFlags?.crIncrease) || 0;
        templateSummary.levelAdjustment += la;
        templateSummary.crIncrease += cr;
        totalLevelAdjustment += la;
        if (tmpl.race?.creatureType || tmpl.creatureType) templateSummary.creatureType = tmpl.race?.creatureType || tmpl.creatureType;
        if (tmpl.hitDieOverride) templateSummary.hitDieOverride = tmpl.hitDieOverride;
        if (tmpl.dr && !templateSummary.dr.includes(tmpl.dr)) templateSummary.dr.push(tmpl.dr);
        if (tmpl.sr || tmpl.ruleFlags?.srFormula) {
          const srExpr = tmpl.ruleFlags?.srFormula || tmpl.sr;
          const srVal = Number(this.evaluateFormula(srExpr, tmplEvalCtx)) || parseInt(srExpr, 10) || 0;
          if (srVal > templateSummary.sr) templateSummary.sr = srVal;
        }
        if (Array.isArray(tmpl.effects)) {
          tmpl.effects.forEach(ef => {
            if (!ef || ef.type !== 'defense') return;
            if (ef.mode === 'Immunity' && ef.what && !templateSummary.immunities.includes(ef.what)) templateSummary.immunities.push(ef.what);
            else if (ef.mode === 'Energy Resistance' && ef.what) {
              const rTxt = `${ef.what} ${ef.value || 5}`;
              if (!templateSummary.resistances.includes(rTxt)) templateSummary.resistances.push(rTxt);
            } else if (ef.mode === 'DR' && ef.value) {
              const drTxt = `${ef.value}/${ef.what || '-'}`;
              if (!templateSummary.dr.includes(drTxt)) templateSummary.dr.push(drTxt);
            } else if (ef.mode === 'Spell Resistance' && ef.value) {
              const srV = Number(ef.value) || 0;
              if (srV > templateSummary.sr) templateSummary.sr = srV;
            } else if (ef.mode === 'Sense / Movement' && ef.what && !templateSummary.vision.includes(ef.what)) {
              templateSummary.vision.push(ef.what);
            }
          });
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
    const prevEvalDefenses = character.evaluatedDefenses || {};
    legoEval = this.evaluateLegoCharacter(character, candidatePool, { precomputedAbilities: character.abilities });
    character.legoEvaluation = legoEval;
    character.evaluatedDefenses = legoEval.defenses;
    if (prevEvalDefenses && character.evaluatedDefenses) {
      if (Number(prevEvalDefenses.sr) > Number(character.evaluatedDefenses.sr || 0)) {
        character.evaluatedDefenses.sr = Number(prevEvalDefenses.sr);
      }
      if (Number(prevEvalDefenses.fastHealing) > Number(character.evaluatedDefenses.fastHealing || 0)) {
        character.evaluatedDefenses.fastHealing = Number(prevEvalDefenses.fastHealing);
      }
      if (Array.isArray(prevEvalDefenses.dr)) {
        prevEvalDefenses.dr.forEach(d => {
          if (d && !character.evaluatedDefenses.dr.some(ed => ed && ed.source === d.source && ed.value === d.value)) {
            character.evaluatedDefenses.dr.push(d);
          }
        });
      }
      if (prevEvalDefenses.resistances && typeof prevEvalDefenses.resistances === 'object') {
        Object.entries(prevEvalDefenses.resistances).forEach(([rk, rv]) => {
          character.evaluatedDefenses.resistances[rk] = Math.max(Number(character.evaluatedDefenses.resistances[rk]) || 0, Number(rv) || 0);
        });
      }
    }
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
    const hasFrail = hasV3FrailApplied || charFeatNames.some(f => f.includes('flaw: frail') || f.includes('[flaw] frail') || f === 'frail' || f.endsWith(' frail'));
    const flawHpPenalty = v3FlawHpPenalty > 0 ? v3FlawHpPenalty : (hasFrail ? totalHD : 0);

    if (character.hp) {
      if (tempHpBuckets.length > 0) {
        const stackedTempHp = this.resolveBonusStacking(tempHpBuckets);
        if (stackedTempHp > (Number(character.hp.temp) || 0)) {
          character.hp.temp = stackedTempHp;
        }
      }
      const rawConModForHp = this.getAbilityMod(character.abilities?.con || 10);
      const hpSwapRes = this.resolveSwapSlot(legoEval?.replacements, 'hp.abilityMod', rawConModForHp, 'CON', { character });
      const effectiveConMod = hpSwapRes.value + hpSwapRes.addItems.reduce((s, x) => s + x.val, 0);
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
    const effectiveNatural = this.resolveBonusStacking(naturalBonuses);
    const effectiveDeflection = this.resolveBonusStacking(deflectionBonuses);
    let effectiveDodge = this.resolveBonusStacking(dodgeBonuses);
    const effectiveMiscAc = this.resolveBonusStacking(miscAcBonuses);

    // Tactical stance / combat mode dodge bonuses.
    // `character.tactical` is the canonical combat state (written by the 'combat/toggleTacticalMod' and
    // 'combat/adjustCombatExpertise' reducers); `tacticalOptions` only fills keys the document does not carry.
    // Reading the options first let a stale options snapshot (e.g. CharStore's cached recompute options, or the
    // option-less recalculation paths) silently drop Total Defense / Fighting Defensively / Combat Expertise.
    const docTactical = (character.tactical && typeof character.tactical === 'object') ? character.tactical : {};
    const optTactical = tacticalOptions || {};
    const readTactical = (key) => (docTactical[key] !== undefined ? docTactical[key] : optTactical[key]);
    const combatExpertise = Number(readTactical('combatExpertise')) || 0;
    const fightingDefensively = Boolean(readTactical('fightingDefensively'));
    const totalDefense = Boolean(readTactical('totalDefense'));
    const charge = Boolean(readTactical('charge'));

    // Two-Weapon Defense (PHB p.102, ruleFlags.twoWeaponDefense): +1 shield bonus while wielding a double weapon or two
    // weapons, +2 when fighting defensively or using total defense. A shield bonus: it does not stack with a shield's.
    if (hasTwoWeaponDefense && this.isWieldingTwoWeaponsOrDouble(character, offHandSuppressed)) {
      const existingTwd = shieldBonuses.find(b => b && String(b.source || '').toLowerCase().includes('two-weapon defense'));
      if (existingTwd) {
        if ((fightingDefensively || totalDefense) && existingTwd.val < 2) existingTwd.val = 2;
      } else {
        shieldBonuses.push({ val: (fightingDefensively || totalDefense) ? 2 : 1, source: 'Two-Weapon Defense', type: 'Shield' });
      }
    }
    const effectiveShield = this.resolveBonusStacking(shieldBonuses, character);

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

    // Uncanny Dodge keeps the Dex bonus when flat-footed, never when immobilized / helpless (effective Dex 0)
    const hasUncannyDodge = !conditionEffectiveDexZero && (
      activePrimalCount >= 2 ||
      (character.specialAbilities || []).some(a => (typeof a === 'string' ? a : a.name).toLowerCase().includes('uncanny dodge')) ||
      (character.buffs || []).some(b => b && b.active && b.ruleFlags?.uncannyDodge)
    );
    if (conditionFlatFooted && !hasUncannyDodge) conditionLoseDexToAC = true;

    // Dex to AC capped by Max Dex & Condition Flags (Helpless / Paralyzed / Blinded / Stunned / Grappled)
    const fullDexMod = conditionEffectiveDexZero ? -5 : this.getAbilityMod(character.abilities.dex || 10);
    // Load Max Dex & Check Penalty (PHB Table 9-2: medium load Max Dex +3 / ACP -3, heavy load Max Dex +1 / ACP -6; Footnote 1: use the worse figure from armor or load, not both).
    const encumbrance = this.computeEncumbrance(character);
    const loadMaxDex = (encumbrance.loadStatus.maxDex === null || encumbrance.loadStatus.maxDex === undefined) ? null : Number(encumbrance.loadStatus.maxDex);
    const loadCheckPenalty = Number(encumbrance.loadStatus.checkPenalty) || 0;
    const effectiveAcp = Math.min(totalAcp, loadCheckPenalty);
    const effectiveMaxDex = loadMaxDex === null ? minMaxDex : (minMaxDex === null ? loadMaxDex : Math.min(minMaxDex, loadMaxDex));
    let effectiveDex = effectiveMaxDex !== null ? Math.min(fullDexMod, effectiveMaxDex) : fullDexMod;
    if (conditionLoseDexToAC) {
      effectiveDex = Math.min(0, effectiveDex);
      effectiveDodge = 0; // RAW D&D 3.5e: Any condition that makes you lose Dex bonus to AC also makes you lose Dodge bonuses
    }

    // AC Penalties (untyped; they apply to normal, touch and flat-footed AC alike).
    // Charge (PHB p.154): -2 AC until the start of your next turn.
    let totalPenalty = buffAcPenalty;
    if (charge) totalPenalty += 2;
    // Vulnerable flaw (UA p.92, -1 AC): the compendium entry carries the penalty as a modifier; the name check only
    // covers legacy feat strings that resolve to no compendium entry, so the -1 is never applied twice.
    if (charFeatNames.some(f => f.includes('flaw: vulnerable') || f === 'vulnerable') && !acPenaltySources.some(s => s.includes('vulnerable'))) {
      totalPenalty += 1;
    }

    const baseAC = 10;
    // Size modifier (PHB Table 8-1) from the creature's size category, shifted by size-change effects (Enlarge / Reduce Person).
    // A character without a size falls back to the size modifier stored on its last breakdown.
    const baseSizeMod = this.getBaseSizeModifier(character);
    // Size-change effects do not stack with each other: the largest growth and the largest shrink each apply once.
    const sizeVals = sizeAcAdjustments.map(b => Number(b.val) || 0);
    const sizeShift = Math.min(0, ...sizeVals) + Math.max(0, ...sizeVals);
    const sizeBonus = baseSizeMod + sizeShift;

    // Reconcile V2.5 `ac.abilityMod` sub-component bonus / substitution (e.g. Canny Defense, Monk/Swordsage AC Bonus)
    let legoAcAbilityDelta = 0;
    const hasLegoAcAbiMod = (legoEval.entries || []).some(e =>
      (e.modifiers || []).concat((e.modes || []).filter(m => m && (m.actionType === 'passive' || m.isPassive)).flatMap(m => m.modifiers || []))
        .some(m => m && String(m.target || '').toLowerCase() === 'ac.abilitymod')
    );
    if (hasLegoAcAbiMod && legoEval.ac && typeof legoEval.ac.abilityMod === 'number') {
      legoAcAbilityDelta = Math.max(0, legoEval.ac.abilityMod - fullDexMod);
    }

    const effectiveTouchOnlyAc = this.resolveBonusStacking(touchOnlyAcBonuses);
    const effectiveFlatFootedOnlyAc = this.resolveBonusStacking(flatFootedOnlyAcBonuses);

    let totalAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + effectiveDex + legoAcAbilityDelta + effectiveDodge + effectiveMiscAc;
    let touchAC = baseAC + (hasShieldWard ? effectiveShield : 0) + effectiveDeflection + sizeBonus + effectiveDex + legoAcAbilityDelta + effectiveDodge + effectiveMiscAc + effectiveTouchOnlyAc;

    // AC against an incorporeal touch attack: touch AC plus only the armor / shield bonuses that are force effects or
    // come from Ghost Touch gear. When a shield already counts toward touch AC (Shield Ward), it is not added twice.
    const incorpArmor = this.resolveBonusStacking(armorBonuses.filter(b => b && b.incorporeal), character);
    const incorpShield = hasShieldWard ? 0 : this.resolveBonusStacking(shieldBonuses.filter(b => b && b.incorporeal), character);
    const incorporealBonus = incorpArmor + incorpShield;

    // Flat-footed AC (RAW: retain negative Dex penalty even when flat-footed; retain Dex & Dodge if Uncanny Dodge unless immobilized/helpless)
    const flatDex = hasUncannyDodge ? (effectiveDex + legoAcAbilityDelta) : Math.min(0, fullDexMod);
    const flatDodge = hasUncannyDodge ? effectiveDodge : 0;
    let flatAC = baseAC + effectiveArmor + effectiveShield + effectiveNatural + effectiveDeflection + sizeBonus + flatDex + flatDodge + effectiveMiscAc + effectiveFlatFootedOnlyAc;

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
    const incorporealTouchAC = touchAC + incorporealBonus;

    character.acBreakdown = {
      armor: effectiveArmor,
      shield: effectiveShield,
      natural: effectiveNatural,
      deflection: effectiveDeflection,
      size: sizeBonus,
      baseSize: baseSizeMod,
      dodge: effectiveDodge,
      misc: effectiveMiscAc,
      effectiveDex: effectiveDex,
      maxDex: effectiveMaxDex,
      armorMaxDex: minMaxDex,
      loadMaxDex,
      load: encumbrance.loadStatus.status,
      acp: effectiveAcp,
      armorAcp: totalAcp,
      loadCheckPenalty,
      penalty: totalPenalty,
      total: totalAC,
      touch: touchAC,
      incorporealTouch: incorporealTouchAC,
      incorporealTouchBonus: incorporealBonus,
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
        dodge: dodgeBonuses,
        misc: miscAcBonuses,
        size: sizeAcAdjustments
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
    if (charFeatNames.some(f => f.includes('flaw: poor reflexes') || f === 'poor reflexes') && !saveBonusBuckets.ref.some(b => (b.source || '').toLowerCase().includes('poor reflexes'))) {
      saveBonusBuckets.ref.push({ val: -2, type: 'penalty', source: 'Flaw: Poor Reflexes' });
    }

    // Battle Clarity (Warblade 1, cab-battle-clarity): Add INT modifier (max Warblade active lvl) to Reflex saves when not flat-footed
    const bcBucketEntry = saveBonusBuckets.ref.find(b => b && /battle clarity/i.test(String(b.source || '')));
    const hasV3BattleClarity = Boolean(
      bcBucketEntry ||
      (legoEval.entries || []).some(e => e && (String(e.id || '').toLowerCase() === 'cab-battle-clarity' || /battle clarity/i.test(String(e.name || ''))) && Array.isArray(e.effects) && e.effects.length > 0)
    );
    const hasProgRowsForBc = Array.isArray(character.levelProgression) && character.levelProgression.length > 0;
    const warbladeLvl = hasProgRowsForBc
      ? character.levelProgression.filter(l => l && l.active !== false && (l.className || l.class || '').toLowerCase().includes('warblade')).length
      : ((character.classes || '').toLowerCase().includes('warblade') ? (Number(evalContext.warbladeLevel) || 1) : 0);
    const hasBattleClarity = warbladeLvl > 0 || (character.specialAbilities || []).some(a => {
      const an = (typeof a === 'string' ? a : (a?.name || '')).toLowerCase();
      return an.includes('battle clarity') && !inactiveOnlyFeatSet.has(stripFeatTag(an));
    });
    const battleClarityBonus = bcBucketEntry
      ? (Number(bcBucketEntry.val) || 0)
      : ((!hasV3BattleClarity && hasBattleClarity && !conditionLoseDexToAC && !conditionFlatFooted) ? Math.min(warbladeLvl, Math.max(0, intMod)) : 0);

    const netBonusFort = this.resolveBonusStacking(saveBonusBuckets.fort, character);
    const netBonusRef = this.resolveBonusStacking(saveBonusBuckets.ref, character) + (bcBucketEntry || hasV3BattleClarity ? 0 : battleClarityBonus);
    const netBonusWill = this.resolveBonusStacking(saveBonusBuckets.will, character);

    if (character.ruleFlags?.conToWillSave) {
      hasSteadfastDetermination = true;
    }

    const hasLegoSaveAbiMod = (saveKey) => (legoEval.entries || []).some(e =>
      (e.modifiers || []).concat((e.modes || []).filter(m => m && (m.actionType === 'passive' || m.isPassive)).flatMap(m => m.modifiers || []))
        .some(m => m && String(m.target || '').toLowerCase() === `save.${saveKey}.abilitymod` && (!m.scope || m.scope === 'all' || m.scope === 'not_flat_footed' || m.scope === 'light_or_no_armor'))
    );

    const mindAffectingWillSwaps = ((legoEval?.replacements && legoEval.replacements['save.will.abilityMod']) || []).filter(c => c && c.scope === 'mind_affecting');
    mindAffectingWillSwaps.forEach(c => {
      const delta = c.op === 'add' ? c.value : (c.op === 'replace' ? (c.value - wisMod) : Math.max(0, c.value - wisMod));
      if (delta !== 0) {
        conditionalSaveBonuses.push({ save: 'Will', val: delta, type: 'Untyped', condition: 'vs. Mind-Affecting', source: c.source });
      }
    });

    const fortStatMod = (hasLegoSaveAbiMod('fort') && legoEval.saves?.abilityMods?.fort !== undefined)
      ? legoEval.saves.abilityMods.fort
      : conMod;
    const refStatMod = (hasLegoSaveAbiMod('ref') && legoEval.saves?.abilityMods?.ref !== undefined)
      ? legoEval.saves.abilityMods.ref
      : dexMod;
    const willStatMod = (hasLegoSaveAbiMod('will') && legoEval.saves?.abilityMods?.will !== undefined)
      ? legoEval.saves.abilityMods.will
      : (hasSteadfastDetermination ? conMod : wisMod);
    const willSwapRes = this.resolveSwapSlot(legoEval?.replacements, 'save.will.abilityMod', wisMod, 'WIS', { character });
    const resolvedWillAbilityKey = (willSwapRes.winningToStat && /^[a-z]{3}$/i.test(willSwapRes.winningToStat))
      ? willSwapRes.winningToStat.toLowerCase()
      : (hasSteadfastDetermination ? 'con' : 'wis');

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
      willAbility: resolvedWillAbilityKey.toUpperCase(),
      willAbilityMod: willStatMod
    };

    if (!character.isNpc) {
      if (!character.saves || typeof character.saves !== 'object') character.saves = {};
      character.saves.fort = { ...(character.saves.fort || {}), base: baseFort, ability: fortStatMod, magic: resistBonus, misc: netBonusFort - resistBonus, total: finalFort };
      character.saves.ref = { ...(character.saves.ref || {}), base: baseRef, ability: refStatMod, magic: resistBonus, misc: netBonusRef - resistBonus, total: finalRef };
      character.saves.will = { ...(character.saves.will || {}), base: baseWill, ability: willStatMod, abilityKey: resolvedWillAbilityKey, magic: resistBonus, misc: netBonusWill - resistBonus, total: finalWill };
    } else if (character.saves) {
      if (character.saves.fort?.total !== undefined) character.evaluatedSaves.fort = character.saves.fort.total;
      if (character.saves.ref?.total !== undefined) character.evaluatedSaves.ref = character.saves.ref.total;
      if (character.saves.will?.total !== undefined) character.evaluatedSaves.will = character.saves.will.total;
    }

    // 7. Resolve Effective Speed (RAW D&D 3.5e Table 8-2: Armor and Speed + Condition Half-Speed)
    const baseSpeed = character.baseSpeed || 30;
    // Steady Speed (dwarves, duergar) is the `ignoreArmorSpeedPenalty` rule switch on the Race record.
    const preRuleFlagsForSpeed = this.evaluateRuleFlags(character);
    let armorSpeedPenalty = 0;
    if (!preRuleFlagsForSpeed.ignoreArmorSpeedPenalty && (equippedArmorCategory === 'Medium' || equippedArmorCategory === 'Heavy')) {
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
    character.burrowSpeed = burrowSpeed;
    character.bonusPowerPoints = bonusPowerPoints;
    character.bonusSpellSlotsByLevel = bonusSpellSlotsByLevel;
    character.conditionalSaveBonuses = conditionalSaveBonuses;
    character.effectiveArmorCategory = equippedArmorCategory;
    character.buffSkillBonus = buffSkillBonus;
    character.buffInitiativeBonus = this.resolveBonusStacking(initBonusBuckets);
    character.initiativeBreakdown = initBonusBuckets;

    // 8. Resolve Rule Flags & Action Economy
    character.ruleFlags = this.evaluateRuleFlags(character);
    const stackedGrappleMod = this.resolveBonusStacking(grappleBonusBuckets);
    if (stackedGrappleMod > grappleModBonus) grappleModBonus = stackedGrappleMod;
    if (grappleModBonus > (character.ruleFlags?.opposedCheckBonus?.grapple || 0)) {
      if (!character.ruleFlags.opposedCheckBonus) character.ruleFlags.opposedCheckBonus = {};
      character.ruleFlags.opposedCheckBonus.grapple = grappleModBonus;
    }
    // Grapple check (PHB p.155-156): BAB + Str modifier + special size modifier of the current size category
    // (the size category whose Table 8-1 modifier equals the AC size modifier after size-change effects).
    const grappleSizeKey = Object.keys(this.SIZE_MODIFIERS).find(k => this.SIZE_MODIFIERS[k] === sizeBonus) || this.getSizeCategoryKey(character);
    const grappleSizeMod = grappleSizeKey ? this.GRAPPLE_SIZE_MODIFIERS[grappleSizeKey] : 0;
    const babSwapForGrapple = this.resolveSwapSlot(legoEval?.replacements, 'bab', Number(character.bab) || 0, 'BAB', { character });
    if (babSwapForGrapple.changed) {
      character.bab = babSwapForGrapple.value + babSwapForGrapple.addItems.reduce((s, x) => s + x.val, 0);
    }
    const grappleStrDefault = this.getAbilityMod(character.abilities?.str || 10);
    const grappleAbiSwap = this.resolveSwapSlot(legoEval?.replacements, 'grapple.abilityMod', grappleStrDefault, 'STR', { character });
    const effGrappleAbiMod = grappleAbiSwap.value + grappleAbiSwap.addItems.reduce((s, x) => s + x.val, 0);
    const activeRulesetForGrapple = this.getActiveRuleset(character);
    character.grappleBonus = (activeRulesetForGrapple && typeof activeRulesetForGrapple.calcGrapple === 'function')
      ? activeRulesetForGrapple.calcGrapple(character.bab, effGrappleAbiMod, grappleSizeMod, character.ruleFlags?.opposedCheckBonus?.grapple || 0)
      : ((Number(character.bab) || 0) + effGrappleAbiMod + grappleSizeMod + (character.ruleFlags?.opposedCheckBonus?.grapple || 0));
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
    const activeFeatAndAbilityPool = [...(character.feats || []), ...(character.specialAbilities || []), ...progFeats]
      .filter(f => f && (typeof f !== 'object' || f.active !== false));
    const feats = activeFeatAndAbilityPool
      .map(f => (typeof f === 'string' ? f : f?.name || '').toLowerCase());
    const hasAgileShield = feats.some(f => f.includes('agile shield fighter'));

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
      hasSteadfastDetermination: false,
      conToWillSave: false,
      noAutoFailFortSaveOnNat1: false,
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

    if (character.ruleFlags && typeof character.ruleFlags === 'object') {
      mergeFlags(character.ruleFlags);
    }

    // Merge declarative ruleFlags from character feats, abilities, progression & Compendium entries
    activeFeatAndAbilityPool.forEach(f => {
      if (typeof f === 'object' && f && f.ruleFlags) mergeFlags(f.ruleFlags);
      const rawRef = typeof f === 'string'
        ? f.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨\s]+(\[.*?\])?\s*/, '').trim()
        : f;
      const dbFeat = this.getMasterDbEntry(rawRef, 'Feat');
      if (dbFeat && dbFeat.ruleFlags) mergeFlags(dbFeat.ruleFlags);
    });
    if (character.legoEvaluation && Array.isArray(character.legoEvaluation.entries)) {
      character.legoEvaluation.entries.forEach(le => {
        if (le && le.ruleFlags) mergeFlags(le.ruleFlags);
      });
    }
    // Race record rule switches (e.g. Steady Speed `ignoreArmorSpeedPenalty`); the race is applied through
    // its bridged entry (section 3.9 of recalculateCharacter), not as a Lego entry.
    if (character.race) {
      const raceFlagEntry = this.getMasterDbEntry(character.race, 'Race');
      if (raceFlagEntry && raceFlagEntry.ruleFlags) mergeFlags(raceFlagEntry.ruleFlags);
    }
    if (flags.naturalSpell) flags.castInWildShape = true;

    if (flags.conToWillSave || flags.noAutoFailFortSaveOnNat1 || flags.hasSteadfastDetermination) {
      flags.hasSteadfastDetermination = true;
      flags.conToWillSave = Boolean(flags.conToWillSave || flags.hasSteadfastDetermination);
      flags.noAutoFailFortSaveOnNat1 = Boolean(flags.noAutoFailFortSaveOnNat1 || flags.hasSteadfastDetermination);
    }

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
    const isLance = wepName.includes('lance') || wepTags.includes('lance');

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
        size: bd.size || 0,
        misc: bd.misc || 0,
        penalty: bd.penalty ? -Math.abs(bd.penalty) : 0
      }
    };
  },

  /**
   * Shield Block (ToB p.60, Devoted Spirit 2 counter): grants an ADJACENT ALLY a shield bonus to AC equal to
   * your shield's AC bonus + 4 against one attack. It never changes the initiator's own AC.
   * Reads the equipped off-hand shield's entry from the already-computed `acBreakdown.sources.shield`.
   */
  getShieldBlockAllyBonus(character) {
    const oh = character && character.bodySlots ? character.bodySlots.offHand : null;
    const hasShield = Boolean(oh && oh.active !== false && oh.name && oh.name !== '-' && this.isShieldItem(oh));
    const shieldSources = (character && character.acBreakdown && character.acBreakdown.sources && Array.isArray(character.acBreakdown.sources.shield))
      ? character.acBreakdown.sources.shield
      : [];
    const entry = hasShield ? shieldSources.find(s => s && s.type === 'Shield' && s.source === oh.name) : null;
    const shieldBonus = entry ? (Number(entry.val) || 0) : 0;
    return { hasShield, shieldName: hasShield ? oh.name : null, shieldBonus, total: shieldBonus + 4 };
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
    this._activeCharacter = character;
    this._activeCustomEntries = (character.customEntries && typeof character.customEntries === 'object')
      ? character.customEntries
      : null;

    // 0. Ensure Weapon is Canonical V2 & Resolve Active Embedded Mode
    const v2Weapon = this.ensureV2Entry(rawWeapon);
    const dbWeapon = this.getMasterDbEntry(v2Weapon, 'Weapon');
    const modes = Array.isArray(v2Weapon.modes) && v2Weapon.modes.length > 0
      ? v2Weapon.modes
      : (dbWeapon && Array.isArray(dbWeapon.modes) ? dbWeapon.modes : []);

    const weaponIdKey = v2Weapon.id || v2Weapon.baseItemId || v2Weapon.name;
    const charActiveModeKey = (character.activeModes && weaponIdKey && character.activeModes[weaponIdKey] !== undefined)
      ? character.activeModes[weaponIdKey]
      : undefined;
    const activeModeId = options.modeId !== undefined
      ? options.modeId
      : (charActiveModeKey !== undefined ? charActiveModeKey : v2Weapon.activeModeId);
    let activeMode = null;
    if (activeModeId !== undefined && activeModeId !== null && modes.length > 0) {
      if (typeof activeModeId === 'number' && modes[activeModeId]) {
        activeMode = modes[activeModeId];
      } else if (/^\d+$/.test(String(activeModeId)) && modes[Number(activeModeId)]) {
        activeMode = modes[Number(activeModeId)];
      } else {
        activeMode = modes.find(m => m && (m.id === activeModeId || m.name === activeModeId)) || null;
      }
    }

    const alreadyEvaluatedSameMode = Boolean(v2Weapon.activeMode && activeMode && (v2Weapon.activeMode === activeMode || (v2Weapon.activeMode.id && v2Weapon.activeMode.id === activeMode.id)));
    let activeModeV3 = null;
    if (activeMode && !alreadyEvaluatedSameMode && (Array.isArray(activeMode.blocks) || Array.isArray(activeMode.effects))) {
      activeModeV3 = this.evaluateV3Entry({ ...activeMode, schemaVersion: 3, _customOverrideApplied: true }, { character, level: Number(character.level) || 1 });
    }

    const dbEvWeapon = dbWeapon ? this.ensureV2Entry(dbWeapon, { character }) : null;
    const basePrimaryParts = (dbEvWeapon && Array.isArray(dbEvWeapon.damageParts) && dbEvWeapon.damageParts.length > 0)
      ? dbEvWeapon.damageParts
      : [{ dice: v2Weapon.weapon?.damageDice || v2Weapon.dice || dbWeapon?.weapon?.damageDice || dbWeapon?.dice || '1d8', bonus: 0, type: v2Weapon.weapon?.dmgType || v2Weapon.dmgType || dbWeapon?.weapon?.dmgType || dbWeapon?.dmgType || 'Slashing', multiplyOnCrit: true, onCritOnly: false, source: 'Base Weapon' }];
    const hasBasePrimaryInV2 = Array.isArray(v2Weapon.damageParts) && v2Weapon.damageParts.some(p => p && (p.source === 'Base Weapon' || p.multiplyOnCrit === true));
    const mergedV2DamageParts = (Array.isArray(v2Weapon.damageParts) && v2Weapon.damageParts.length > 0)
      ? (hasBasePrimaryInV2 ? v2Weapon.damageParts : [...basePrimaryParts, ...v2Weapon.damageParts])
      : basePrimaryParts;

    const modeBaseDice = activeMode ? (activeMode.weapon?.damageDice || activeMode.damageDice || null) : null;
    const modeBaseType = activeMode ? (activeMode.weapon?.dmgType || activeMode.dmgType || v2Weapon.dmgType || 'Physical') : null;
    const modeReplacedPrimary = modeBaseDice
      ? [
          { dice: modeBaseDice, bonus: 0, type: modeBaseType, multiplyOnCrit: true, onCritOnly: false, source: activeMode.label || activeMode.name || 'Base Weapon' },
          ...(activeModeV3 && Array.isArray(activeModeV3.damageParts) ? activeModeV3.damageParts : [])
        ]
      : null;

    // Effective weapon merges active mode overrides onto parent evaluated weapon
    const weapon = activeMode ? {
      ...v2Weapon,
      grip: activeMode.grip || v2Weapon.grip,
      isRanged: activeMode.isRanged !== undefined ? activeMode.isRanged : v2Weapon.isRanged,
      range: activeMode.range !== undefined ? activeMode.range : v2Weapon.range,
      damageParts: modeReplacedPrimary
        ? modeReplacedPrimary
        : ((Array.isArray(activeMode.damageParts) && activeMode.damageParts.length > 0)
            ? activeMode.damageParts
            : (activeModeV3 && Array.isArray(activeModeV3.damageParts) && activeModeV3.damageParts.length > 0
                ? [...mergedV2DamageParts, ...activeModeV3.damageParts]
                : mergedV2DamageParts)),
      modifiers: alreadyEvaluatedSameMode
        ? (Array.isArray(v2Weapon.modifiers) ? v2Weapon.modifiers : [])
        : [
            ...(Array.isArray(v2Weapon.modifiers) ? v2Weapon.modifiers : []),
            ...(Array.isArray(activeMode.modifiers) ? activeMode.modifiers : []),
            ...(activeModeV3 && Array.isArray(activeModeV3.modifiers) ? activeModeV3.modifiers : [])
          ],
      tacticalBadges: [
        ...(Array.isArray(v2Weapon.tacticalBadges) ? v2Weapon.tacticalBadges : []),
        ...(Array.isArray(activeMode.tacticalBadges) ? activeMode.tacticalBadges : []),
        ...(activeModeV3 && Array.isArray(activeModeV3.tacticalBadges) ? activeModeV3.tacticalBadges : [])
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
    const conMod = this.getAbilityMod(character.abilities?.con || 10);
    const intMod = this.getAbilityMod(character.abilities?.int || 10);
    const wisMod = this.getAbilityMod(character.abilities?.wis || 10);
    const chaMod = this.getAbilityMod(character.abilities?.cha || 10);
    const evalCtx = {
      cl: charLvl,
      level: charLvl,
      bab,
      strMod,
      dexMod,
      conMod,
      intMod,
      wisMod,
      chaMod,
      enhancement: Number(weapon.enhancementBonus) || 0
    };

    const houseRules = options.houseRules || character?.houseRules || {};
    const critData = this.evaluateCritThreatRange(weapon, character, houseRules);
    const chargeData = this.evaluateChargeDamage(weapon, character, options);
    const ruleFlags = this.evaluateRuleFlags(character);

    // Feat detections (match via canonical baseItemId, SRD weapon record, or normalized weapon name)
    const baseWepName = (weapon.baseItemId || weapon.name || '').toLowerCase().replace(/^(?:srd[-_])?(?:wpn|wep)[-_]/i, '').replace(/[-_]+/g, ' ').replace(/\+\d+/g, '').replace(/\(.*?\)/g, '').trim();
    const expandWeaponIdentityKeys = (rawStr, stripDecorators = false) => {
      const out = new Set();
      let s = String(rawStr || '').toLowerCase().trim();
      if (!s) return out;
      s = s
        .replace(/^(?:srd[-_])?(?:wpn|wep)[-_](?:mic[-_])?/i, '')
        .replace(/\+\d+/g, ' ')
        .replace(/\(.*?\)/g, ' ');
      if (stripDecorators) {
        s = s.replace(/\b(?:masterwork|mwk|mithral|adamantine|cold\s+iron|alchemical\s+silver|darkwood|keen|flaming\s+burst|icy\s+burst|shocking\s+burst|flaming|frost|shock|corrosive|holy|unholy|anarchic|axiomatic|vorpal|ghost\s+touch|defending|merciful|vicious|wounding|speed|brilliant\s+energy|dancing|returning|seeking|distance|thundering)\b/g, ' ');
      }
      if (s.includes(',')) {
        const parts = s.split(',').map(p => p.replace(/[^a-z0-9]+/g, ' ').trim()).filter(Boolean);
        if (parts.length === 2) {
          const direct = `${parts[0]} ${parts[1]}`.replace(/\s+/g, ' ').trim();
          const inv = `${parts[1]} ${parts[0]}`.replace(/\s+/g, ' ').trim();
          out.add(direct);
          out.add(inv);
          out.add(direct.replace(/\s+/g, ''));
          out.add(inv.replace(/\s+/g, ''));
        }
      }
      const cleanWords = s.replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
      if (cleanWords.length > 0) {
        const joined = cleanWords.join(' ');
        out.add(joined);
        out.add(cleanWords.join(''));
        if (cleanWords.length === 2) {
          const inv = `${cleanWords[1]} ${cleanWords[0]}`;
          out.add(inv);
          out.add(`${cleanWords[1]}${cleanWords[0]}`);
        }
      }
      return out;
    };

    const weaponIdentityKeys = new Set();
    const addWepKeys = (val, stripDec = false) => {
      expandWeaponIdentityKeys(val, stripDec).forEach(k => weaponIdentityKeys.add(k));
    };
    if (weapon.baseItemId) addWepKeys(weapon.baseItemId, false);
    if (dbWeapon?.id) addWepKeys(dbWeapon.id, false);
    if (dbWeapon?.name) addWepKeys(dbWeapon.name, false);
    if (weapon.id && /^(?:srd[-_])?(?:wpn|wep)[-_]/i.test(String(weapon.id))) addWepKeys(weapon.id, false);
    if (weapon.name) addWepKeys(weapon.name, true);

    const activeFeatEntries = (character.feats || []).filter(f => f && (typeof f !== 'object' || f.active !== false));
    const feats = activeFeatEntries.map(f => (typeof f === 'string' ? f : f.name || '').toLowerCase());
    const matchesWeaponSpecificFeat = (featBaseName, excludePrefix = null) => {
      const baseLower = featBaseName.toLowerCase();
      const idSlugPrefix = `feat-${baseLower.replace(/\s+/g, '-')}`;
      return activeFeatEntries.some(f => {
        const rawName = (typeof f === 'string' ? f : f.name || '').toLowerCase();
        const fId = (typeof f === 'object' && f.id ? String(f.id) : '').toLowerCase();
        if (excludePrefix && (rawName.includes(excludePrefix) || fId.includes(excludePrefix.replace(/\s+/g, '-')))) return false;
        const isFeatMatch = rawName.includes(baseLower) || fId === idSlugPrefix || fId.startsWith(`${idSlugPrefix}-`);
        if (!isFeatMatch) return false;
        const rawChoices = [];
        if (typeof f === 'object') {
          [f.targetWeaponId, f.weaponId, f.targetWeapon, f.selectedWeapon, f.choice, f.subChoice, f.target].forEach(c => {
            if (c && typeof c === 'string') rawChoices.push(c);
          });
          if (fId.startsWith(`${idSlugPrefix}-`)) {
            rawChoices.push(fId.slice(idSlugPrefix.length + 1));
          }
        }
        const parenMatch = rawName.match(/\(([^)]+)\)/);
        if (parenMatch && parenMatch[1]) {
          rawChoices.push(parenMatch[1]);
        } else {
          const afterBase = rawName.split(baseLower)[1] || '';
          const trimmedAfter = afterBase.replace(/^[\s:\-]+/, '').trim();
          if (trimmedAfter) rawChoices.push(trimmedAfter);
        }
        if (rawChoices.some(c => String(c).toLowerCase().trim() === 'all')) return true;
        return rawChoices.some(choiceStr => {
          const choiceKeys = expandWeaponIdentityKeys(choiceStr, false);
          for (const ck of choiceKeys) {
            if (ck && weaponIdentityKeys.has(ck)) return true;
          }
          return false;
        });
      });
    };
    const hasWeaponFinesse = Boolean(ruleFlags.weaponFinesse || feats.some(f => f.includes('weapon finesse')));
    const hasShadowBlade = Boolean(ruleFlags.shadowBlade || feats.some(f => f.includes('shadow blade')));
    const hasWeaponFocus = matchesWeaponSpecificFeat('weapon focus', 'greater weapon focus');
    const hasGreaterWeaponFocus = matchesWeaponSpecificFeat('greater weapon focus');
    const hasWeaponSpec = matchesWeaponSpecificFeat('weapon specialization', 'greater weapon specialization');
    const hasGreaterWeaponSpec = matchesWeaponSpecificFeat('greater weapon specialization');

    const isRangedWep = grip === 'Ranged' || weapon.isRanged || (Array.isArray(weapon.tags) && weapon.tags.includes('ranged')) || (weapon.weaponStats && weapon.weaponStats.category === 'Ranged');

    // 1. Attack Stat Calculation (D&D 3.5e Baseline + Parametric V3 A -> B Stat Swaps)
    const wepLegoReplacements = (character && character.legoEvaluation && character.legoEvaluation.replacements)
      ? character.legoEvaluation.replacements
      : ((character ? this.evaluateLegoCharacter(character)?.replacements : null) || {});
    const isThrownWep = this.isThrownWeapon(weapon);
    const isCrossbowEarly = baseWepName.includes('crossbow');
    const isBowEarly = baseWepName.includes('bow') && !isCrossbowEarly;
    const isTouchAtkWep = Boolean(weapon.isTouch || weapon.touchAttack || weapon.ruleFlags?.touchAttack);
    const isShadowStanceEarly = (activeStance.toLowerCase().includes('shadow') || activeStance.toLowerCase().includes('island of blades') || activeStance.toLowerCase().includes('child of shadow') || activeStance.toLowerCase().includes('assassin'));
    const wepSwapScopeCtx = {
      character,
      weapon,
      isRangedWep,
      isThrownWep,
      isBow: isBowEarly,
      isCrossbow: isCrossbowEarly,
      isShadowStance: isShadowStanceEarly
    };

    const babSwapWep = this.resolveSwapSlot(wepLegoReplacements, 'bab', bab, 'BAB', wepSwapScopeCtx);
    if (babSwapWep.changed) {
      bab = babSwapWep.value + babSwapWep.addItems.reduce((s, x) => s + x.val, 0);
    }

    let attackStatMod = isRangedWep ? dexMod : strMod;
    let attackStatName = isRangedWep ? 'DEX (Ranged)' : 'STR';

    if (!isRangedWep && hasWeaponFinesse && this.isFinessable(weapon) && dexMod > strMod) {
      attackStatMod = dexMod;
      attackStatName = 'DEX (Weapon Finesse)';
    }

    const atkSwapSlots = [];
    if (!isRangedWep) atkSwapSlots.push('atk.melee.abilityMod');
    if (isRangedWep) atkSwapSlots.push('atk.ranged.abilityMod');
    if (isRangedWep && isThrownWep) atkSwapSlots.push('atk.thrown.abilityMod');
    if (isTouchAtkWep) atkSwapSlots.push('atk.touch.abilityMod');
    const atkSwapAddItems = [];
    atkSwapSlots.forEach(slotKey => {
      const swRes = this.resolveSwapSlot(wepLegoReplacements, slotKey, attackStatMod, attackStatName, wepSwapScopeCtx);
      if (swRes.changed && swRes.value !== attackStatMod) {
        attackStatMod = swRes.value;
        attackStatName = swRes.label;
      }
      swRes.addItems.forEach(it => atkSwapAddItems.push(it));
    });

    // Power attack penalty: cannot exceed BAB
    const effectivePA = Math.min(bab, Math.max(0, Number(powerAttack) || 0));

    const attackBonusItems = [
      { type: 'untyped', val: bab, source: 'BAB' },
      { type: 'untyped', val: attackStatMod, source: attackStatName },
      { type: 'untyped', val: -effectivePA, source: 'Power Attack Penalty' }
    ];
    atkSwapAddItems.forEach(it => {
      attackBonusItems.push({ type: 'untyped', val: it.val, source: it.source });
    });

    // Size modifier on attack rolls (PHB p.134, Table 8-1) from the size category. Size-change effects (Enlarge / Reduce Person)
    // carry their own size-typed attack modifier, so this base value is untyped and stacks with them.
    const baseSizeAtkMod = this.getBaseSizeModifier(character);
    if (baseSizeAtkMod !== 0) {
      attackBonusItems.push({ type: 'untyped', val: baseSizeAtkMod, source: 'Size Modifier' });
    }

    // Combat Expertise penalty (cannot exceed BAB and cannot exceed 5 per RAW D&D 3.5e).
    // PHB p.92: it applies only to melee attacks (attack or full attack action in melee).
    const maxAllowedCE = Math.min(5, bab);
    const combatExpertise = isRangedWep ? 0 : Math.min(maxAllowedCE, Math.max(0, Number(options.combatExpertise !== undefined ? options.combatExpertise : (character.tactical?.combatExpertise || 0))));
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
    const hasMonkeyGrip = Boolean(ruleFlags.monkeyGrip || feats.some(f => f.includes('monkey grip')));
    const isOversizedWeapon = weapon.isOversized || weapon.oversized || (Array.isArray(weapon.tags) && weapon.tags.includes('oversized'));
    if (isOversizedWeapon && hasMonkeyGrip) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Monkey Grip (-2 Att)' });
    }

    // Manyshot penalty: 2 arrows -> -2, 3 arrows -> -4, 4 arrows -> -6
    const effectiveManyshotArrows = isRangedWep && manyshot ? Math.min(4, Math.max(2, Number(optManyshotArrows || manyshot) || 2)) : 0;
    if (effectiveManyshotArrows > 0) {
      const penalty = (effectiveManyshotArrows - 1) * 2;
      attackBonusItems.push({ type: 'untyped', val: -penalty, source: `Manyshot (${effectiveManyshotArrows} Ok / -${penalty} Atk)` });
    }

    const isUnarmedWep = /unarmed|flurry/i.test(String(weapon.name || '') + ' ' + String(weapon.baseItemId || ''));
    const isNaturalWep = Boolean(weapon.isNatural || /claw|bite|gore|slam|tentacle|tail|wing|talon|sting|natural/i.test(String(weapon.category || '') + ' ' + String(weapon.type || '')));
    const critConfirmItems = [];
    const isAtkTargetMatch = (t) => (
      t === 'attack' || t === 'attack.all' || t === 'attack.weapon' || t === 'atk' || t === 'atk.all' || t === 'atk.weapon' ||
      ((t === 'meleeattack' || t === 'attack.melee' || t === 'atk.melee') && !isRangedWep) ||
      ((t === 'rangedattack' || t === 'attack.ranged' || t === 'atk.ranged') && isRangedWep) ||
      ((t === 'attack.natural' || t === 'atk.natural') && (isNaturalWep || isUnarmedWep)) ||
      ((t === 'attack.unarmed' || t === 'atk.unarmed') && isUnarmedWep)
    );
    const isCritConfirmTargetMatch = (t) => (
      t === 'attack.critconfirm' || t === 'atk.critconfirm' || t === 'critconfirm'
    );
    const isDmgTargetMatch = (t) => (
      t === 'damage' || t === 'damage.all' || t === 'damage.weapon' || t === 'dmg' || t === 'dmg.all' || t === 'dmg.weapon' ||
      ((t === 'meleedamage' || t === 'damage.melee' || t === 'dmg.melee') && !isRangedWep) ||
      ((t === 'rangeddamage' || t === 'damage.ranged' || t === 'dmg.ranged') && isRangedWep) ||
      ((t === 'damage.natural' || t === 'dmg.natural') && (isNaturalWep || isUnarmedWep)) ||
      ((t === 'damage.unarmed' || t === 'dmg.unarmed') && isUnarmedWep)
    );
    const evalModExpr = (mObj, ctxObj) => {
      const hasFormula = mObj.formula !== undefined && mObj.formula !== null && String(mObj.formula).trim() !== '';
      if (hasFormula) {
        const fVal = Number(this.evaluateFormula(mObj.formula, ctxObj));
        return Number.isFinite(fVal) ? fVal : (Number(mObj.value) || 0);
      }
      return Number(mObj.value) || 0;
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
      } else if (isCritConfirmTargetMatch(t)) {
        const val = evalModExpr(m, evalCtx);
        if (val !== 0) {
          critConfirmItems.push({ type: (m.type || 'untyped').toLowerCase(), val, source: m.source || 'Weapon' });
        }
      }
    });
    if (!hasExplicitWepAtkMod && Number(weapon.enhancementBonus) > 0) {
      attackBonusItems.push({ type: 'enhancement', val: Number(weapon.enhancementBonus), source: 'Weapon Enhancement' });
    } else if (!hasExplicitWepAtkMod && (weapon.isMasterwork || weapon.masterwork || weapon.weapon?.masterwork)) {
      attackBonusItems.push({ type: 'enhancement', val: 1, source: 'Masterwork' });
    }

    const hasV3WeaponFeatDef = (featId) => {
      const dbF = this.getMasterDbEntry(featId, 'Feat');
      return Boolean(dbF && Array.isArray(dbF.effects) && dbF.effects.length > 0);
    };
    if (hasWeaponFocus && !hasV3WeaponFeatDef('feat-weapon-focus')) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Weapon Focus' });
    }
    if (hasGreaterWeaponFocus && !hasV3WeaponFeatDef('feat-greater-weapon-focus')) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Greater Weapon Focus' });
    }

    // Character Special Abilities, Feats & Active Subsystems V2/V3 Attack/Damage Modifiers
    const isLightOrFinessableForAbility = this.isLightWeapon(weapon) || this.isFinessable(weapon);
    const effArmorCatForAbility = character.effectiveArmorCategory || character.acBreakdown?.armorCategory || 'None';
    const isLightOrNoArmor = effArmorCatForAbility !== 'Medium' && effArmorCatForAbility !== 'Heavy';
    const explicitLoadCat = String(character.encumbrance || character.loadCategory || character.carryingLoad || '').toLowerCase();
    const computedLoadStatus = String(this.computeEncumbrance(character)?.loadStatus?.status || character.acBreakdown?.load || '').toLowerCase();
    const isMediumOrHeavyLoad =
      explicitLoadCat.includes('medium') || explicitLoadCat.includes('heavy') || explicitLoadCat.includes('overloaded') ||
      computedLoadStatus.includes('medium') || computedLoadStatus.includes('heavy') || computedLoadStatus.includes('overloaded') ||
      Boolean(character.ruleFlags?.mediumOrHeavyLoad);
    const wfWsFeatIds = ['feat-weapon-focus', 'feat-greater-weapon-focus', 'feat-weapon-specialization', 'feat-greater-weapon-specialization'];
    const rawSoulmeldsForWep = Array.isArray(character.incarnum?.soulmelds) ? character.incarnum.soulmelds : (Array.isArray(character.soulmelds) ? character.soulmelds : []);
    const rawVestigesForWep = Array.isArray(character.pactMagic?.vestiges) ? character.pactMagic.vestiges : (Array.isArray(character.vestiges) ? character.vestiges : []);
    const rawPowersForWep = Array.isArray(character.psionics?.powers) ? character.psionics.powers : (Array.isArray(character.powers) ? character.powers : []);
    const rawMysteriesForWep = Array.isArray(character.shadowMagic?.mysteries) ? character.shadowMagic.mysteries : (Array.isArray(character.mysteries) ? character.mysteries : []);
    const rawUtterancesForWep = Array.isArray(character.truenaming?.utterances) ? character.truenaming.utterances : (Array.isArray(character.utterances) ? character.utterances : []);
    const resolveSubsystemEntryForWep = (rawSub, category, defaultActive = false) => {
      if (!rawSub) return null;
      const obj = typeof rawSub === 'string' ? { id: rawSub, name: rawSub, active: defaultActive } : rawSub;
      if (obj.active === false || obj.shaped === false || obj.bound === false) return null;
      if (!defaultActive && !obj.active && !obj.isActive) return null;
      const dbSub = this.getMasterDbEntry(obj.id || obj.baseEntryId || obj.name, category);
      const merged = dbSub ? {
        ...dbSub,
        ...obj,
        blocks: Array.isArray(obj.blocks) && obj.blocks.length > 0 ? obj.blocks : dbSub.blocks,
        chakraBinds: obj.chakraBinds || dbSub.chakraBinds,
        schemaVersion: obj.schemaVersion || dbSub.schemaVersion
      } : obj;
      return this.ensureV2Entry(merged);
    };
    const activeSubsystemWepEntries = [
      ...rawSoulmeldsForWep.map(s => resolveSubsystemEntryForWep(s, 'Soulmeld', true)).filter(Boolean),
      ...rawVestigesForWep.map(v => resolveSubsystemEntryForWep(v, 'Vestige', true)).filter(Boolean),
      ...rawPowersForWep.map(p => resolveSubsystemEntryForWep(p, 'Power', false)).filter(Boolean),
      ...rawMysteriesForWep.map(m => resolveSubsystemEntryForWep(m, 'Mystery', false)).filter(Boolean),
      ...rawUtterancesForWep.map(u => resolveSubsystemEntryForWep(u, 'Utterance', false)).filter(Boolean)
    ];
    const resolveWepFeatInstance = (f) => {
      if (!f) return null;
      if (typeof f === 'object' && f.active === false) return null;
      const rawObj = typeof f === 'string' ? { name: f } : f;
      let dbFeat = this.getMasterDbEntry(f, 'Feat');
      if (!dbFeat && rawObj.id) {
        const matchedPrefix = wfWsFeatIds.find(p => String(rawObj.id).toLowerCase().startsWith(`${p}-`));
        if (matchedPrefix) dbFeat = this.getMasterDbEntry(matchedPrefix, 'Feat');
      }
      if (!dbFeat && typeof f === 'string') return null;
      const merged = Object.assign({}, dbFeat || {}, rawObj, {
        effects: (Array.isArray(rawObj.effects) && rawObj.effects.length > 0) ? rawObj.effects : dbFeat?.effects,
        choices: (Array.isArray(rawObj.choices) && rawObj.choices.length > 0) ? rawObj.choices : dbFeat?.choices
      });
      if (Array.isArray(merged.effects) && merged.effects.length > 0) {
        return this.evaluateV3Entry({ ...merged, _v3Evaluated: false, modifiers: [] }, { ...evalCtx, character });
      }
      return this.ensureV2Entry(merged);
    };
    const charAbilityAndFeatEntries = [
      ...(Array.isArray(character.specialAbilities) ? character.specialAbilities.map(sa => this.ensureV2Entry(sa)) : []),
      ...(Array.isArray(character.feats) ? character.feats.map(resolveWepFeatInstance).filter(Boolean) : []),
      ...activeSubsystemWepEntries
    ];
    const collectEntryWeaponModifiers = (isTargetMatch, outItems) => {
      charAbilityAndFeatEntries.forEach(entry => {
        if (!entry || typeof entry !== 'object' || entry.active === false) return;
        const entryMods = (Array.isArray(entry.modifiers) && entry.modifiers.length > 0)
          ? entry.modifiers
          : (this.getMasterDbEntry(entry)?.modifiers || []);
        if (!Array.isArray(entryMods) || entryMods.length === 0) return;
        const entryEvalCtx = {
          ...evalCtx,
          essentia: Number(entry.essentia ?? entry.investedEssentia ?? 0) || 0,
          augmentPP: Number(entry.augmentPP || 0) || 0
        };
        entryMods.forEach(mod => {
          if (!mod || !mod.target) return;
          const t = String(mod.target).toLowerCase();
          if (!isTargetMatch(t)) return;
          const isFinessableOrLightCond = mod.condition === 'finessable_or_light' || entry.id === 'sa-swashbuckler-insightful-strike' || entry.id === 'sa-insightful-strike' || /insightful strike/i.test(String(entry.name || '') + ' ' + String(mod.source || ''));
          if (isFinessableOrLightCond && (isRangedWep || !isLightOrFinessableForAbility || !isLightOrNoArmor || isMediumOrHeavyLoad)) return;
          const isWieldingChosenWeaponCond = mod.condition === 'wieldingChosenWeapon';
          if (isWieldingChosenWeaponCond) {
            const rawChoices = [];
            [entry.targetWeaponId, entry.weaponId, entry.targetWeapon, entry.selectedWeapon, entry.chosenOption, entry.choiceValue, entry.choice, entry.subChoice].forEach(c => {
              if (c && typeof c === 'string') rawChoices.push(c);
            });
            const eIdLow = String(entry.id || '').toLowerCase();
            wfWsFeatIds.forEach(prefix => {
              if (eIdLow.startsWith(`${prefix}-`)) rawChoices.push(eIdLow.slice(prefix.length + 1));
            });
            const eName = String(entry.name || '');
            const pm = eName.match(/\(([^)]+)\)/);
            if (pm && pm[1] && !/^(?:ex|su|sp|na|3\.0e)$/i.test(pm[1].trim())) {
              rawChoices.push(pm[1].trim());
            } else {
              const extracted = this.extractEntryChoice(entry);
              if (extracted) rawChoices.push(extracted);
            }
            const requiresExplicitChoice = (Array.isArray(entry.choices) && entry.choices.length > 0)
              || /weapon\s+focus|weapon\s+specialization|improved\s+critical|power\s+critical/i.test(eName);
            if (rawChoices.length === 0) {
              if (requiresExplicitChoice) return;
            } else if (!rawChoices.some(c => String(c).toLowerCase().trim() === 'all')) {
              const wepMatched = rawChoices.some(choiceStr => {
                const cKeys = expandWeaponIdentityKeys(choiceStr, false);
                for (const ck of cKeys) {
                  if (ck && weaponIdentityKeys.has(ck)) return true;
                }
                return false;
              });
              if (!wepMatched) return;
            }
          }
          const toggleKey = (mod.condition && typeof mod.condition === 'object' && mod.condition.toggle) ? String(mod.condition.toggle) : '';
          if (toggleKey) {
            const toggleActive = options[toggleKey] !== undefined
              ? Boolean(options[toggleKey])
              : Boolean(character.tactical?.[toggleKey] || character.activeToggles?.[toggleKey]);
            if (!toggleActive) return;
          } else if (mod.condition && !isFinessableOrLightCond && !isWieldingChosenWeaponCond) {
            return;
          }
          const rawV = evalModExpr(mod, entryEvalCtx);
          const v = isFinessableOrLightCond ? Math.max(0, rawV) : rawV;
          if (v !== 0) {
            outItems.push({ type: (mod.type || 'untyped').toLowerCase(), val: v, source: mod.source || entry.name || 'Special Ability' });
          }
        });
      });
    };
    collectEntryWeaponModifiers(isAtkTargetMatch, attackBonusItems);
    collectEntryWeaponModifiers(isCritConfirmTargetMatch, critConfirmItems);
    // Offline fallback for unresolved plain-string Noncombatant / Shaky when compendium is not loaded
    if (!isRangedWep && feats.some(f => f.includes('flaw: noncombatant') || f === 'noncombatant') && !attackBonusItems.some(b => String(b.source || '').toLowerCase().includes('noncombatant'))) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Noncombatant (-2 Melee)' });
    }
    if (isRangedWep && feats.some(f => f.includes('flaw: shaky') || f === 'shaky') && !attackBonusItems.some(b => String(b.source || '').toLowerCase().includes('shaky'))) {
      attackBonusItems.push({ type: 'untyped', val: -2, source: 'Flaw: Shaky (-2 Ranged)' });
    }
    // Flanking (PHB p.153) and Charge (PHB p.154) grant +2 on melee attack rolls only.
    if (flanking && !isRangedWep) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Flanking' });
    }
    if (charge && !isRangedWep) {
      attackBonusItems.push({ type: 'untyped', val: 2, source: 'Charge' });
    }
    if (higherGround && !isRangedWep) {
      attackBonusItems.push({ type: 'untyped', val: 1, source: 'Higher Ground' });
    }

    // External custom V3 tactical riders / modifiers
    customModifiers.forEach(rawM => {
      if (!rawM) return;
      const m = this.ensureV2Entry(rawM, { character });
      if (Array.isArray(m.modifiers) && m.modifiers.length > 0) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isAtkTargetMatch(t)) {
            const v = evalModExpr(mod, evalCtx);
            if (v !== 0) attackBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
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

    // Active Cleric Domains V3 Attack Modifiers (skipping any domain already mirrored in character.specialAbilities)
    const activeDomainsForAtk = this.getCharacterActiveDomainEntries(character);
    activeDomainsForAtk.forEach(dom => {
      if (!dom || !Array.isArray(dom.modifiers)) return;
      const domLow = String(dom.name || '').toLowerCase();
      const alreadyMirrored = Array.isArray(character.specialAbilities) && character.specialAbilities.some(a =>
        a && typeof a === 'object' && a.active !== false && (String(a.domainSource || '').toLowerCase() === domLow || String(a.name || '').toLowerCase().includes(`${domLow} domain`)) && Array.isArray(a.effects) && a.effects.length > 0
      );
      if (alreadyMirrored) return;
      dom.modifiers.forEach(mod => {
        if (!mod || !mod.target || mod.condition) return;
        const t = String(mod.target).toLowerCase();
        if (isAtkTargetMatch(t)) {
          const v = evalModExpr(mod, evalCtx);
          if (v !== 0) attackBonusItems.push({ type: mod.type || 'untyped', val: v, source: `${dom.name} Domain` });
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
          if (resolvedSpec && Array.isArray(resolvedSpec.effects) && resolvedSpec.effects.length > 0) {
            rawBuff.schemaVersion = 3;
            rawBuff.effects = resolvedSpec.effects;
            delete rawBuff.modifiers;
            const reEv = this.evaluateV3Entry({ ...rawBuff, casterLevel: bCl }, { ...evalCtx, cl: bCl, character });
            b.modifiers = reEv.modifiers;
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

    const dmgSwapSlotKey = isRangedWep ? 'dmg.ranged.abilityMod' : 'dmg.melee.abilityMod';
    const dmgSwapRes = this.resolveSwapSlot(wepLegoReplacements, dmgSwapSlotKey, baseStrDmg, strDesc, wepSwapScopeCtx);
    if (dmgSwapRes.changed && dmgSwapRes.value !== baseStrDmg) {
      baseStrDmg = dmgSwapRes.value;
      strDesc = dmgSwapRes.label;
    }

    const paDmg = effectivePA * paDamageMultiplier;

    const damageBonusItems = [
      { type: 'untyped', val: baseStrDmg, source: strDesc },
      { type: 'untyped', val: paDmg, source: `Power Attack (${paDamageMultiplier}x)` }
    ];
    let hasV3DisciplineDexAdd = false;
    dmgSwapRes.addItems.forEach(it => {
      if (String(it.toStat || '').toLowerCase() === 'dex') hasV3DisciplineDexAdd = true;
      damageBonusItems.push({ type: 'untyped', val: it.val, source: it.source });
    });

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

    if (hasWeaponSpec && !hasV3WeaponFeatDef('feat-weapon-specialization')) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Weapon Specialization' });
    }
    if (hasGreaterWeaponSpec && !hasV3WeaponFeatDef('feat-greater-weapon-specialization')) {
      damageBonusItems.push({ type: 'untyped', val: 2, source: 'Greater Weapon Specialization' });
    }

    // Character Special Abilities & Feats V2 Damage Modifiers (e.g. Swashbuckler Insightful Strike, Point Blank Shot)
    collectEntryWeaponModifiers(isDmgTargetMatch, damageBonusItems);

    // External custom V3 tactical riders / modifiers for damage
    customModifiers.forEach(rawM => {
      if (!rawM) return;
      const m = this.ensureV2Entry(rawM, { character });
      if (Array.isArray(m.modifiers) && m.modifiers.length > 0) {
        m.modifiers.forEach(mod => {
          const t = String(mod.target || '').toLowerCase();
          if (isDmgTargetMatch(t)) {
            const v = evalModExpr(mod, evalCtx);
            if (v !== 0) damageBonusItems.push({ type: mod.type || 'untyped', val: v, source: m.name });
          }
        });
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

    // Active Cleric Domains V3 Damage Modifiers (skipping any domain already mirrored in character.specialAbilities)
    const activeDomainsForDmg = this.getCharacterActiveDomainEntries(character);
    activeDomainsForDmg.forEach(dom => {
      if (!dom || !Array.isArray(dom.modifiers)) return;
      const domLow = String(dom.name || '').toLowerCase();
      const alreadyMirrored = Array.isArray(character.specialAbilities) && character.specialAbilities.some(a =>
        a && typeof a === 'object' && a.active !== false && (String(a.domainSource || '').toLowerCase() === domLow || String(a.name || '').toLowerCase().includes(`${domLow} domain`)) && Array.isArray(a.effects) && a.effects.length > 0
      );
      if (alreadyMirrored) return;
      dom.modifiers.forEach(mod => {
        if (!mod || !mod.target || mod.condition) return;
        const t = String(mod.target).toLowerCase();
        if (isDmgTargetMatch(t)) {
          const v = evalModExpr(mod, evalCtx);
          if (v !== 0) damageBonusItems.push({ type: mod.type || 'untyped', val: v, source: `${dom.name} Domain` });
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
    if (hasShadowBlade && !hasV3DisciplineDexAdd && isShadowStance && this.isShadowHandWeapon(weapon)) {
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

    // Append damageParts from active buffs & subsystems (e.g. Sneak Attack, Hunter's Mercy, Arcane Wrath, Soulmelds)
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
    activeSubsystemWepEntries.forEach(subEntry => {
      if (subEntry && Array.isArray(subEntry.damageParts) && subEntry.damageParts.length > 0) {
        subEntry.damageParts.forEach(sp => {
          if (sp && sp.dice) {
            combinedRawParts.push({
              ...sp,
              source: sp.source || subEntry.name
            });
          }
        });
      }
    });

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

    const wepRuleFlagBadges = this.formatRuleFlagBadges(
      Object.assign({}, dbWeapon?.ruleFlags || {}, weapon.ruleFlags || {}),
      weapon
    );
    const combinedTacticalBadges = Array.from(new Set([
      ...(Array.isArray(weapon.tacticalBadges) ? weapon.tacticalBadges : []),
      ...(Array.isArray(dbWeapon?.tacticalBadges) ? dbWeapon.tacticalBadges : []),
      ...wepRuleFlagBadges
    ]));
    const critConfirmBonus = this.resolveBonusStacking(critConfirmItems);

    return {
      netAttackBonus,
      critConfirmBonus,
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
      tacticalBadges: combinedTacticalBadges,
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
      // Every component considered, tagged `applied` per RAW stacking; the applied ones sum to netAttackBonus / netFlatDamage.
      attackBonusItems: this.tagAppliedBonuses(attackBonusItems),
      damageBonusItems: this.tagAppliedBonuses(damageBonusItems)
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

  // Calculate load status given current weight and STR (PHB Table 9-2)
  getLoadStatus(currentWeight, strScore, charObj = null) {
    const caps = this.getCarryingCapacity(strScore, charObj);
    const wt = Number(currentWeight) || 0;
    if (wt <= caps.light) return { status: 'Light Load', color: 'emerald', maxDex: null, checkPenalty: 0, speed30: 30, speed20: 20 };
    if (wt <= caps.medium) return { status: 'Medium Load', color: 'amber', maxDex: 3, checkPenalty: -3, speed30: 20, speed20: 15 };
    if (wt <= caps.heavy) return { status: 'Heavy Load', color: 'orange', maxDex: 1, checkPenalty: -6, speed30: 20, speed20: 15 };
    return { status: 'Overloaded (Max Load Exceeded)', color: 'rose', maxDex: 0, checkPenalty: -10, speed30: 5, speed20: 5 };
  },

  /**
   * Pure encumbrance derivation (PHB p.161-162, Tables 9-1 / 9-2): the single source of truth for the
   * carried weight, carrying capacity and load used by both the AC (load Max Dex) and the inventory view.
   * Worn / held body-slot items count when active; gear-pool items count unless they are the equipped copy.
   */
  computeEncumbrance(w) {
    const src = (w && typeof w === 'object') ? w : {};
    const charObj = (w && typeof w === 'object') ? w : null;
    const strScore = Number(src.abilities?.str) || 10;
    const capacities = this.getCarryingCapacity(strScore, charObj);
    const rawSlots = src.bodySlots || {};
    const equippedNames = new Set();
    let equippedWeight = 0;
    this.INVENTORY_SLOT_DEFS.forEach((def) => {
      const slot = rawSlots[def.key] || (def.alias ? rawSlots[def.alias] : null) || null;
      if (!slot || !slot.name || slot.name === '-') return;
      if (slot.active !== false) {
        equippedWeight += Number(slot.weight ?? slot.weightLb) || 0;
      }
      const cleanSlotName = String(slot.name).toLowerCase().trim();
      if (cleanSlotName) equippedNames.add(cleanSlotName);
    });
    let poolWeight = 0;
    (Array.isArray(src.gearPool) ? src.gearPool : []).forEach((item) => {
      if (!item) return;
      const isEquipped = Boolean(item.isEquipped || equippedNames.has(String(item.name || '').toLowerCase().trim()));
      if (isEquipped) return;
      const qty = (item.qty !== undefined && item.qty !== null) ? Math.max(0, Number(item.qty)) : 1;
      poolWeight += (Number(item.weight ?? item.weightLb) || 0) * qty;
    });
    const totalWeight = Math.round((equippedWeight + poolWeight) * 10) / 10;
    return {
      equippedWeight: Math.round(equippedWeight * 10) / 10,
      poolWeight: Math.round(poolWeight * 10) / 10,
      totalWeight,
      strScore,
      capacities,
      loadStatus: this.getLoadStatus(totalWeight, strScore, charObj),
      barPct: Math.min(100, Math.round((totalWeight / Math.max(1, capacities.heavy)) * 100))
    };
  },

  // PHB Table 8-1 size modifier (attack rolls and AC) and PHB p.156 special size modifier (grapple checks)
  SIZE_MODIFIERS: { fine: 8, diminutive: 4, tiny: 2, small: 1, medium: 0, large: -1, huge: -2, gargantuan: -4, colossal: -8 },
  GRAPPLE_SIZE_MODIFIERS: { fine: -16, diminutive: -12, tiny: -8, small: -4, medium: 0, large: 4, huge: 8, gargantuan: 12, colossal: 16 },

  // Size category key ('small', 'large', ...) from character.size, or null when it names no PHB size
  getSizeCategoryKey(character) {
    const key = String(character?.size || '').trim().toLowerCase().split(/[\s(]/)[0];
    return Object.prototype.hasOwnProperty.call(this.SIZE_MODIFIERS, key) ? key : null;
  },

  // Base size modifier from the creature's size category (before size-change effects such as Enlarge Person).
  // A character without a size falls back to the size modifier stored on its last AC breakdown.
  getBaseSizeModifier(character) {
    const key = this.getSizeCategoryKey(character);
    if (key) return this.SIZE_MODIFIERS[key];
    return Number(character?.acBreakdown?.baseSize ?? character?.acBreakdown?.size) || 0;
  },

  // Canonical Consolidated Skill Mappings (Bridge between RAW 3.5e skills and Consolidated groups)
  DEFAULT_SKILL_MAPPING: {
    "stealth": ["hide", "move_silently", "move silently", "movesilently"],
    "perception": ["spot", "listen", "search"],
    "athletics": ["climb", "jump", "swim"],
    "acrobatics": ["tumble", "balance", "escape_artist", "escape artist"],
    "thievery": ["disable_device", "disable device", "open_lock", "open lock", "sleight_of_hand", "sleight of hand"],
    "diplomacy": ["diplomacy", "gather_information", "gather information", "sense_motive", "sense motive"],
    "linguistics": ["decipher_script", "decipher script", "forgery", "speak_language", "speak language"]
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
        const ruleObj = masterList.find(m => m && (m.name || '').toLowerCase().includes('skill consolidation'));
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
  _extractPreEvaluatedSkillMods(modifiers, defaultType, ctx) {
    if (!Array.isArray(modifiers) || modifiers.length === 0) return [];
    const out = [];
    for (let i = 0; i < modifiers.length; i++) {
      const mod = modifiers[i];
      if (!mod || !mod.target) continue;
      const rawTarget = String(mod.target).trim().toLowerCase();
      if (!rawTarget.startsWith('skill.') && !rawTarget.startsWith('skills.') && rawTarget !== 'skills') continue;
      if (rawTarget.endsWith('.abilitymod')) continue;
      const subTarget = rawTarget.replace(/^skills?\./, '').trim();
      const tNorm = subTarget.replace(/[^a-z0-9]/g, '');
      const hasFormula = mod.formula !== undefined && mod.formula !== null && String(mod.formula).trim() !== '';
      const rawExpr = hasFormula ? mod.formula : mod.value;
      const val = Number(this.evaluateFormula(rawExpr, ctx)) || Number(mod.value) || 0;
      if (val === 0) continue;
      const mType = mod.type || (defaultType === 'competence_item' ? 'competence' : (val < 0 ? 'penalty' : defaultType));
      out.push({ subTarget, tNorm, val, mType });
    }
    return out;
  },

  _harvestSkillBonusSources(character) {
    if (!character) return null;
    this._activeCharacter = character;
    this._activeCustomEntries = (character.customEntries && typeof character.customEntries === 'object')
      ? character.customEntries
      : null;
    const charLvl = Number(character.level) || 1;
    const evalCtx = { cl: charLvl, level: charLvl, bab: Number(character.bab) || 0 };
    const itemEvalCtx = { cl: charLvl, level: charLvl };

    // 1. Active Buffs
    const buffSources = [];
    if (Array.isArray(character.buffs)) {
      for (let i = 0; i < character.buffs.length; i++) {
        const rawBuff = character.buffs[i];
        if (!rawBuff || !rawBuff.active) continue;
        const buff = this.ensureV2Entry(rawBuff);
        const bCtx = { ...evalCtx, cl: Number(buff.casterLevel || charLvl) || charLvl };
        const mods = this._extractPreEvaluatedSkillMods(buff.modifiers, 'untyped', bCtx);
        const negLvls = Number(buff.negativeLevels) || 0;
        if (mods.length > 0 || negLvls) {
          buffSources.push({ title: buff.name || 'Buff', mods, negativeLevels: negLvls });
        }
      }
    }

    // Helper for equipped / slotless item chain (item -> matching gearPool -> Master DB / Compendium)
    const buildItemChain = (rawItem) => {
      if (!rawItem) return null;
      const item = this.ensureV2Entry(rawItem);
      const t1 = item.name || 'Equipped Item';
      const m1 = this._extractPreEvaluatedSkillMods(item.modifiers, 'competence_item', itemEvalCtx);
      let t2 = t1;
      let m2 = [];
      if (Array.isArray(character.gearPool)) {
        const iLow = String(item.name || '').toLowerCase().trim();
        const pItem = character.gearPool.find(p => p && ((item.id && p.id === item.id) || (p.name && p.name.toLowerCase().trim() === iLow)));
        if (pItem) {
          t2 = item.name || pItem.name;
          m2 = this._extractPreEvaluatedSkillMods(this.ensureV2Entry(pItem).modifiers, 'competence_item', itemEvalCtx);
        }
      }
      let t3 = t1;
      let m3 = [];
      const dbEntry = this.getMasterDbEntry(item);
      if (dbEntry) {
        t3 = item.name || dbEntry.name;
        m3 = this._extractPreEvaluatedSkillMods(dbEntry.modifiers, 'competence_item', itemEvalCtx);
      }
      if (m1.length === 0 && m2.length === 0 && m3.length === 0) return null;
      return { t1, m1, t2, m2, t3, m3 };
    };

    // 2. Body Slots & 3. Gear Pool
    const itemChains = [];
    const activeSlotIds = new Set();
    const activeSlotNames = new Set();
    if (character.bodySlots && typeof character.bodySlots === 'object') {
      const slots = Object.values(character.bodySlots);
      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (!s || s.active === false) continue;
        if (s.id) activeSlotIds.add(s.id);
        if (s.name) activeSlotNames.add(s.name);
        if (!s.name || s.name === '-') continue;
        const chain = buildItemChain(s);
        if (chain) itemChains.push(chain);
      }
    }
    if (Array.isArray(character.gearPool)) {
      for (let i = 0; i < character.gearPool.length; i++) {
        const item = character.gearPool[i];
        if (!item || !item.name) continue;
        if ((item.id && activeSlotIds.has(item.id)) || activeSlotNames.has(item.name)) continue;
        const slotLow = String(item.slot || '').toLowerCase();
        const catLow = String(item.category || '').toLowerCase();
        const isSlotless = slotLow.includes('slotless') || catLow === 'other' || catLow === 'wondrous item';
        if (item.isEquipped || isSlotless) {
          const chain = buildItemChain(item);
          if (chain) itemChains.push(chain);
        }
      }
    }

    // 4. Feats & Special Abilities (+ active levelProgression)
    const progFeats = Array.isArray(character.levelProgression)
      ? character.levelProgression
          .filter(p => p && p.active !== false)
          .flatMap(p => [...(p.feats || []), ...(p.specialAbilities || [])])
      : [];
    const featsList = [...(character.feats || []), ...(character.specialAbilities || []), ...progFeats];
    const seenFeatNames = new Set();
    const featSources = [];
    const rawAbilityNamesWithMods = [];
    for (let i = 0; i < featsList.length; i++) {
      const rawFeat = featsList[i];
      if (!rawFeat) continue;
      if (typeof rawFeat === 'object' && Array.isArray(rawFeat.modifiers) && rawFeat.modifiers.length > 0 && rawFeat.name) {
        rawAbilityNamesWithMods.push(String(rawFeat.name).toLowerCase());
      }
      const featObj = typeof rawFeat === 'string' ? { name: rawFeat, category: 'Feat' } : this.ensureV2Entry(rawFeat);
      const rawFName = (featObj.name || '').trim();
      if (!rawFName) continue;
      const fName = rawFName.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
      if (!fName) continue;
      const fKey = fName.toLowerCase();
      if (seenFeatNames.has(fKey)) continue;
      seenFeatNames.add(fKey);

      const hasInlineMods = Array.isArray(featObj.modifiers) && featObj.modifiers.length > 0;
      const dbFeat = hasInlineMods ? null : (this.getMasterDbEntry(featObj) || this.getMasterDbEntry(fName));
      let rawMods = hasInlineMods ? featObj.modifiers : (dbFeat && Array.isArray(dbFeat.modifiers) ? dbFeat.modifiers : []);
      if (!hasInlineMods && dbFeat && Array.isArray(dbFeat.effects) && dbFeat.effects.length > 0 && (this.extractEntryChoice(featObj) || /\(/.test(fName))) {
        const evalWithChoice = this.evaluateV3Entry(
          Object.assign({}, dbFeat, featObj, { id: featObj.id || dbFeat.id, name: fName, _v3Evaluated: false, modifiers: [] }),
          evalCtx
        );
        if (evalWithChoice && Array.isArray(evalWithChoice.modifiers)) {
          rawMods = evalWithChoice.modifiers;
        }
      }
      const mods = this._extractPreEvaluatedSkillMods(rawMods, 'untyped', evalCtx);
      if (mods.length > 0) {
        featSources.push({ title: fName, mods });
      }
    }

    // 5. Racial, Template & Cleric Domain Skill Modifiers
    const extraSources = [];
    if (character.race) {
      const raceObj = this.getMasterDbEntry(character.race, 'Race');
      if (raceObj && Array.isArray(raceObj.modifiers)) {
        const rMods = this._extractPreEvaluatedSkillMods(raceObj.modifiers, 'racial', evalCtx);
        if (rMods.length > 0) extraSources.push({ title: `${raceObj.name || character.race} (Race)`, mods: rMods });
      }
    }
    const activeTemplates = this.getCharacterActiveTemplateEntries(character);
    for (let i = 0; i < activeTemplates.length; i++) {
      const tmpl = activeTemplates[i];
      if (tmpl && Array.isArray(tmpl.modifiers)) {
        const tMods = this._extractPreEvaluatedSkillMods(tmpl.modifiers, 'racial', evalCtx);
        if (tMods.length > 0) extraSources.push({ title: `${tmpl.name} (Template)`, mods: tMods });
      }
    }
    const activeDomains = this.getCharacterActiveDomainEntries(character);
    for (let i = 0; i < activeDomains.length; i++) {
      const dom = activeDomains[i];
      if (!dom || !Array.isArray(dom.modifiers) || dom.modifiers.length === 0) continue;
      const domLow = String(dom.name || '').toLowerCase();
      const alreadyApplied = rawAbilityNamesWithMods.some(fn => fn.includes(domLow));
      if (!alreadyApplied) {
        const dMods = this._extractPreEvaluatedSkillMods(dom.modifiers, 'untyped', evalCtx);
        if (dMods.length > 0) extraSources.push({ title: `${dom.name} Domain`, mods: dMods });
      }
    }

    // 6. Active Subsystem Skill Modifiers (Soulmelds, Vestiges, Powers, Mysteries, Utterances)
    const rawSoulmeldsSkill = Array.isArray(character.incarnum?.soulmelds) ? character.incarnum.soulmelds : (Array.isArray(character.soulmelds) ? character.soulmelds : []);
    const rawVestigesSkill = Array.isArray(character.pactMagic?.vestiges) ? character.pactMagic.vestiges : (Array.isArray(character.vestiges) ? character.vestiges : []);
    const rawPowersSkill = Array.isArray(character.psionics?.powers) ? character.psionics.powers : (Array.isArray(character.powers) ? character.powers : []);
    const rawMysteriesSkill = Array.isArray(character.shadowMagic?.mysteries) ? character.shadowMagic.mysteries : (Array.isArray(character.mysteries) ? character.mysteries : []);
    const rawUtterancesSkill = Array.isArray(character.truenaming?.utterances) ? character.truenaming.utterances : (Array.isArray(character.utterances) ? character.utterances : []);
    const harvestSubSkill = (rawEntry, category, defaultActive = false) => {
      if (!rawEntry) return;
      const obj = typeof rawEntry === 'string' ? { id: rawEntry, name: rawEntry, active: defaultActive } : rawEntry;
      if (obj.active === false || obj.shaped === false || obj.bound === false) return;
      if (!defaultActive && !obj.active && !obj.isActive) return;
      const dbSub = this.getMasterDbEntry(obj.id || obj.baseEntryId || obj.name, category);
      const merged = dbSub ? {
        ...dbSub,
        ...obj,
        blocks: Array.isArray(obj.blocks) && obj.blocks.length > 0 ? obj.blocks : dbSub.blocks,
        chakraBinds: obj.chakraBinds || dbSub.chakraBinds,
        schemaVersion: obj.schemaVersion || dbSub.schemaVersion
      } : obj;
      const v2Sub = this.ensureV2Entry(merged);
      if (v2Sub && Array.isArray(v2Sub.modifiers) && v2Sub.modifiers.length > 0) {
        const subCtx = {
          ...evalCtx,
          essentia: Number(obj.essentia ?? obj.investedEssentia ?? 0) || 0,
          augmentPP: Number(obj.augmentPP || 0) || 0
        };
        const sMods = this._extractPreEvaluatedSkillMods(v2Sub.modifiers, 'insight', subCtx);
        if (sMods.length > 0) {
          extraSources.push({ title: v2Sub.name || category, mods: sMods });
        }
      }
    };
    rawSoulmeldsSkill.forEach(s => harvestSubSkill(s, 'Soulmeld', true));
    rawVestigesSkill.forEach(v => harvestSubSkill(v, 'Vestige', true));
    rawPowersSkill.forEach(p => harvestSubSkill(p, 'Power', false));
    rawMysteriesSkill.forEach(m => harvestSubSkill(m, 'Mystery', false));
    rawUtterancesSkill.forEach(u => harvestSubSkill(u, 'Utterance', false));

    return { buffSources, itemChains, featSources, extraSources };
  },

  evaluateSkillBonus(character, skillKey, skillName, statName, preHarvested = null) {
    if (!character) return { total: 0, breakdown: [] };
    const sName = (skillName || '').toLowerCase().trim();
    const sKey = (skillKey || '').toLowerCase().trim();
    const isKnowledge = sName.startsWith('knowledge') || sKey.startsWith('knowledge') || sName.includes('bilgi');
    const aliases = this.getSkillAliases(sKey, sName, character);
    const baseKeyNorm = sKey.replace(/[^a-z0-9]/g, '');
    const harvested = preHarvested || this._harvestSkillBonusSources(character);
    if (!harvested) return { total: 0, breakdown: [] };

    const buckets = {};
    const addBonus = (sourceName, val, bType = 'untyped') => {
      const v = Number(val) || 0;
      if (v === 0) return;
      const type = (bType || 'untyped').toLowerCase().trim();
      if (!buckets[type]) buckets[type] = [];
      buckets[type].push({ name: sourceName, val: v });
    };

    const applyPreEvaluatedMods = (mods, sourceTitle) => {
      if (!mods || mods.length === 0) return false;
      let matched = false;
      for (let i = 0; i < mods.length; i++) {
        const { subTarget, tNorm, val, mType } = mods[i];
        let applies = false;
        if (subTarget === 'all' || subTarget === 'skills' || tNorm === 'allskills') {
          applies = true;
        } else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm === 'knowledgeall')) {
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
      }
      return matched;
    };

    // 1. Buffs + Negative Levels
    for (let i = 0; i < harvested.buffSources.length; i++) {
      const b = harvested.buffSources[i];
      const hasSkillMod = applyPreEvaluatedMods(b.mods, b.title);
      if (b.negativeLevels && !hasSkillMod) {
        addBonus(`${b.title} (-${b.negativeLevels} Lvl)`, -b.negativeLevels, 'penalty');
      }
    }

    // 2 & 3. Body Slots + Gear Pool
    for (let i = 0; i < harvested.itemChains.length; i++) {
      const c = harvested.itemChains[i];
      let handled = applyPreEvaluatedMods(c.m1, c.t1);
      if (!handled) handled = applyPreEvaluatedMods(c.m2, c.t2);
      if (!handled) applyPreEvaluatedMods(c.m3, c.t3);
    }

    // 4. Feats & Special Abilities
    for (let i = 0; i < harvested.featSources.length; i++) {
      const f = harvested.featSources[i];
      applyPreEvaluatedMods(f.mods, f.title);
    }

    // 5. Race, Templates, Domains
    for (let i = 0; i < harvested.extraSources.length; i++) {
      const ex = harvested.extraSources[i];
      applyPreEvaluatedMods(ex.mods, ex.title);
    }

    // 5b. V3 Parametric Skill / Concentration Key Ability Swaps (`skill.<slug>.abilityMod`, `concentration.abilityMod`)
    const skillLegoReplacements = (character.legoEvaluation && character.legoEvaluation.replacements)
      ? character.legoEvaluation.replacements
      : (this.evaluateLegoCharacter(character)?.replacements || null);
    if (skillLegoReplacements) {
      const skSlugDash = (sKey || sName).replace(/^skills?\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const defaultSkAbKey = String(statName || '').toLowerCase().trim() ||
        (((_ => {
          const rs = this.getActiveRuleset(character);
          const found = (rs && Array.isArray(rs.skills)) ? rs.skills.find(x => String(x[0]).toLowerCase() === sName || String(x[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-') === skSlugDash) : null;
          return found ? found[1] : '';
        })()) || 'int');
      const defaultSkMod = this.getAbilityMod(character.abilities?.[defaultSkAbKey] || 10);
      const slotCandidates = [`skill.${skSlugDash}.abilityMod`];
      if (skSlugDash === 'concentration') slotCandidates.push('concentration.abilityMod');
      slotCandidates.forEach(slotKey => {
        if (!Array.isArray(skillLegoReplacements[slotKey])) return;
        const swRes = this.resolveSwapSlot(skillLegoReplacements, slotKey, defaultSkMod, defaultSkAbKey.toUpperCase(), { character });
        const swappedTotal = swRes.value + swRes.addItems.reduce((acc, x) => acc + x.val, 0);
        const delta = swappedTotal - defaultSkMod;
        if (delta !== 0) {
          addBonus(swRes.label || 'Ability Swap', delta, 'untyped');
        }
      });
    }

    // 6. Resolve Stacking Rules (D&D 3.5e RAW + Consolidated Skill Group Rule)
    let total = 0;
    const breakdown = [];
    const rs = this.getActiveRuleset(character);
    const isMerged = character?.settings?.mergeSkills !== false;
    let isConsolidatedGroup = false;
    if (isMerged && rs && rs.consolidatedSkillBonusMode === 'single_highest') {
      let mapping = character?.settings?.skillMapping || null;
      if (!mapping) {
        const masterList = (typeof window !== 'undefined' && window.masterDb) || [];
        if (Array.isArray(masterList)) {
          const ruleObj = masterList.find(m => m && (m.name || '').toLowerCase().includes('skill consolidation'));
          if (ruleObj && ruleObj.skillMapping && typeof ruleObj.skillMapping === 'object') {
            mapping = ruleObj.skillMapping;
          }
        }
      }
      if (!mapping) mapping = this.DEFAULT_SKILL_MAPPING;
      const kClean = sKey.replace(/[^a-z0-9]/g, '');
      const nClean = sName.replace(/[^a-z0-9]/g, '');
      if (mapping && typeof mapping === 'object') {
        const groupKeys = Object.keys(mapping);
        for (let gi = 0; gi < groupKeys.length; gi++) {
          const gClean = groupKeys[gi].toLowerCase().replace(/[^a-z0-9]/g, '');
          if (gClean && (gClean === kClean || gClean === nClean)) {
            isConsolidatedGroup = true;
            break;
          }
        }
      }
    }

    if (isConsolidatedGroup) {
      let highestPos = null;
      Object.entries(buckets).forEach(([type, entries]) => {
        entries.forEach(e => {
          if (e.val > 0) {
            if (!highestPos || e.val > highestPos.val) {
              highestPos = { name: e.name, val: e.val, type };
            }
          } else if (e.val < 0) {
            total += e.val;
            breakdown.push(`${e.name}: ${e.val} (${type})`);
          }
        });
      });
      if (highestPos) {
        total += highestPos.val;
        breakdown.unshift(`${highestPos.name}: +${highestPos.val} (${highestPos.type})`);
      }
      return { total, breakdown };
    }

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

  deriveSkillsBonusMap(character) {
    const map = {};
    if (!character || typeof character !== 'object') return map;
    const harvested = this._harvestSkillBonusSources(character);
    if (!harvested) return map;
    if (Array.isArray(character.skills)) {
      for (let i = 0; i < character.skills.length; i++) {
        const sk = character.skills[i];
        if (!sk) continue;
        const sKey = sk.key || String(sk.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (!sKey) continue;
        const res = this.evaluateSkillBonus(character, sKey, sk.name, sk.stat || sk.ability, harvested);
        map[sKey] = res;
        if (!sk.key && sk.name) map[sk.name] = res;
      }
    }
    const conGroups = (typeof window !== 'undefined' && typeof window.getConsolidatedSkillGroups === 'function')
      ? window.getConsolidatedSkillGroups()
      : (typeof getConsolidatedSkillGroups === 'function' ? getConsolidatedSkillGroups() : null);
    if (Array.isArray(conGroups)) {
      for (let i = 0; i < conGroups.length; i++) {
        const cg = conGroups[i];
        if (!cg || !cg.key || map[cg.key]) continue;
        map[cg.key] = this.evaluateSkillBonus(character, cg.key, cg.name, cg.stat, harvested);
      }
    }
    return map;
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
        else if (isKnowledge && (subTarget === 'knowledge' || tNorm === 'allknowledge' || tNorm === 'knowledgeall')) applies = true;
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

  // Canonical V3 Race Traits Resolver (reads `race.*` V3 facet first, with character.customEntries support)
  getRaceTraits(character = null) {
    const rawRaceName = String((character && typeof character === 'object' ? character.race : character) || '').trim();
    const charCtx = (character && typeof character === 'object') ? character : null;
    const custRace = rawRaceName ? this.resolveCustomEntryOverride(rawRaceName, charCtx, { family: 'race' }) : null;
    const dbRace = custRace || (rawRaceName ? this.getMasterDbEntry(rawRaceName, 'Race') : null);
    if (dbRace && typeof dbRace === 'object') {
      const r = (dbRace.race && typeof dbRace.race === 'object') ? dbRace.race : {};
      const bf1 = r.bonusFeatAt1st !== undefined
        ? Boolean(r.bonusFeatAt1st)
        : Boolean((Array.isArray(dbRace.bonusFeats) && dbRace.bonusFeats.includes('Any')) || (typeof dbRace.bonusFeats === 'number' && dbRace.bonusFeats > 0));
      const bsp = r.humanBonusSkillPoints !== undefined
        ? (typeof r.humanBonusSkillPoints === 'number' ? r.humanBonusSkillPoints : (r.humanBonusSkillPoints ? 1 : 0))
        : (Number(dbRace.bonusSkillPointsPerLevel) || 0);
      return {
        found: true,
        id: dbRace.id || null,
        name: dbRace.name || rawRaceName,
        size: r.size || dbRace.size || 'Medium',
        speed: Number(r.speed ?? r.baseSpeed ?? dbRace.baseSpeed ?? 30) || 30,
        favoredClass: r.favoredClass || dbRace.favoredClass || 'Any',
        levelAdjustment: Number(r.levelAdjustment ?? dbRace.levelAdjustment ?? 0) || 0,
        bonusFeatAt1st: bf1,
        humanBonusSkillPoints: bsp
      };
    }
    const fallbackHuman = rawRaceName.toLowerCase().includes('human');
    return {
      found: false,
      id: null,
      name: rawRaceName,
      size: 'Medium',
      speed: 30,
      favoredClass: 'Any',
      levelAdjustment: 0,
      bonusFeatAt1st: fallbackHuman,
      humanBonusSkillPoints: fallbackHuman ? 1 : 0
    };
  },

  // Canonical V3 Class Definition Normalizer (single source of truth for RuleEngine & getAvailableClassDefs)
  normalizeV3ClassDef(srdClass, localDef = null, fallbackName = '') {
    if (!srdClass || typeof srdClass !== 'object') return localDef;
    const prev = localDef || {};
    const pr = (srdClass.progression && typeof srdClass.progression === 'object') ? srdClass.progression : null;
    const isPrestige = Boolean(
      (pr && pr.mode === 'prestige') ||
      srdClass.isPrestige ||
      srdClass.category === 'Prestige' ||
      srdClass.subCategory === 'Prestige' ||
      srdClass.type === 'Prestige Class' ||
      prev.isPrestige
    );
    const hdRaw = (pr && pr.hitDie) ? pr.hitDie : (srdClass.hitDie || srdClass.hd || prev.hd || 8);
    const hdNum = Number(String(hdRaw).replace(/[^0-9]/g, '')) || 8;
    let babRate = 0.75;
    if (pr && pr.bab) {
      babRate = pr.bab === 'full' ? 1.0 : (pr.bab === '1/2' ? 0.5 : 0.75);
    } else if (srdClass.bab !== undefined && !isNaN(Number(srdClass.bab))) {
      babRate = Number(srdClass.bab);
    } else if (srdClass.babProgression) {
      babRate = srdClass.babProgression === 'high' ? 1.0 : (srdClass.babProgression === 'low' ? 0.5 : 0.75);
    } else if (prev.bab !== undefined) {
      babRate = Number(prev.bab) || 0.5;
    } else {
      babRate = 0.5;
    }
    const hasV3Saves = Boolean(pr && Array.isArray(pr.goodSaves));
    const fortSave = hasV3Saves ? (pr.goodSaves.includes('fort') ? 'good' : 'poor') : (srdClass.fort || (srdClass.savingThrows?.fort === 'high' ? 'good' : (prev.fort || 'poor')));
    const refSave = hasV3Saves ? (pr.goodSaves.includes('ref') ? 'good' : 'poor') : (srdClass.ref || (srdClass.savingThrows?.ref === 'high' ? 'good' : (prev.ref || 'poor')));
    const willSave = hasV3Saves ? (pr.goodSaves.includes('will') ? 'good' : 'poor') : (srdClass.will || (srdClass.savingThrows?.will === 'high' ? 'good' : (prev.will || 'poor')));
    const skillPts = (pr && pr.skillPointsPerLevel !== undefined)
      ? (Number(pr.skillPointsPerLevel) || 2)
      : (Number(srdClass.skillPointsPerLevel ?? srdClass.skills ?? prev.skills) || 2);
    const maxLvl = (pr && pr.maxLevel)
      ? (Number(pr.maxLevel) || (isPrestige ? 10 : 20))
      : (Number(srdClass.maxLevel || prev.maxLevel) || (isPrestige ? 10 : 20));
    const classSkills = (pr && Array.isArray(pr.classSkills) && pr.classSkills.length > 0)
      ? pr.classSkills.slice()
      : (Array.isArray(srdClass.classSkills) && srdClass.classSkills.length > 0 ? srdClass.classSkills.slice() : (prev.classSkills || []));

    let featuresMap = prev.features || {};
    if (pr && (Array.isArray(pr.levels) || Array.isArray(pr.milestones))) {
      featuresMap = {};
      const srcRows = Array.isArray(pr.levels) ? pr.levels : pr.milestones;
      srcRows.forEach((lv, idx) => {
        if (!lv) return;
        const lvlNum = Number(lv.level) || (idx + 1);
        const fList = Array.isArray(lv.features) ? lv.features : [];
        if (fList.length > 0) {
          featuresMap[String(lvlNum)] = fList.filter(Boolean).map(f => {
            if (typeof f === 'string') return { name: f, category: 'Special Ability', type: 'Ex', summary: '' };
            const refId = f.refId || f.id || undefined;
            return {
              ...(refId ? { id: refId } : {}),
              name: f.name || 'Class Feature',
              category: f.category || 'Special Ability',
              type: f.abilityType || f.type || 'Ex',
              summary: f.text || f.summary || f.benefit || f.description || ''
            };
          });
        }
      });
    } else if (srdClass.features && typeof srdClass.features === 'object' && Object.keys(srdClass.features).length > 0) {
      featuresMap = srdClass.features;
    }

    let bonusFeatLevels = prev.bonusFeatLevels || [];
    if (srdClass.grants && Array.isArray(srdClass.grants.bonusFeats)) {
      bonusFeatLevels = Array.from(new Set(srdClass.grants.bonusFeats.map(g => Number(g && g.level)).filter(n => n > 0))).sort((a, b) => a - b);
    } else if (srdClass.grants && typeof srdClass.grants === 'object' && Array.isArray(srdClass.facets) && srdClass.facets.includes('grants')) {
      bonusFeatLevels = [];
    } else if (Array.isArray(srdClass.bonusFeatLevels) && srdClass.bonusFeatLevels.length > 0) {
      bonusFeatLevels = srdClass.bonusFeatLevels.slice();
    }

    let prereqsArr = prev.prerequisites || [];
    if (Array.isArray(srdClass.prerequisites)) {
      prereqsArr = srdClass.prerequisites;
    } else if (srdClass.prerequisites && Array.isArray(srdClass.prerequisites.all)) {
      prereqsArr = srdClass.prerequisites.all.map(group => {
        const alts = Array.isArray(group) ? group : (Array.isArray(group?.anyOf) ? group.anyOf : [group]);
        const a = alts[0] || {};
        if (a.kind === 'bab') return { key: 'bab', min: Number(a.min) || 1, text: `Base Attack Bonus +${Number(a.min) || 1}` };
        if (a.kind === 'skill') {
          const sk = String(a.skill || '').replace(/^skill\./, '');
          const rk = Number(a.ranks ?? a.min) || 4;
          return { key: 'skill', skill: sk, ranks: rk, text: `${sk} ${rk} ranks` };
        }
        if (a.kind === 'feat') {
          const fn = a.name || a.feat || a.tag || '';
          return { key: 'feat', name: fn, val: fn, text: `Feat: ${fn}` };
        }
        if (a.kind === 'alignment') {
          const rawAl = String(a.value || a.align || '');
          const allowed = rawAl.split(/[,/]/).map(s => s.trim()).filter(Boolean);
          return { key: 'alignment', allowed, text: `Alignment: ${rawAl}` };
        }
        if (a.kind === 'spellcasting') {
          const tr = String(a.tradition || a.cls || 'any').toLowerCase();
          const key = tr.includes('arcane') ? 'arcane' : (tr.includes('divine') ? 'divine' : 'spells');
          return { key, minSpellLevel: Number(a.spellLevel ?? a.min) || 1, text: `Spellcasting (${tr})` };
        }
        return { key: 'special', text: a.text || srdClass.prerequisites.text || 'Special Prerequisite' };
      });
    }

    let spellProg = srdClass.spellcastingProgression || prev.spellcastingProgression || 'none';
    if (spellProg === 'none' && pr) {
      if (pr.spellcastingChassis && pr.spellcastingChassis.mode && pr.spellcastingChassis.mode !== 'none') {
        spellProg = pr.spellcastingChassis.mode;
      } else if (Array.isArray(pr.levels) && pr.levels.some(lv => lv && (lv.spellcasting || lv.spell))) {
        const advCount = pr.levels.filter(lv => lv && (lv.spellcasting || lv.spell)).length;
        spellProg = advCount >= maxLvl ? 'full' : 'half';
      }
    }

    const rawDesc = srdClass.text || srdClass.description || srdClass.shortDescription || prev.description || '';
    const cleanDesc = (rawDesc && !/<[a-z][\s\S]*>/i.test(rawDesc))
      ? rawDesc
      : (srdClass.shortDescription || prev.description || String(rawDesc).replace(/<img[^>]*>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

    return Object.assign({}, prev, {
      _v2Hydrated: true,
      schemaVersion: 3,
      id: srdClass.id || prev.id || null,
      name: srdClass.name || prev.name || fallbackName,
      source: srdClass.source || prev.source || 'SRD 3.5e',
      hd: hdNum,
      bab: babRate,
      fort: fortSave,
      ref: refSave,
      will: willSave,
      skills: skillPts,
      maxLevel: maxLvl,
      classSkills,
      features: featuresMap,
      progression: pr || prev.progression || null,
      grants: srdClass.grants || prev.grants || null,
      replaces: Array.isArray(srdClass.replaces) ? srdClass.replaces : (prev.replaces || []),
      variantOf: srdClass.variantOf || prev.variantOf || null,
      bonusFeatLevels,
      bonusFeatContract: srdClass.bonusFeatContract || prev.bonusFeatContract || null,
      bonusFeatContracts: srdClass.bonusFeatContracts || prev.bonusFeatContracts || null,
      prerequisites: prereqsArr,
      spellcastingProgression: spellProg,
      description: cleanDesc,
      role: srdClass.role || prev.role || (isPrestige ? 'Prestige Class' : 'Base Class'),
      edition: srdClass.edition || prev.edition || '3.5',
      contentLevel: srdClass.contentLevel || prev.contentLevel || null,
      effects: Array.isArray(srdClass.effects) ? srdClass.effects : (prev.effects || []),
      isPrestige,
      type: isPrestige ? 'Prestige Class' : 'Base Class'
    });
  },

  // D&D 3.5e Class Definitions Cache (Hydrated on-demand from database/srd_classes_races.json via SrdCompendium)
  DND35_CLASS_DEFS: {},

  getClassDef(className, character = null) {
    if (!className) return null;
    const lowerKey = String(className).toLowerCase().trim();
    const customClassOverride = this.resolveCustomEntryOverride(className, character, { family: 'class' });
    if (this.DND35_CLASS_DEFS && !customClassOverride) {
      const cached = this.DND35_CLASS_DEFS[className] || this.DND35_CLASS_DEFS[lowerKey];
      if (cached && cached._v2Hydrated) {
        return cached;
      }
    }
    const comp = (typeof window !== 'undefined' && window.SrdCompendium)
      || (typeof SrdCompendium !== 'undefined' ? SrdCompendium : null);
    let srdClass = customClassOverride || ((comp && typeof comp.getClass === 'function')
      ? comp.getClass(className)
      : null);
    // Check masterDb / snapDb exact match FIRST before stripping any parenthetical
    if (!srdClass) {
      const snapDb = (Array.isArray(this._activeCustomDb) && this._activeCustomDb.length > 0 ? this._activeCustomDb : null)
        || (typeof window !== 'undefined' && Array.isArray(window.masterDb) ? window.masterDb : null)
        || (typeof masterDb !== 'undefined' && Array.isArray(masterDb) ? masterDb : null);
      srdClass = snapDb
        ? (snapDb.find(m => m && (m.type === 'Class' || String(m.id || '').startsWith('cls-')) && (String(m.name || '').toLowerCase().trim() === lowerKey || String(m.id || '').toLowerCase().trim() === lowerKey)) || null)
        : null;
    }
    // Check lazy splat class chunk (`srd_classes_splat.json`) exact match if indexed in SrdCompendium
    if (!srdClass && comp && typeof comp.findIndexEntry === 'function' && typeof comp.ensureChunkLoaded === 'function') {
      const idxHit = comp.findIndexEntry(className, 'Class');
      if (idxHit && idxHit.f === 'srd_classes_splat.json') {
        comp.ensureChunkLoaded(idxHit.f);
        if (typeof comp.getClass === 'function') srdClass = comp.getClass(className);
      }
    }
    let localDef = (this.DND35_CLASS_DEFS && (this.DND35_CLASS_DEFS[className] || this.DND35_CLASS_DEFS[lowerKey])) || null;
    if (!localDef && !srdClass && typeof window !== 'undefined' && typeof window.getAvailableClassDefs === 'function') {
      const availDefs = window.getAvailableClassDefs();
      if (availDefs) {
        const matchedAvailKey = availDefs[className] ? className : Object.keys(availDefs).find(k => k.toLowerCase().trim() === lowerKey);
        if (matchedAvailKey) localDef = availDefs[matchedAvailKey];
      }
    }
    // Only strip `(...)` as a last resort when the parenthetical does NOT name a class variant / ACF
    const parenMatch = String(className).match(/\(([^)]+)\)/);
    if (!srdClass && !localDef && parenMatch && !/\b(variant|adventurer|thug|cloistered|acf|urban|martial|wildshape)\b/i.test(parenMatch[1])) {
      const baseClassName = String(className).replace(/\s*\([^)]+\)\s*/g, '').trim();
      if (baseClassName) {
        if (comp && typeof comp.getClass === 'function') srdClass = comp.getClass(baseClassName);
        if (!srdClass) srdClass = this.getMasterDbEntry(baseClassName, 'Class');
      }
    }
    if (!localDef && !srdClass) return null;
    if (!srdClass) {
      localDef._v2Hydrated = true;
      localDef.replaces = Array.isArray(localDef.replaces) ? localDef.replaces : [];
      if (this.DND35_CLASS_DEFS) {
        this.DND35_CLASS_DEFS[className] = localDef;
        this.DND35_CLASS_DEFS[lowerKey] = localDef;
      }
      return localDef;
    }
    const merged = this.normalizeV3ClassDef(srdClass, localDef, className);
    if (this.DND35_CLASS_DEFS && !customClassOverride && srdClass.name) {
      this.DND35_CLASS_DEFS[srdClass.name] = merged;
      this.DND35_CLASS_DEFS[String(srdClass.name).toLowerCase().trim()] = merged;
    }
    if (this.DND35_CLASS_DEFS && !customClassOverride) {
      this.DND35_CLASS_DEFS[className] = merged;
      this.DND35_CLASS_DEFS[lowerKey] = merged;
    }
    return merged;
  },

  // Get slot contract for bonus feats
  getClassBonusFeatContract(className, classLevel, character = null) {
    const def = this.getClassDef(className, character);
    if (!def) return null;
    const cl = Number(classLevel) || 1;
    if (def.bonusFeatContracts && def.bonusFeatContracts[cl]) return def.bonusFeatContracts[cl];
    if (def.bonusFeatContract) return def.bonusFeatContract;
    return null;
  },

  // Get granted class features, bonus feats and Slot Contract for a given class and level
  getClassLevelFeatures(className, classLevel, character = null) {
    const def = this.getClassDef(className, character);
    if (!def) return { features: [], featureObjects: [], hasBonusFeat: false, bonusFeatContract: null };
    const cl = Number(classLevel) || 1;
    const rawFeatures = (def.features && (def.features[cl] || def.features[String(cl)])) ? (def.features[cl] || def.features[String(cl)]) : [];
    const features = rawFeatures.map(f => (typeof f === 'string' ? f : f.name));
    const featureObjects = rawFeatures.map(f => (typeof f === 'string' ? { name: f, benefit: '' } : f));
    const hasBonusFeat = Array.isArray(def.bonusFeatLevels) && def.bonusFeatLevels.includes(cl);

    let bonusFeatContract = null;
    if (hasBonusFeat) {
      bonusFeatContract = this.getClassBonusFeatContract(className, cl, character);
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
    const racialSkillBonus = typeof isHuman === 'number' ? isHuman : (isHuman ? 1 : 0);
    const intMod = Number(options.intMod) || 0;
    const charRef = options.character || null;

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
      const cDef = this.getClassDef(cName, charRef) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good', skills: 4 };
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
        totalSkillPts += Math.max(4, (baseSkill + intMod) * 4) + (racialSkillBonus * 4);
      } else {
        totalSkillPts += Math.max(1, baseSkill + intMod) + racialSkillBonus;
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
        const cDef = this.getClassDef(cName, charRef) || { hd: 8, bab: 0.75, fort: 'poor', ref: 'poor', will: 'good' };
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
  },

  /**
   * ASCII-folds English and legacy Turkish strings (`İ/ı -> i`, `ğ -> g`, `ü -> u`,
   * `ş -> s`, `ö -> o`, `ç -> c`) for Bilingual Reader Shield matching.
   */
  foldTr(str) {
    const dottedI = new RegExp(String.fromCharCode(304), 'g');
    const dotlessI = new RegExp(String.fromCharCode(305), 'g');
    return String(str || '')
      .replace(dottedI, 'i')
      .replace(dotlessI, 'i')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Single canonical consumable & usable item effect parser (Phase R2).
   * Evaluates structured V2 `damageParts`, healing tiers, condition cures,
   * offensive wands/items, and buff potions with Bilingual Reader Shield support.
   */
  parseConsumablePlan(itemOrName, effectDesc, character = null) {
    const rawItemObj = (itemOrName && typeof itemOrName === 'object') ? itemOrName : null;
    const rawName = rawItemObj ? String(rawItemObj.name || '') : String(itemOrName || '');
    const charCtx = character
      || this._activeCharacter
      || (typeof window !== 'undefined' && window.CharStore && typeof window.CharStore.getDoc === 'function' ? window.CharStore.getDoc() : null)
      || (typeof window !== 'undefined' ? window.character : null);
    let itemObj = rawItemObj;
    if (itemObj) {
      const hasDirectParts = Array.isArray(itemObj.damageParts) && itemObj.damageParts.length > 0;
      const hasDirectEffects = Array.isArray(itemObj.effects) && itemObj.effects.length > 0;
      const customOv = this.resolveCustomEntryOverride(itemObj, charCtx);
      if (customOv) {
        itemObj = this.ensureV2Entry(Object.assign({}, itemObj, customOv), { character: charCtx });
      } else if (hasDirectEffects && !hasDirectParts) {
        itemObj = this.ensureV2Entry(itemObj, { character: charCtx });
      } else if (!hasDirectParts) {
        const dbLookup = this.getMasterDbEntry(itemObj, charCtx);
        if (dbLookup && ((Array.isArray(dbLookup.effects) && dbLookup.effects.length > 0) || (Array.isArray(dbLookup.damageParts) && dbLookup.damageParts.length > 0))) {
          itemObj = this.ensureV2Entry(Object.assign({}, dbLookup, { name: itemObj.name || dbLookup.name }), { character: charCtx });
        }
      }
    } else if (rawName) {
      const dbByName = this.getMasterDbEntry({ name: rawName }, charCtx);
      if (dbByName && ((Array.isArray(dbByName.effects) && dbByName.effects.length > 0) || (Array.isArray(dbByName.damageParts) && dbByName.damageParts.length > 0))) {
        itemObj = this.ensureV2Entry(dbByName, { character: charCtx });
      }
    }
    const rawEffect = effectDesc !== undefined
      ? String(effectDesc || '')
      : (rawItemObj ? String(rawItemObj.effect || rawItemObj.desc || '') : (itemObj ? String(itemObj.text || itemObj.shortDescription || '') : ''));

    const nameFold = this.foldTr(rawName).trim();
    const descFold = this.foldTr(rawEffect).trim();
    const combined = `${nameFold} ${descFold}`.trim();
    const isPotion = /^(potion|oil|elixir)\b/i.test(nameFold) || /\bpotion\b/i.test(nameFold);
    const buffLabel = isPotion ? 'Potion Effect' : 'Item Effect';

    const cureFlags = {
      poison: /neutralize\s*poison/i.test(nameFold) || /neutralize[s]?\s+poison|cures?\s+poison|removes?\s+poison/i.test(descFold),
      curse: /remove\s*curse|break\s*enchantment/i.test(nameFold) || /removes?\s+(?:all\s+)?curses?|breaks?\s+enchantment/i.test(descFold),
      blindDeaf: /remove\s*blindness|remove\s*deafness/i.test(nameFold) || /cures?\s+blindness|removes?\s+blindness|cures?\s+deafness|removes?\s+deafness/i.test(descFold),
      paralysis: /remove\s*paralysis/i.test(nameFold) || /removes?\s+paralysis|cures?\s+paralysis/i.test(descFold),
      disease: /remove\s*disease/i.test(nameFold) || /cures?\s+(?:all\s+)?diseases?|removes?\s+(?:all\s+)?diseases?/i.test(descFold),
      lesserRestoration: /lesser\s+restoration/i.test(combined),
      fullRestoration: /\brestoration\b/i.test(combined) && !/lesser\s+restoration/i.test(combined)
    };
    const hasAnyCureFlag = Object.values(cureFlags).some(Boolean);

    // 1. Structured V2 `item.damageParts`
    if (itemObj && Array.isArray(itemObj.damageParts) && itemObj.damageParts.length > 0) {
      const dp = itemObj.damageParts[0] || {};
      const diceStr = String(dp.dice || '').trim();
      const dm = diceStr.match(/(\d+)d(\d+)/i);
      const count = dm ? (parseInt(dm[1], 10) || 1) : 0;
      const sides = dm ? (parseInt(dm[2], 10) || 6) : 0;
      const bonus = Number(dp.bonus) || 0;
      const dmgType = this.foldTr(dp.type || '');
      const isPositiveHeal = dmgType.includes('positive') || dmgType.includes('heal') || itemObj.ruleFlags?.isHealing === true;
      const formula = count > 0
        ? `${count}d${sides}${bonus !== 0 ? (bonus > 0 ? '+' : '') + bonus : ''}`
        : `${bonus}`;
      if (isPositiveHeal) {
        return {
          kind: 'heal',
          isHealing: true,
          isDamage: false,
          isCure: false,
          count,
          sides,
          bonus,
          diceCount: count,
          diceSides: sides,
          flatBonus: bonus,
          formula,
          badgeText: `${formula} HP`,
          badgeKind: 'heal',
          isPotion,
          buffLabel,
          isCureMinor: count === 0 && bonus === 1,
          isHealSpell: count === 0 && bonus >= 100,
          isMagicMissile: false,
          missiles: 0,
          type: 'positive',
          typeName: 'Healing',
          icon: '💖',
          saveDesc: null,
          cureFlags
        };
      }
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count,
        sides,
        bonus,
        diceCount: count,
        diceSides: sides,
        flatBonus: bonus,
        formula,
        badgeText: `${formula} Dmg`,
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: dmgType || 'generic',
        typeName: dp.type ? `${dp.type} Damage` : 'Damage',
        icon: /fire/.test(dmgType) ? '🔥' : (/cold/.test(dmgType) ? '❄️' : (/acid/.test(dmgType) ? '🧪' : (/electric/.test(dmgType) ? '⚡' : '💥'))),
        saveDesc: null,
        cureFlags
      };
    }

    // 2. Condition Cure Detection (Neutralize Poison, Remove Curse/Blindness/Paralysis/Disease, Restoration)
    const isHealSpellName = /\bheal\b/i.test(nameFold) && !/\bcure\b|healing/i.test(nameFold);
    if (hasAnyCureFlag && !isHealSpellName) {
      const isLesser = cureFlags.lesserRestoration;
      return {
        kind: 'cure',
        isHealing: false,
        isDamage: false,
        isCure: true,
        count: isLesser ? 1 : 0,
        sides: isLesser ? 4 : 0,
        bonus: 0,
        diceCount: isLesser ? 1 : 0,
        diceSides: isLesser ? 4 : 0,
        flatBonus: 0,
        formula: isLesser ? '1d4' : 'D&D 3.5e RAW',
        badgeText: null,
        badgeKind: null,
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'cure',
        typeName: 'Condition Cure',
        icon: '✨',
        saveDesc: null,
        cureFlags
      };
    }

    // 3. Healing Detection (English + ASCII-folded Turkish Reader Stems)
    const isNotOffensiveWand = !/fireball|magic\s*missile|lightning|scorching|acid|alchemist/i.test(nameFold);
    const isHealMatch = (
      /\b(cure|heal|healing)\b/i.test(nameFold) ||
      (/\b(cure|heal|healing|heals)\b|\bhp\b/i.test(descFold) && isNotOffensiveWand && !/\bwand\b/i.test(nameFold))
    );
    if (isHealMatch) {
      if (/\bminor\b|ufak/i.test(combined)) {
        return {
          kind: 'heal',
          isHealing: true,
          isDamage: false,
          isCure: false,
          count: 0,
          sides: 0,
          bonus: 1,
          diceCount: 0,
          diceSides: 0,
          flatBonus: 1,
          formula: '1 HP',
          badgeText: '1 HP',
          badgeKind: 'heal',
          isPotion,
          buffLabel,
          isCureMinor: true,
          isHealSpell: false,
          isMagicMissile: false,
          missiles: 0,
          type: 'positive',
          typeName: 'Healing',
          icon: '💖',
          saveDesc: null,
          cureFlags
        };
      }
      if (isHealSpellName) {
        const flatHeal = /greater|mass/i.test(nameFold) ? 150 : 110;
        return {
          kind: 'heal',
          isHealing: true,
          isDamage: false,
          isCure: false,
          count: 0,
          sides: 0,
          bonus: flatHeal,
          diceCount: 0,
          diceSides: 0,
          flatBonus: flatHeal,
          formula: `${flatHeal} HP`,
          badgeText: `${flatHeal} HP`,
          badgeKind: 'heal',
          isPotion,
          buffLabel,
          isCureMinor: false,
          isHealSpell: true,
          isMagicMissile: false,
          missiles: 0,
          type: 'positive',
          typeName: 'Healing',
          icon: '💖',
          saveDesc: null,
          cureFlags
        };
      }

      let count = 1;
      let sides = 8;
      let bonus = 1;
      const explicitHealDice = descFold.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i) || nameFold.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
      if (/critical|kritik/i.test(combined)) {
        count = 4; sides = 8; bonus = 7;
      } else if (/serious|ciddi/i.test(combined)) {
        count = 3; sides = 8; bonus = 5;
      } else if (/moderate|\borta\b/i.test(combined)) {
        count = 2; sides = 8; bonus = 3;
      } else if (explicitHealDice) {
        count = parseInt(explicitHealDice[1], 10) || 1;
        sides = parseInt(explicitHealDice[2], 10) || 8;
        bonus = explicitHealDice[3] !== undefined ? (parseInt(explicitHealDice[3], 10) || 0) : 0;
      }
      if (explicitHealDice && !/critical|kritik|serious|ciddi|moderate|\borta\b|light|hafif/i.test(nameFold)) {
        count = parseInt(explicitHealDice[1], 10) || count;
        sides = parseInt(explicitHealDice[2], 10) || sides;
        bonus = explicitHealDice[3] !== undefined ? (parseInt(explicitHealDice[3], 10) || 0) : bonus;
      }

      const formula = `${count}d${sides}${bonus !== 0 ? (bonus > 0 ? '+' : '') + bonus : ''}`;
      return {
        kind: 'heal',
        isHealing: true,
        isDamage: false,
        isCure: false,
        count,
        sides,
        bonus,
        diceCount: count,
        diceSides: sides,
        flatBonus: bonus,
        formula,
        badgeText: `${formula} HP`,
        badgeKind: 'heal',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'positive',
        typeName: 'Healing',
        icon: '💖',
        saveDesc: null,
        cureFlags
      };
    }

    // 4. Offensive / Damage Detection (Wands, Alchemical Items & Spells)
    if (nameFold.includes('fireball')) {
      const clMatch = combined.match(/cl\s*(\d+)/i);
      const cl = clMatch ? Math.min(10, Math.max(5, parseInt(clMatch[1], 10))) : 5;
      const diceMatch = descFold.match(/(\d+)d6/i);
      const count = diceMatch ? parseInt(diceMatch[1], 10) : cl;
      const formula = `${count}d6`;
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count,
        sides: 6,
        bonus: 0,
        diceCount: count,
        diceSides: 6,
        flatBonus: 0,
        formula,
        badgeText: `${formula} Dmg`,
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'fire',
        typeName: 'Fire Damage',
        icon: '🔥',
        saveDesc: 'Reflex DC 14 half',
        cureFlags
      };
    }

    if (nameFold.includes('magic missile')) {
      const clMatch = combined.match(/cl\s*(\d+)/i);
      const cl = clMatch ? (parseInt(clMatch[1], 10) || 1) : 1;
      let missiles = cl >= 9 ? 5 : (cl >= 7 ? 4 : (cl >= 5 ? 3 : (cl >= 3 ? 2 : 1)));
      const mMatch = descFold.match(/(\d+)\s*(?:missile|fuze|adet|x)/i);
      if (mMatch) missiles = parseInt(mMatch[1], 10) || missiles;
      const formula = `${missiles}x(1d4+1)`;
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count: missiles,
        sides: 4,
        bonus: missiles * 1,
        diceCount: missiles,
        diceSides: 4,
        flatBonus: missiles * 1,
        formula,
        badgeText: `${formula} Dmg`,
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: true,
        missiles,
        type: 'force',
        typeName: 'Force Damage',
        icon: '⚡',
        saveDesc: null,
        cureFlags
      };
    }

    if (nameFold.includes('lightning')) {
      const clMatch = combined.match(/cl\s*(\d+)/i);
      const cl = clMatch ? Math.min(10, Math.max(5, parseInt(clMatch[1], 10))) : 5;
      const formula = `${cl}d6`;
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count: cl,
        sides: 6,
        bonus: 0,
        diceCount: cl,
        diceSides: 6,
        flatBonus: 0,
        formula,
        badgeText: `${formula} Dmg`,
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'electricity',
        typeName: 'Electricity Damage',
        icon: '⚡',
        saveDesc: 'Reflex DC 14 half',
        cureFlags
      };
    }

    if (nameFold.includes('scorching ray')) {
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count: 4,
        sides: 6,
        bonus: 0,
        diceCount: 4,
        diceSides: 6,
        flatBonus: 0,
        formula: '4d6',
        badgeText: '4d6 Dmg',
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'fire',
        typeName: 'Scorching Ray (Fire)',
        icon: '🔥',
        saveDesc: null,
        cureFlags
      };
    }

    const isTempHpOrDurationDice = /temporary\s+hit\s+points|temp\s*hp|false\s+life|\baid\b/i.test(combined) && !/\bdamage\b/i.test(combined);
    const genMatch = !isTempHpOrDurationDice
      ? (descFold.match(/(\d+)d(\d+)(?:\s*([+-]\s*\d+))?/i) || nameFold.match(/(\d+)d(\d+)(?:\s*([+-]\s*\d+))?/i))
      : null;
    if (genMatch) {
      const count = parseInt(genMatch[1], 10) || 1;
      const sides = parseInt(genMatch[2], 10) || 6;
      const bonus = genMatch[3] ? parseInt(genMatch[3].replace(/\s+/g, ''), 10) : 0;
      let typeName = 'Damage';
      let icon = '💥';
      let type = 'generic';
      if (/fire/i.test(combined)) { type = 'fire'; typeName = 'Fire Damage'; icon = '🔥'; }
      else if (/cold/i.test(combined)) { type = 'cold'; typeName = 'Cold Damage'; icon = '❄️'; }
      else if (/acid/i.test(combined)) { type = 'acid'; typeName = 'Acid Damage'; icon = '🧪'; }
      else if (/electric/i.test(combined)) { type = 'electricity'; typeName = 'Electricity Damage'; icon = '⚡'; }
      else if (/force/i.test(combined)) { type = 'force'; typeName = 'Force Damage'; icon = '✨'; }
      const formula = `${count}d${sides}${bonus !== 0 ? (bonus > 0 ? '+' : '') + bonus : ''}`;
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count,
        sides,
        bonus,
        diceCount: count,
        diceSides: sides,
        flatBonus: bonus,
        formula,
        badgeText: `${formula} Dmg`,
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type,
        typeName,
        icon,
        saveDesc: null,
        cureFlags
      };
    }

    if (/\b(acid|alchemist)\b/i.test(nameFold)) {
      return {
        kind: 'damage',
        isHealing: false,
        isDamage: true,
        isCure: false,
        count: 1,
        sides: 6,
        bonus: 0,
        diceCount: 1,
        diceSides: 6,
        flatBonus: 0,
        formula: '1d6',
        badgeText: '1d6 Dmg',
        badgeKind: 'damage',
        isPotion,
        buffLabel,
        isCureMinor: false,
        isHealSpell: false,
        isMagicMissile: false,
        missiles: 0,
        type: 'acid',
        typeName: 'Acid Damage',
        icon: '🧪',
        saveDesc: null,
        cureFlags
      };
    }

    // 5. Default Buff / Utility Plan
    return {
      kind: 'buff',
      isHealing: false,
      isDamage: false,
      isCure: false,
      count: 0,
      sides: 0,
      bonus: 0,
      diceCount: 0,
      diceSides: 0,
      flatBonus: 0,
      formula: null,
      badgeText: null,
      badgeKind: null,
      isPotion,
      buffLabel,
      isCureMinor: false,
      isHealSpell: false,
      isMagicMissile: false,
      missiles: 0,
      type: 'buff',
      typeName: buffLabel,
      icon: isPotion ? '🧪' : '📦',
      saveDesc: null,
      cureFlags
    };
  },

  /**
   * Purely derives the deduplicated, categorized consumables view (`allItems` & `byGroup`)
   * using the P11 shield/armor/weapon exclusion rules without mutating input items.
   */
  deriveConsumablesView(workingChar) {
    const ch = workingChar || {};
    const isExcludedPhysicalOrAbility = (item, slotKey = '') => {
      if (!item || typeof item !== 'object') return true;
      const name = String(item.name || '').toLowerCase().trim();
      const desc = String(item.desc || item.effect || '').toLowerCase().trim();
      const catLower = String(item.category || '').toLowerCase().trim();
      const typeLower = String(item.type || '').toLowerCase().trim();
      const effSlotKey = slotKey || item.slotKey || '';
      const combined = `${name} ${desc}`;

      if (['feat', 'special ability', 'dm grant', 'homebrew', 'boon', 'class feature', 'racial trait', 'spell', 'maneuver', 'stance'].includes(catLower)) {
        return true;
      }
      if (/wand|scroll|potion|elixir|oil/i.test(name)) return false;

      const hasExplicitChargesOrActiveMode = (
        Number(item.dailyCharges?.max || item.dailyCharges) > 0 ||
        Number(item.charges) > 0 ||
        (Array.isArray(item.modes) && item.modes.some(m => m && m.actionType && m.actionType !== 'passive'))
      );

      const isArmorOrShield = (
        catLower === 'armor' || catLower === 'shield' ||
        typeLower === 'armor' || typeLower === 'shield' ||
        effSlotKey === 'armor' ||
        (effSlotKey === 'offHand' && /shield|kalkan|buckler/i.test(`${name} ${catLower}`))
      );
      if (isArmorOrShield) {
        return !hasExplicitChargesOrActiveMode;
      }

      const isWeapon = (
        catLower === 'weapon' || typeLower === 'weapon' ||
        effSlotKey === 'mainHand' || effSlotKey === 'offHand' ||
        /\b(dagger|rapier|longsword|shortsword|short sword|greatsword|scimitar|falchion|handaxe|battleaxe|greataxe|halberd|spear|longspear|mace|heavy mace|light mace|morningstar|warhammer|club|quarterstaff|flail|shortbow|longbow|crossbow|sling|javelin|shuriken|kama|nunchaku|siangham|sai|kukri|spiked chain|bastard sword|dwarven waraxe)\b/i.test(name)
      );
      if (isWeapon) {
        if (hasExplicitChargesOrActiveMode) return false;
        if (/cure|heal|healing|fireball|magic missile|scorching ray|lightning bolt|dimension door|teleport|haste|invisibility/i.test(combined)) return false;
        return true;
      }
      return false;
    };

    const resolveDailyCharges = (item) => {
      if (!item || typeof item !== 'object') return null;
      if (item.dailyCharges && typeof item.dailyCharges === 'object' && Number(item.dailyCharges.max) > 0) {
        return {
          current: item.dailyCharges.current !== undefined ? Number(item.dailyCharges.current) : Number(item.dailyCharges.max),
          max: Number(item.dailyCharges.max),
          unit: item.dailyCharges.unit || 'charges',
          recharge: item.dailyCharges.recharge || 'long_rest'
        };
      }
      if (typeof item.dailyCharges === 'number' && item.dailyCharges > 0) {
        return { current: item.dailyCharges, max: item.dailyCharges, unit: 'charges', recharge: 'long_rest' };
      }
      const combined = `${item.name || ''} ${item.desc || ''} ${item.effect || ''}`;
      const match = combined.match(/(\d+)\s*\/\s*day/i);
      if (match) {
        const max = parseInt(match[1], 10);
        if (max > 0) return { current: max, max, unit: 'charges', recharge: 'long_rest' };
      }
      return null;
    };

    const classifyCategory = (item, plan) => {
      const nameFold = this.foldTr(item.name || '');
      const descFold = this.foldTr(item.effect || item.desc || '');
      const combined = `${nameFold} ${descFold}`;
      if (plan && plan.isHealing) {
        return 'healing';
      }
      if (plan && plan.isDamage) {
        return 'wand_damage';
      }
      if (/wand|fireball|magic\s*missile|lightning|scorching|damage|cone\s*of\s*cold|ice\s*storm/i.test(nameFold)) {
        return 'wand_damage';
      }
      if (item.dailyCharges || /\d+\s*\/\s*day/i.test(combined)) {
        return 'daily_charge';
      }
      if (plan && plan.isCure) {
        return 'buff';
      }
      if (/potion|elixir|buff|strength|grace|endurance|cunning|wisdom|splendor|invisibility|fly|haste|shield\s*of\s*faith|scroll\s*of\s*shield|potion\s*of\s*shield/i.test(nameFold)) {
        return 'buff';
      }
      return 'other';
    };

    const displayMap = new Map();

    (ch.gearPool || []).forEach(p => {
      if (!p || isExcludedPhysicalOrAbility(p)) return;
      const dc = resolveDailyCharges(p);
      const nameFold = this.foldTr(p.name || '');
      const isWand = String(p.category || '').toLowerCase() === 'wand' || /\bwand\b/i.test(nameFold);
      const isConsumableCat = String(p.category || '').toLowerCase() === 'consumable' || (p.isBelt && String(p.category || '').toLowerCase() !== 'weapon');
      if ((isConsumableCat || isWand || dc) && !p.isEquipped) {
        const key = String(p.name || '').toLowerCase().trim();
        if (!key) return;
        displayMap.set(key, {
          id: p.id || null,
          name: p.name,
          qty: (p.qty !== undefined && p.qty !== null) ? Number(p.qty) : 1,
          effect: p.desc || p.effect || 'Consumable / wand',
          sourceType: 'pool',
          poolId: p.id,
          isBelt: Boolean(p.isBelt),
          dailyCharges: dc,
          damageParts: Array.isArray(p.damageParts) ? p.damageParts : undefined,
          ruleFlags: p.ruleFlags || undefined
        });
      }
    });

    (ch.consumables || []).forEach((c, cIdx) => {
      if (!c || isExcludedPhysicalOrAbility(c)) return;
      const key = String(c.name || '').toLowerCase().trim();
      if (!key) return;
      const dc = resolveDailyCharges(c);
      if (!displayMap.has(key)) {
        displayMap.set(key, {
          id: c.id || null,
          name: c.name,
          qty: (c.qty !== undefined && c.qty !== null) ? Number(c.qty) : 1,
          effect: c.effect || c.desc || 'Consumable effect',
          sourceType: 'consumable',
          idx: cIdx,
          isBelt: false,
          dailyCharges: dc,
          damageParts: Array.isArray(c.damageParts) ? c.damageParts : undefined,
          ruleFlags: c.ruleFlags || undefined
        });
      } else {
        const existing = displayMap.get(key);
        if (c.effect && (!existing.effect || existing.effect === 'Consumable effect')) {
          existing.effect = c.effect;
        }
        if (dc && !existing.dailyCharges) {
          existing.dailyCharges = dc;
        }
      }
    });

    if (ch.bodySlots && typeof ch.bodySlots === 'object') {
      Object.entries(ch.bodySlots).forEach(([slotKey, slotItem]) => {
        if (!slotItem || !slotItem.name || slotItem.name === '-') return;
        if (isExcludedPhysicalOrAbility(slotItem, slotKey)) return;
        const slotCat = String(slotItem.category || slotItem.type || '').toLowerCase().trim();
        const isPhysicalSlotGear = slotCat === 'weapon' || slotCat === 'armor' || slotCat === 'shield' || slotKey === 'mainHand' || slotKey === 'offHand' || slotKey === 'armor';
        const dc = resolveDailyCharges(slotItem);
        const hasExplicitCharges = Number(slotItem.dailyCharges?.max || slotItem.dailyCharges || slotItem.charges) > 0 ||
          (Array.isArray(slotItem.modes) && slotItem.modes.some(m => m && m.actionType && m.actionType !== 'passive'));
        const hasDaily = isPhysicalSlotGear ? hasExplicitCharges : Boolean(dc);
        const slotNameFold = this.foldTr(slotItem.name || '');
        const isWandOrUse = isPhysicalSlotGear
          ? hasExplicitCharges
          : ((slotItem.desc && /(?:cure|fireball|missile|\d+d\d+)/i.test(slotItem.desc)) || /\bwand\b/i.test(slotNameFold));
        if (hasDaily || isWandOrUse) {
          const key = String(slotItem.name || '').toLowerCase().trim();
          if (!displayMap.has(key)) {
            displayMap.set(key, {
              id: slotItem.id || null,
              name: slotItem.name,
              qty: Number(slotItem.qty) || 1,
              effect: slotItem.desc || 'Equipped magic item',
              sourceType: 'slot',
              slotKey,
              isBelt: false,
              fromSlot: true,
              dailyCharges: dc,
              damageParts: Array.isArray(slotItem.damageParts) ? slotItem.damageParts : undefined,
              ruleFlags: slotItem.ruleFlags || undefined
            });
          }
        }
      });
    }

    const allItems = Array.from(displayMap.values());
    const byGroup = {
      healing: [],
      wand_damage: [],
      buff: [],
      daily_charge: [],
      other: []
    };
    allItems.forEach(item => {
      const isDaily = Boolean(item.dailyCharges && typeof item.dailyCharges.max === 'number');
      item.isDaily = isDaily;
      item.isExhausted = isDaily ? (item.dailyCharges.current <= 0) : (item.qty <= 0);
      const plan = this.parseConsumablePlan(item, item.effect);
      item.plan = plan;
      item.tagBadge = plan && plan.badgeText
        ? {
            text: plan.badgeText,
            variant: plan.badgeKind === 'damage' ? 'damage' : 'healing',
            formula: plan.formula
          }
        : null;
      const cat = classifyCategory(item, plan);
      if (byGroup[cat]) byGroup[cat].push(item);
      else byGroup.other.push(item);
    });
    Object.values(byGroup).forEach(arr => {
      arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    });

    return { allItems, byGroup };
  },

  /**
   * Pure Special Attacks & Breath Weapons derivation helper (Phase R3).
   * Projects structured V2 / V2.5 special attack cards (`6d8 Acid`, `4d8` `1d4+1` recharge, etc.)
   * without mutating `w`.
   */
  // Rule Crafter sub-powers (`entry.powers[]`, forge_sandbox exportPower) normalized into mode-like records:
  // { id, name, kind, action, usage, usageText, casterLevel, dcFormula, save: { type, onSave } | null, attack, range,
  //   area, rechargeDice, damageParts, text }. Each power's V3 roll blocks are evaluated exactly like an entry mode;
  // an attached power (refId) with no blocks of its own uses the referenced entry's effects.
  /**
   * "Gained at Level / HD" gate for race and template progression (character level / total HD, like templates).
   * item.gainedAt <= 1 (or unset) is always unlocked. ctx is a formula context or anything carrying `level` / `hd`.
   */
  isLevelGainUnlocked(item, ctx) {
    const gainedAt = Number(item && item.gainedAt) || 0;
    if (gainedAt <= 1) return true;
    const level = Number(ctx && (ctx.hd ?? ctx.level)) || 1;
    return level >= gainedAt;
  },

  /**
   * Everything the character's race and active templates grant, by the level it is gained at:
   * [{ level, source, sourceId, kind: 'power' | 'effect', name, summary, unlocked }], sorted by level.
   * Sub-powers and top-level effect blocks without gainedAt count as level 1.
   */
  /** The character's race entry (override-aware) plus its active template entries. */
  getRaceTemplateProgressionSources(character) {
    const w = character || {};
    const sources = [];
    const raceName = String(w.race || '').trim();
    if (raceName) {
      const raceEntry = this.resolveCustomEntryOverride(raceName, w, { family: 'race' }) || this.getMasterDbEntry(raceName, 'Race');
      if (raceEntry) sources.push(raceEntry);
    }
    if (typeof this.getCharacterActiveTemplateEntries === 'function') {
      (this.getCharacterActiveTemplateEntries(w) || []).forEach(t => { if (t) sources.push(t); });
    }
    return sources;
  },

  getRaceTemplateLevelGains(character) {
    const w = character || {};
    const level = Number(this.buildFormulaContext(w).level) || 1;
    const sources = this.getRaceTemplateProgressionSources(w);
    const out = [];
    sources.forEach(src => out.push(...this.getEntryLevelGains(src, level)));
    return out.sort((a, b) => a.level - b.level);
  },

  /** Level gains of one race / template entry at a given character level (see getRaceTemplateLevelGains). */
  getEntryLevelGains(entry, level = 1) {
    if (!entry || typeof entry !== 'object') return [];
    const lvl = Number(level) || 1;
    const sourceName = entry.name || 'Race';
    const atOf = (x) => Math.max(1, Math.floor(Number(x && x.gainedAt) || 1));
    const out = [];
    (Array.isArray(entry.powers) ? entry.powers : []).forEach(pw => {
      if (!pw || typeof pw !== 'object') return;
      const at = atOf(pw);
      const summary = String(pw.text || (Array.isArray(pw.effects) ? pw.effects.map(e => e && e.summary).filter(Boolean).join('; ') : '') || '');
      out.push({ level: at, source: sourceName, sourceId: entry.id || null, kind: 'power', name: String(pw.name || 'Power'), summary, unlocked: lvl >= at });
    });
    (Array.isArray(entry.effects) ? entry.effects : []).forEach(b => {
      if (!b || typeof b !== 'object') return;
      const at = atOf(b);
      let name = String(b.summary || b.label || b.name || b.type || 'Effect');
      // A formula stat block reads as its value at the character's level ("+2 Untyped → Natural Armor (scales)").
      const formula = String(b.formula || '').trim();
      if (b.type === 'stat' && b.mode === 'formula' && formula && name.indexOf(formula) === 0) {
        const val = Number(this.evaluateFormula(formula, { level: lvl, hd: lvl, cl: lvl, casterLevel: lvl }));
        if (Number.isFinite(val)) name = `${val >= 0 ? '+' : ''}${Math.floor(val)}${name.slice(formula.length)} (scales)`;
      }
      out.push({ level: at, source: sourceName, sourceId: entry.id || null, kind: 'effect', name, summary: '', unlocked: lvl >= at });
    });
    return out.sort((a, b) => a.level - b.level);
  },

  expandEntryPowers(entry, ctx = {}) {
    if (!entry || !Array.isArray(entry.powers) || entry.powers.length === 0) return [];
    const character = (ctx && ctx.character) || this._activeCharacter || null;
    // Powers gained at a later character level (race / template progression) stay locked until then.
    const levelCtx = character ? this.buildFormulaContext(character) : null;
    const usageTextOf = (u) => {
      if (!u || typeof u !== 'object') return '';
      const n = Number(u.uses) || 0;
      switch (u.mode) {
        case 'perDay': return n ? `${n}/day` : '';
        case 'perEncounter': return n ? `${n}/encounter` : '';
        case 'charges': return n ? `${n} charges` : '';
        case 'atWill': return 'At will';
        case 'cooldown': return u.recharge ? `Recharge ${u.recharge} rounds` : '';
        case 'spellSlot': return u.slotLevel !== undefined ? `Level ${u.slotLevel} spell slot` : '';
        case 'resourcePool': return u.pool ? `${Number(u.cost) || 1} ${u.pool}` : '';
        default: return '';
      }
    };
    return entry.powers.map((pw, idx) => {
      if (!pw || typeof pw !== 'object') return null;
      if (levelCtx && !this.isLevelGainUnlocked(pw, levelCtx)) return null;
      let effects = Array.isArray(pw.effects) ? pw.effects : [];
      const ref = (pw.kind === 'attached' && pw.refId) ? this.getMasterDbEntry(pw.refId) : null;
      if (effects.length === 0 && ref && Array.isArray(ref.effects)) effects = ref.effects;
      const id = String(pw.id || `power-${idx + 1}`);
      const name = String(pw.name || (ref && ref.name) || `Power ${idx + 1}`);
      const cl = Number(pw.casterLevel) || 0;
      // @spellLevel: the power's own Spell Level, else its attached spell's level.
      const spellLevelRaw = pw.spellLevel !== undefined && pw.spellLevel !== '' ? Number(pw.spellLevel) : (ref ? Number(ref.level) : NaN);
      const spellLevel = Number.isFinite(spellLevelRaw) ? spellLevelRaw : null;
      const evaluated = effects.length > 0
        ? this.evaluateV3Entry(
          // The parent entry is already resolved (overrides included); `_customOverrideApplied` stops the
          // name-based override lookup from swapping in the parent when a power shares its name.
          Object.assign({ schemaVersion: 3, id: `${entry.id || 'entry'}:${id}`, name, effects, _customOverrideApplied: true }, cl ? { casterLevel: cl } : {}),
          Object.assign({ character }, cl ? { cl, casterLevel: cl } : {}, spellLevel !== null ? { spellLevel } : {})
        )
        : null;
      const saveType = pw.save && typeof pw.save === 'object' ? String(pw.save.type || '') : '';
      const save = saveType && saveType !== 'None'
        ? { type: saveType, onSave: String(pw.save.effect || pw.save.onSave || 'half').toLowerCase() }
        : null;
      const usage = pw.usage && typeof pw.usage === 'object' ? pw.usage : null;
      const summary = String(pw.text || effects.map(e => e && e.summary).filter(Boolean).join('; ')
        || (ref && (ref.shortDescription || ref.text)) || '').trim();
      return {
        id,
        name,
        summary,
        kind: pw.kind || 'inline',
        refId: pw.kind === 'attached' && pw.refId ? String(pw.refId) : '',
        action: pw.action || '',
        usage,
        usageText: usageTextOf(usage),
        casterLevel: cl || null,
        spellLevel,
        dcFormula: (Number(pw.saveDC) || 0) > 0 ? String(Number(pw.saveDC)) : String(pw.dcFormula || ''),
        save,
        attack: typeof pw.attack === 'string' && pw.attack !== 'none' ? pw.attack : '',
        range: pw.range || '',
        area: pw.area || '',
        rechargeDice: usage && usage.mode === 'cooldown' && usage.recharge ? String(usage.recharge) : '',
        damageParts: evaluated && Array.isArray(evaluated.damageParts) ? evaluated.damageParts : [],
        text: pw.text || ''
      };
    }).filter(Boolean);
  },

  /**
   * Attack bonus of a touch attack, ray or natural/special weapon attack (PHB p.136, p.141).
   * Runs the same pipeline as weapon attacks so every "bonus on attack rolls" applies with RAW stacking
   * (buffs, conditions, Fighting Defensively, Flanking / Higher Ground for melee, Combat Expertise for melee,
   * Point Blank Shot toggle and Weapon Focus (ray) for rays), while weapon-only bonuses (enhancement,
   * masterwork, Power Attack, Manyshot) never apply. Touch spells and rays need no weapon proficiency.
   * attackKind: 'melee-touch' | 'ranged-touch' | 'weapon'. Returns { total, breakdown, items }.
   */
  evaluateTouchAttack(character, spec = {}) {
    const w = character || {};
    const kind = spec.attackKind || 'melee-touch';
    const ranged = kind === 'ranged-touch' || (kind === 'weapon' && Boolean(spec.ranged));
    const isTouch = kind !== 'weapon';
    const tac = w.tactical || {};
    // A ranged touch attack named "... Ray" (Scorching Ray, Ray of Frost) is a ray (Weapon Focus (ray) applies).
    spec = Object.assign({}, spec, {
      isRay: spec.isRay !== undefined ? Boolean(spec.isRay) : (kind === 'ranged-touch' && /\bray\b/i.test(String(spec.name || '')))
    });
    const label = spec.isRay ? 'Ray' : (isTouch ? (ranged ? 'Ranged Touch Attack' : 'Melee Touch Attack') : String(spec.name || 'Special Attack'));
    const synthetic = {
      id: `attack-delivery:${spec.isRay ? 'ray' : kind}`,
      name: label,
      baseItemId: spec.isRay ? 'ray' : `attack-delivery-${kind}`,
      isTouch,
      touchAttack: isTouch,
      isSpellAttack: true,
      isRanged: ranged,
      tags: ranged ? ['ranged'] : [],
      weaponStats: { category: ranged ? 'Ranged' : 'Melee' },
      enhancementBonus: 0,
      damageParts: []
    };
    const ev = this.evaluateWeaponAttack(w, synthetic, {
      grip: ranged ? 'Ranged' : '1-Hand',
      powerAttack: 0,
      flanking: !ranged && Boolean(tac.flanking),
      charge: !ranged && Boolean(tac.charge),
      higherGround: !ranged && Boolean(tac.higherGround),
      manyshot: false,
      manyshotArrows: 0
    }) || {};
    const items = (Array.isArray(ev.attackBonusItems) ? ev.attackBonusItems : [])
      .filter(it => it && it.applied !== false && Number(it.val) !== 0);
    const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
    return {
      total: Number(ev.netAttackBonus) || 0,
      breakdown: items.map(it => `${it.source} ${sgn(Number(it.val))}`).join(', '),
      items
    };
  },

  /**
   * Delivery and area shape of a special attack (PHB p.175 area shapes, p.141 touch attacks).
   * Returns { attackKind, attackLabel, vsAc, toHit, toHitBreakdown, isRay, isBreath, shape, areaMode, areaSize,
   * areaLabel, rangeLabel }. attackKind: 'melee-touch' | 'ranged-touch' | 'weapon' | '' (no attack roll).
   */
  describeAttackDelivery(spec, character) {
    const sp = spec || {};
    const w = character || {};
    const area = String(sp.area || '').trim();
    const range = String(sp.range || '').trim();
    const lowArea = area.toLowerCase();
    const attackKind = ['melee-touch', 'ranged-touch', 'weapon'].includes(sp.attack) ? sp.attack : '';
    const isRay = attackKind === 'ranged-touch' && /\bray/.test(`${lowArea} ${String(sp.name || '').toLowerCase()}`);
    const isBreath = Boolean(sp.isBreath) || /\bbreath\b/i.test(String(sp.name || ''));

    let shape = '';
    if (/\bcone/.test(lowArea)) shape = 'Cone';
    else if (/\bline/.test(lowArea)) shape = 'Line';
    else if (/\bcylinder/.test(lowArea)) shape = 'Cylinder';
    else if (/\b(sphere|radius|burst|spread|emanation)/.test(lowArea)) shape = 'Sphere';
    let areaMode = '';
    if (/\bburst/.test(lowArea)) areaMode = 'Burst';
    else if (/\bspread/.test(lowArea)) areaMode = 'Spread';
    else if (/\bemanation/.test(lowArea)) areaMode = 'Emanation';
    const sizeMatch = lowArea.match(/(\d+)\s*-?\s*(?:ft|foot|feet)\.?/);
    const areaSize = sizeMatch ? `${sizeMatch[1]}-ft.${shape === 'Sphere' || shape === 'Cylinder' ? ' radius' : ''}` : '';

    let toHit = null;
    let toHitBreakdown = '';
    let toHitItems = [];
    if (attackKind) {
      const atk = this.evaluateTouchAttack(w, { attackKind, isRay, ranged: Boolean(sp.ranged), name: sp.name });
      toHit = atk.total;
      toHitBreakdown = atk.breakdown;
      toHitItems = atk.items;
    }
    const attackLabel = attackKind === 'melee-touch' ? 'Melee Touch Attack'
      : (attackKind === 'ranged-touch' ? (isRay ? 'Ray (Ranged Touch Attack)' : 'Ranged Touch Attack')
        : (attackKind === 'weapon' ? 'Weapon Attack' : ''));
    return {
      attackKind,
      attackLabel,
      vsAc: attackKind === 'weapon' ? 'AC' : (attackKind ? 'Touch AC' : ''),
      toHit,
      toHitBreakdown,
      toHitItems,
      isRay,
      isBreath,
      shape,
      areaMode,
      areaSize,
      areaLabel: area,
      rangeLabel: range && range.toLowerCase() !== lowArea ? range : ''
    };
  },

  /** Damage-dealing special attacks (breath, claws, rays ...). Utility and healing powers live in `deriveActivatedAbilities`. */
  deriveSpecialAttacks(w, legoEval = null, customDb = []) {
    return this.deriveSpecialPowerPool(w, legoEval, customDb).filter(r => r.category === 'attack');
  },

  /** Activated abilities: utility sub-powers (no damage) and healing powers. Single source with `deriveSpecialAttacks`. */
  deriveActivatedAbilities(w, legoEval = null, customDb = []) {
    // Attached-spell powers stay here until the slot-based Spell Command Center can host them (category 'spell').
    return this.deriveSpecialPowerPool(w, legoEval, customDb).filter(r => r.category === 'ability' || r.category === 'spell');
  },

  /**
   * Every special card of a character, each tagged `category`: 'attack' (damage), 'ability' (utility / healing),
   * or 'spell' (a sub-power that is directly an attached spell; listed with the abilities until the Spell Command Center hosts it).
   */
  deriveSpecialPowerPool(w, legoEval = null, customDb = []) {
    if (!w || typeof w !== 'object') return [];
    const stripTag = (str) => String(str || '').replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
    const rawPool = [];

    const resolvedLego = legoEval || w.legoEvaluation || (typeof this.evaluateLegoCharacter === 'function' ? this.evaluateLegoCharacter(w) : null);
    if (resolvedLego && Array.isArray(resolvedLego.entries)) {
      resolvedLego.entries.forEach(le => {
        if (le && (le._autoUnlocked || le._mutated)) {
          rawPool.push({ ...le, _src: 'legoEvaluation' });
        }
      });
    }
    if (Array.isArray(w.legoEntries)) {
      w.legoEntries.forEach(le => {
        if (le) rawPool.push({ ...le, _src: 'legoEntries' });
      });
    }
    if (Array.isArray(w.specialAbilities)) {
      w.specialAbilities.forEach(a => {
        if (a) rawPool.push(typeof a === 'string' ? { name: a, _src: 'specialAbilities' } : { ...a, _src: 'specialAbilities' });
      });
    }
    if (Array.isArray(w.feats)) {
      w.feats.forEach(f => {
        if (f) rawPool.push(typeof f === 'string' ? { name: f, _src: 'feats' } : { ...f, _src: 'feats' });
      });
    }
    // Rule Crafter sub-power carriers beyond feats: every active lego entry (class features, equipped items,
    // buffs ...), the race and active templates. These only contribute their `powers[]`, never a card of their own.
    const powerSources = (resolvedLego && Array.isArray(resolvedLego.entries))
      ? resolvedLego.entries.slice()
      : (typeof this.collectLegoEntries === 'function' ? this.collectLegoEntries(w) : []);
    const raceName = String(w.race || '').trim();
    if (raceName) {
      const raceEntry = this.resolveCustomEntryOverride(raceName, w, { family: 'race' }) || this.getMasterDbEntry(raceName, 'Race');
      if (raceEntry) powerSources.push(raceEntry);
    }
    if (typeof this.getCharacterActiveTemplateEntries === 'function') {
      powerSources.push(...this.getCharacterActiveTemplateEntries(w));
    }
    powerSources.forEach(e => {
      if (e && typeof e === 'object' && e.name) rawPool.push({ ...e, _src: 'powerSource', _powersOnly: true });
    });

    const excludedNames = new Set([
      'power attack', 'sneak attack', 'punishing stance', 'mountain hammer', 'steel wind',
      'flurry of blows', 'two-weapon fighting', 'improved two-weapon fighting', 'greater two-weapon fighting',
      'agile shield fighter', 'weapon specialization', 'greater weapon specialization', 'point blank shot',
      'rapid shot', 'manyshot', 'deadly aim', 'combat expertise'
    ]);

    const dbList = Array.isArray(customDb) && customDb.length > 0
      ? customDb
      : (Array.isArray(w.customDb) ? w.customDb : []);
    const charDbList = Array.isArray(w.customDb) ? w.customDb : [];
    const customEntryMap = (w.customEntries && typeof w.customEntries === 'object') ? w.customEntries : null;
    const shortId = (id) => String(id || '').trim().toLowerCase().split(':').pop();

    // Immutable-id resolution first (character customEntries -> character customDb -> supplied db -> compendium),
    // display-name match only as the legacy fallback.
    const resolveDbRecord = (item, lowerName) => {
      const ids = [item.id, item.entryId, item.baseEntryId, item.srdId].filter(Boolean).map(String);
      for (const id of ids) {
        if (customEntryMap) {
          const mapKey = Object.prototype.hasOwnProperty.call(customEntryMap, id)
            ? id
            : Object.keys(customEntryMap).find(k => shortId(k) === shortId(id));
          const direct = mapKey ? customEntryMap[mapKey] : null;
          if (direct && typeof direct === 'object') return direct;
        }
        for (const pool of [charDbList, dbList]) {
          const hit = pool.find(m => m && m.id && (m.id === id || shortId(m.id) === shortId(id)));
          if (hit) return hit;
        }
        const master = this.getMasterDbEntry(id);
        if (master && master.id && shortId(master.id) === shortId(id)) return master;
      }
      return dbList.find(m => m && m.name && stripTag(m.name).toLowerCase() === lowerName)
        || charDbList.find(m => m && m.name && stripTag(m.name).toLowerCase() === lowerName)
        || null;
    };

    const seen = new Set();
    const seenNames = new Map();
    const result = [];
    const curRound = Number(w.tactical?.round || w.encounterRound) || 1;
    const ruleMasterRef = (typeof window !== 'undefined' && window.RuleMaster)
      || (typeof RuleMaster !== 'undefined' ? RuleMaster : null);

    const parseActionLabel = (raw) => {
      const c = String(raw || 'Standard Action').trim().toLowerCase();
      if (c.includes('move')) return ['move', 'Move Action'];
      if (c.includes('swift')) return ['swift', 'Swift Action'];
      if (c.includes('immediate') || c.includes('reaction')) return ['immediate', 'Immediate Action'];
      if (c.includes('full')) return ['full', 'Full-Round Action'];
      if (c.includes('free')) return ['free', 'Free Action'];
      return ['standard', 'Standard Action'];
    };

    const TRACKED_USAGE = ['perDay', 'perEncounter', 'charges'];
    const emitAttack = (spec) => {
      const cleanParts = (spec.damageParts || []).filter(dp => dp && dp.dice);
      const isUtility = Boolean(spec.utility);
      const dp0 = cleanParts[0] || { dice: '1d6', bonus: 0, type: 'Damage' };
      const bonusNum = Number(dp0.bonus || 0);
      const dmgFormula = isUtility ? '' : `${dp0.dice}${bonusNum ? (bonusNum > 0 ? '+' + bonusNum : bonusNum) : ''}`;
      const dmgType = isUtility ? '' : (dp0.type || 'Damage');
      const key = spec.key;
      const usageMode = spec.usage && TRACKED_USAGE.includes(spec.usage.mode) ? spec.usage.mode : '';
      const usesMax = usageMode ? Math.max(0, Number(spec.usage.uses) || 0) : 0;
      const useRec = w.powerUses && w.powerUses[key];
      const usesUsed = usesMax ? Math.min(usesMax, Math.max(0, Number(useRec && typeof useRec === 'object' ? useRec.used : useRec) || 0)) : 0;

      const cdEntry = w.tactical?.abilityCooldowns?.[key];
      const readyRoundFromTactical = (cdEntry && typeof cdEntry === 'object')
        ? Number(cdEntry.readyRound || 0)
        : Number(cdEntry || 0);
      const remFromTactical = Math.max(0, readyRoundFromTactical - curRound);
      // `specialAttackCooldowns[key]` stores the rolled wait (it never counts down), so it is only a fallback
      // for old saves without a round-anchored `tactical.abilityCooldowns` entry.
      const remFromDirect = (cdEntry && typeof cdEntry === 'object') ? 0 : (Number(w.specialAttackCooldowns?.[key]) || 0);
      const remFromRes = Number(spec.roundRes?.cooldownRemaining) || 0;
      const cooldownRemaining = Math.max(remFromTactical, remFromDirect, remFromRes);
      const readyRound = readyRoundFromTactical > curRound
        ? readyRoundFromTactical
        : (cooldownRemaining > 0 ? curRound + cooldownRemaining : 0);

      const dcEval = (spec.save || spec.dcFormula)
        ? this.evaluateAbilitySaveDc({ dcFormula: spec.dcFormula, benefit: spec.benefit, spellLevel: spec.spellLevel }, w)
        : null;
      const [rawActionType, effActionLabel] = parseActionLabel(spec.actionCandidate);
      const healParts = isUtility ? [] : cleanParts.filter(dp => dp.healing);
      const isHealing = healParts.length > 0 && healParts.length === cleanParts.length;
      const category = spec.attachedSpell ? 'spell' : ((isUtility || isHealing) ? 'ability' : 'attack');
      const healFormula = isHealing ? `${dp0.dice}${bonusNum ? (bonusNum > 0 ? '+' + bonusNum : bonusNum) : ''}` : '';

      result.push({
        category,
        healing: isHealing,
        healParts,
        healFormula,
        attachedSpellId: spec.attachedSpell || null,
        key,
        abilityKey: key,
        id: spec.id || key,
        entryId: spec.entryId || key,
        powerId: spec.powerId || null,
        modeId: spec.modeId || null,
        resourceId: spec.resourceId || null,
        name: spec.name,
        source: spec.source || 'Special Ability',
        damageParts: cleanParts,
        dice: dmgFormula,
        dmgFormula,
        diceFormula: dmgFormula,
        dmgType,
        save: spec.save || '',
        dcFormula: spec.dcFormula || '',
        spellLevel: spec.spellLevel ?? null,
        dc: dcEval ? dcEval.dc : null,
        dcVal: dcEval ? dcEval.dc : null,
        dcBreakdown: dcEval ? dcEval.breakdown : '',
        range: spec.range || '',
        attack: spec.attack || '',
        delivery: this.describeAttackDelivery({
          attack: spec.attack, area: spec.area, range: spec.rangeOnly, name: spec.name, isBreath: spec.isBreath
        }, w),
        usage: spec.usage || null,
        usageText: spec.usageText || '',
        utility: isUtility,
        summary: spec.summary || '',
        usageMode,
        usesMax,
        usesUsed,
        usesLeft: usesMax ? usesMax - usesUsed : null,
        isExhausted: Boolean(usesMax) && usesUsed >= usesMax,
        recharge: spec.recharge || '',
        rechargeDice: spec.rechargeDice || '',
        cooldownExpr: spec.rechargeDice || '',
        cooldownRemaining,
        remainingCooldown: cooldownRemaining,
        readyRound,
        isOnCooldown: cooldownRemaining > 0,
        isReady: cooldownRemaining === 0,
        action: effActionLabel,
        actionType: rawActionType,
        benefit: spec.benefit || '',
        desc: spec.benefit || ''
      });
    };

    rawPool.forEach(item => {
      const cleanName = stripTag(item.name || '');
      if (!cleanName) return;
      const lower = cleanName.toLowerCase();
      if (excludedNames.has(lower) || lower.startsWith('sneak attack')) return;

      const dbMatch = resolveDbRecord(item, lower);
      if (item._powersOnly && !((Array.isArray(item.powers) && item.powers.length > 0) || (dbMatch && Array.isArray(dbMatch.powers) && dbMatch.powers.length > 0))) return;
      const identity = String(item.id || (dbMatch && dbMatch.id) || '').trim().toLowerCase();
      const identityKey = identity ? `id:${shortId(identity)}` : `name:${lower}`;
      const nameIds = seenNames.get(lower);
      if (seen.has(identityKey) || (nameIds && (!identity || nameIds.has(`name:${lower}`)))) return;

      let merged = item._mutated
        ? Object.assign({}, dbMatch || {}, item, { name: cleanName })
        : Object.assign({}, item, dbMatch || {}, { name: cleanName });
      merged = this.ensureV2Entry(merged, { character: w });
      const benText = merged.benefit || merged.desc || merged.description || merged.text || '';
      const entryPowers = this.expandEntryPowers(merged, { character: w });

      if (!merged.dcFormula && !merged.recharge && entryPowers.length === 0 && (!Array.isArray(merged.damageParts) || merged.damageParts.length === 0)) {
        if (ruleMasterRef && typeof ruleMasterRef.parseStructuredAbilityStatBlock === 'function') {
          const parsed = ruleMasterRef.parseStructuredAbilityStatBlock(cleanName, benText, merged.category || merged.type || '');
          if (parsed) {
            merged = Object.assign({}, parsed, merged, {
              name: parsed.name || cleanName,
              damageParts: (Array.isArray(merged.damageParts) && merged.damageParts.length > 0) ? merged.damageParts : (parsed.damageParts || []),
              save: merged.save || parsed.save || '',
              dcFormula: merged.dcFormula || parsed.dcFormula || '',
              range: merged.range || parsed.range || '',
              recharge: merged.recharge || parsed.recharge || '',
              rechargeDice: merged.rechargeDice || parsed.rechargeDice || '',
              ruleFlags: Object.assign({}, parsed.ruleFlags || {}, merged.ruleFlags || {})
            });
          }
        }
      }

      const entryName = merged.name || cleanName;
      const entryKey = (merged.id || lower).replace(/[^a-z0-9_:]+/gi, '_').replace(/^_|_$/g, '');
      const entrySource = merged.source || merged.category || 'Special Ability';
      const dbExplicitAction = dbMatch ? (dbMatch.action || dbMatch.actionType || '') : '';
      const itemNonDefaultAction = (item && item.actionType && !['standard', 'passive'].includes(String(item.actionType).toLowerCase()))
        ? item.actionType
        : ((item && item.action && !/^(standard(\s+action)?|passive)$/i.test(String(item.action).trim())) ? item.action : '');
      let emitted = false;

      // (a) The entry itself (V2 damageParts or its primary V3 mode).
      const primaryModeRaw = Array.isArray(merged.modes) && merged.modes.length > 0 ? merged.modes[0] : null;
      const primaryMode = (primaryModeRaw && (Array.isArray(primaryModeRaw.effects) || Array.isArray(primaryModeRaw.blocks)))
        ? this.evaluateV3Entry({ ...primaryModeRaw, schemaVersion: 3, _customOverrideApplied: true }, { character: w })
        : primaryModeRaw;
      const roundRes = Array.isArray(merged.resources)
        ? merged.resources.find(r => r && ((r.recharge && (r.recharge.period === 'rounds' || r.recharge.dice)) || r.rechargeModel === 'cooldown_turns' || r.rechargeFormula))
        : null;
      const anyRes = roundRes || (Array.isArray(merged.resources) && merged.resources[0]) || null;
      const effDamageParts = (Array.isArray(merged.damageParts) && merged.damageParts.some(dp => dp && dp.dice))
        ? merged.damageParts
        : (primaryMode && Array.isArray(primaryMode.damageParts) ? primaryMode.damageParts : []);
      const effSaveObj = (primaryMode && primaryMode.save && typeof primaryMode.save === 'object') ? primaryMode.save : null;
      const effSaveStr = effSaveObj ? `${effSaveObj.type || 'Reflex'} (${effSaveObj.onSave || 'half'})` : (merged.save || (primaryMode && typeof primaryMode.save === 'string' ? primaryMode.save : ''));
      const effDcFormula = merged.dcFormula || (effSaveObj && effSaveObj.dcFormula) || '';
      const rf = merged.ruleFlags || {};
      const effRechargeDice = merged.rechargeDice || rf.rechargeFormula || (roundRes && ((roundRes.recharge && roundRes.recharge.dice) || roundRes.rechargeFormula)) || '';
      const effRange = merged.range || (primaryMode && (primaryMode.area || primaryMode.range)) || '';
      const effAttack = (typeof merged.attack === 'string' && merged.attack) || (primaryMode && typeof primaryMode.attack === 'string' && primaryMode.attack) || '';
      const hasDmgParts = Array.isArray(effDamageParts) && effDamageParts.some(dp => dp && dp.dice);
      const hasV2SpecialFlag = Boolean(rf.isBreathWeapon || rf.isSpecialAttack || rf.isStructuredAbility || rf.rechargeFormula);
      const hasDelivery = Boolean(hasV2SpecialFlag || effDcFormula || effSaveStr || merged.recharge || effRechargeDice || effRange || effAttack);

      // Structural gate: damage plus a delivery (save / DC / recharge / range / area / attack roll).
      if (!item._powersOnly && hasDmgParts && hasDelivery) {
        emitted = true;
        emitAttack({
          key: entryKey,
          id: merged.id || entryKey,
          entryId: merged.id || entryKey,
          modeId: primaryMode?.id || null,
          resourceId: anyRes?.id || null,
          roundRes,
          name: entryName,
          source: entrySource,
          damageParts: effDamageParts,
          save: effSaveStr,
          dcFormula: effDcFormula,
          range: effRange,
          area: merged.area || (primaryMode && primaryMode.area) || '',
          rangeOnly: merged.range || (primaryMode && primaryMode.range) || '',
          isBreath: Boolean(rf.isBreathWeapon),
          attack: effAttack,
          recharge: merged.recharge || (effRechargeDice ? `${effRechargeDice} rounds` : ''),
          rechargeDice: effRechargeDice,
          actionCandidate: dbExplicitAction || itemNonDefaultAction || (primaryMode && (primaryMode.action || primaryMode.actionType)) || merged.action || merged.actionType || 'Standard Action',
          benefit: benText
        });
      }

      // (b) Each Rule Crafter sub-power (entry.powers[]) as its own special attack keyed `entryId:powerId`.
      entryPowers.forEach(pw => {
        const pwHasDmg = Array.isArray(pw.damageParts) && pw.damageParts.some(dp => dp && dp.dice);
        const pwSaveStr = pw.save ? `${pw.save.type} (${pw.save.onSave})` : '';
        emitted = true;
        emitAttack({
          key: `${entryKey}:${String(pw.id).replace(/[^a-z0-9_:-]+/gi, '_')}`,
          id: `${merged.id || entryKey}:${pw.id}`,
          entryId: merged.id || entryKey,
          powerId: pw.id,
          name: String(pw.name).trim().toLowerCase() === String(entryName).trim().toLowerCase() ? entryName : `${entryName} — ${pw.name}`,
          source: entrySource,
          damageParts: pw.damageParts,
          save: pwSaveStr,
          dcFormula: pw.dcFormula,
          range: [pw.area, pw.range].filter(Boolean).join(', '),
          area: pw.area,
          rangeOnly: pw.range,
          attack: pw.attack,
          usage: pw.usage,
          usageText: pw.usageText,
          recharge: pw.rechargeDice ? `${pw.rechargeDice} rounds` : '',
          rechargeDice: pw.rechargeDice,
          spellLevel: pw.spellLevel,
          attachedSpell: (pw.kind === 'attached' && pw.refId) ? String(pw.refId) : '',
          actionCandidate: pw.action || 'Standard Action',
          utility: !pwHasDmg,
          summary: pw.summary,
          benefit: pw.text || benText
        });
      });

      if (emitted) {
        seen.add(identityKey);
        if (!seenNames.has(lower)) seenNames.set(lower, new Set());
        seenNames.get(lower).add(identityKey);
      }
    });

    const migrator = (typeof window !== 'undefined' && window.SchemaMigrator)
      || (typeof SchemaMigrator !== 'undefined' ? SchemaMigrator : null);
    if (migrator && typeof migrator.getAbilityStemAndScore === 'function' && result.length > 1) {
      const stemMaxScore = new Map();
      for (let i = 0; i < result.length; i++) {
        const info = migrator.getAbilityStemAndScore(result[i]);
        if (!info.stem) continue;
        const prev = stemMaxScore.has(info.stem) ? stemMaxScore.get(info.stem) : -Infinity;
        if (info.score > prev) stemMaxScore.set(info.stem, info.score);
      }
      return result.filter(r => {
        if (!r) return false;
        if (Array.isArray(r.overrides) && r.overrides.length > 0) return true;
        if (Array.isArray(r.modifiers) && r.modifiers.length > 0) return true;
        const info = migrator.getAbilityStemAndScore(r);
        if (!info.stem) return true;
        const maxScore = stemMaxScore.get(info.stem);
        if (maxScore !== undefined && maxScore >= 2 && info.score < maxScore) {
          if (info.isMalformedSlug || (info.score <= 1 && !info.hasTypedDamage && !info.hasSaveOrDc)) {
            return false;
          }
        }
        return true;
      });
    }

    return result;
  },

  /**
   * Pure Active Combat Buffs Strip derivation helper (Phase R3).
   * Computes effective casterLevel, duration, and summary without mutating `w.buffs`.
   */
  deriveActiveBuffsStrip(w) {
    if (!w || !Array.isArray(w.buffs)) return [];
    const charLevel = Number(w.level) || 1;
    const result = [];
    w.buffs.forEach((b, idx) => {
      if (!b || (b.active === false && !b.pinnedToCombat)) return;
      const buffId = b.id || ('buff_' + String(b.name || idx).toLowerCase().replace(/[^a-z0-9]+/g, '_'));
      const rawBCl = Number(b.casterLevel || b.cl || charLevel) || 1;
      const minDomainCl = typeof this.getSpellEffectiveCasterLevel === 'function'
        ? this.getSpellEffectiveCasterLevel(b, w, charLevel)
        : rawBCl;
      const casterLevel = Math.max(rawBCl, minDomainCl);
      const spec = typeof this.resolveSpellBuffSpec === 'function'
        ? this.resolveSpellBuffSpec(b, w, casterLevel)
        : null;
      const duration = (casterLevel > rawBCl && spec?.durationText)
        ? spec.durationText
        : (b.durationText || b.duration || spec?.durationText || '');
      const summary = b.summary || spec?.summaryText || b.notes || b.description || 'Active Buff';
      const clBonusInfo = typeof this.getSpellCasterLevelBonus === 'function'
        ? this.getSpellCasterLevelBonus(b, w)
        : { bonus: 0, sources: [] };
      result.push({
        idx,
        id: buffId,
        buffId,
        name: b.name || 'Buff',
        active: b.active !== false,
        isPinned: Boolean(b.pinnedToCombat),
        casterLevel,
        effectiveCasterLevel: casterLevel,
        duration,
        summary,
        isSpellBuff: Boolean(b.source === 'Spell' || spec?.isBuffSpell),
        clBonus: clBonusInfo.bonus || 0,
        clSources: clBonusInfo.sources || [],
        targetWeapon: b.targetWeapon || null,
        chosenEnergy: b.chosenEnergy || null
      });
    });
    return result;
  },

  INVENTORY_SLOT_DEFS: Object.freeze([
    { key: 'head', alias: null, trName: 'Head / Helm', label: 'Head' },
    { key: 'eyes', alias: 'face', trName: 'Eyes / Goggles', label: 'Eyes' },
    { key: 'neck', alias: 'throat', trName: 'Neck / Amulet', label: 'Neck' },
    { key: 'shoulders', alias: null, trName: 'Shoulders / Cloak', label: 'Shoulders' },
    { key: 'armor', alias: 'body', trName: 'Body / Armor', label: 'Armor' },
    { key: 'torso', alias: null, trName: 'Torso / Vest', label: 'Torso' },
    { key: 'bracers', alias: 'arms', trName: 'Arms / Bracers', label: 'Bracers' },
    { key: 'gloves', alias: 'hands', trName: 'Hands / Gloves', label: 'Gloves' },
    { key: 'ring1', alias: null, trName: 'Left Ring', label: 'Ring 1' },
    { key: 'ring2', alias: null, trName: 'Right Ring', label: 'Ring 2' },
    { key: 'belt', alias: 'waist', trName: 'Waist / Belt', label: 'Belt' },
    { key: 'boots', alias: 'feet', trName: 'Feet / Boots', label: 'Boots' },
    { key: 'mainHand', alias: null, trName: 'Main Hand (Weapon)', label: 'Main Hand' },
    { key: 'offHand', alias: null, trName: 'Off-Hand / Shield', label: 'Off-Hand' }
  ]),

  normalizeItemDailyCharges(item) {
    if (!item || typeof item !== 'object') return null;
    if (item.dailyCharges && typeof item.dailyCharges === 'object' && typeof item.dailyCharges.max === 'number' && item.dailyCharges.max > 0) {
      const maxVal = Number(item.dailyCharges.max) || 1;
      const curVal = item.dailyCharges.current !== undefined && item.dailyCharges.current !== null
        ? Math.max(0, Math.min(maxVal, Number(item.dailyCharges.current)))
        : maxVal;
      return {
        current: curVal,
        max: maxVal,
        unit: item.dailyCharges.unit || 'charges',
        recharge: item.dailyCharges.recharge || 'long_rest'
      };
    }
    if (typeof item.dailyCharges === 'number' && item.dailyCharges > 0) {
      return { current: item.dailyCharges, max: item.dailyCharges, unit: 'charges', recharge: 'long_rest' };
    }
    const dbItem = this.getMasterDbEntry ? this.getMasterDbEntry(item) : null;
    const v3Effects = (Array.isArray(item.effects) && item.effects.length > 0)
      ? item.effects
      : (dbItem && Array.isArray(dbItem.effects) ? dbItem.effects : []);
    if (v3Effects.length > 0) {
      const resBlk = v3Effects.find(b => b && (b.type === 'resource' || (b.type === 'carrier' && b.costMode === 'rod')));
      if (resBlk) {
        const maxVal = Math.max(1, Number(resBlk.max ?? resBlk.uses ?? resBlk.value ?? 1) || 1);
        const unit = resBlk.unit || (/round/i.test(String(resBlk.name || '')) ? 'rounds' : (resBlk.type === 'carrier' || /charge/i.test(String(resBlk.name || '')) ? 'charges' : 'uses'));
        return { current: maxVal, max: maxVal, unit, recharge: 'long_rest' };
      }
    }
    const combined = `${item.name || ''} ${item.desc || ''} ${item.effect || ''} ${item.benefit || ''}`;
    const match = combined.match(/(\d+)\s*(?:charges?|rounds?|uses?|times?)?\s*(?:\/|\s*per\s*|\s*x\s*|\s*a\s*)\s*day/i);
    if (match) {
      const maxVal = parseInt(match[1], 10) || 1;
      let unit = 'charges';
      const matchedStr = match[0].toLowerCase();
      if (matchedStr.includes('round')) unit = 'rounds';
      else if (matchedStr.includes('use')) unit = 'uses';
      return { current: maxVal, max: maxVal, unit, recharge: 'long_rest' };
    }
    return null;
  },

  inferInventoryItemCategory(entry) {
    if (!entry || typeof entry !== 'object') return 'Other';
    if (entry.category && entry.category !== 'Other') return entry.category;
    const type = String(entry.type || entry.subCategory || entry.category || '').toLowerCase();
    const slot = String(entry.slot || '').toLowerCase();
    const name = String(entry.name || '').toLowerCase();
    if (type.includes('crystal') || slot.includes('crystal')) return 'Crystal';
    if (type.includes('weapon') || slot.includes('main hand') || slot.includes('two hand') || slot.includes('off hand')) return 'Weapon';
    if (type.includes('shield') || slot.includes('shield') || name.includes('shield') || name.includes('buckler')) return 'Shield';
    if (type.includes('armor') || slot === 'armor' || slot === 'body') return 'Armor';
    if (type.includes('potion') || type.includes('scroll') || type.includes('wand') || type.includes('consumable') || type === 'ammo' || name.startsWith('scroll of') || name.startsWith('potion of') || name.startsWith('wand of') || name.startsWith('elixir of') || name.startsWith('oil of')) return 'Consumable';
    if (slot.includes('head') || slot.includes('helm') || type.includes('head')) return 'Head';
    if (slot.includes('eyes') || slot.includes('face') || slot.includes('goggles')) return 'Eyes';
    if (slot.includes('neck') || slot.includes('throat') || slot.includes('amulet') || slot.includes('periapt')) return 'Neck';
    if (slot.includes('shoulder') || slot.includes('cloak') || slot.includes('cape')) return 'Shoulders';
    if (slot.includes('torso') || slot.includes('vest') || slot.includes('shirt')) return 'Torso';
    if (slot.includes('belt') || slot.includes('waist')) return 'Belt';
    if (slot.includes('arm') || slot.includes('bracer')) return 'Bracers';
    if (slot.includes('hand') || slot.includes('glove') || slot.includes('gauntlet')) return 'Gloves';
    if (slot.includes('ring') || type.includes('ring') || name.startsWith('ring of')) return 'Ring';
    if (slot.includes('feet') || slot.includes('boot')) return 'Boots';
    if (type.includes('tool')) return 'Tool';
    if (type.includes('rod')) return 'Rod';
    if (type.includes('staff')) return 'Staff';
    if (type.includes('wondrous')) return 'Wondrous';
    if (/\b(?:dagger|sword|blade|axe|bow|crossbow|mace|spear|hammer|rapier|scimitar|flail|halberd|glaive|lance|morningstar|scythe|trident|quarterstaff|sling|dart|javelin|shuriken|kama|nunchaku|siangham|kukri|falchion|whip|club|greatclub)\b/i.test(name)) return 'Weapon';
    if (/\b(?:plate|mail|leather|padded|hide|hauberk|cuirass)\b/i.test(name)) return 'Armor';
    return 'Other';
  },

  /**
   * Pure Inventory View-Model Derivation (Phase R4):
   * Computes `encumbranceView`, `wealthView`, `bodySlotsView`, `poolRows`, `weaponsView`, and `armorView`
   * without mutating `w.bodySlots` or `w.gearPool` during render.
   */
  deriveInventoryView(w) {
    if (!w || typeof w !== 'object') {
      const fallbackCaps = this.getCarryingCapacity(10);
      return {
        encumbranceView: {
          equippedWeight: 0,
          poolWeight: 0,
          totalWeight: 0,
          strScore: 10,
          capacities: fallbackCaps,
          loadStatus: this.getLoadStatus(0, 10),
          barPct: 0
        },
        wealthView: { pp: 0, gp: 0, sp: 0, cp: 0, totalGpEquivalent: 0, gearGpValue: 0 },
        bodySlotsView: { slotsByKey: {}, slotList: [] },
        poolRows: [],
        weaponsView: [],
        armorView: []
      };
    }

    // Weights, carrying capacity and load come from the engine's single encumbrance derivation (also used by the AC).
    const encumbranceView = this.computeEncumbrance(w);
    const rawSlots = w.bodySlots || {};
    const rawPool = Array.isArray(w.gearPool) ? w.gearPool : [];

    // 1. Body Slots View (14 canonical slots + aliases)
    const slotsByKey = {};
    const slotList = [];
    let equippedGearGpValue = 0;
    const equippedNameToSlotKey = new Map();

    this.INVENTORY_SLOT_DEFS.forEach((def) => {
      const rawSlot = rawSlots[def.key] || (def.alias ? rawSlots[def.alias] : null) || null;
      const cloned = rawSlot ? JSON.parse(JSON.stringify(rawSlot)) : { name: '-', active: false, weight: 0, cost: 0, desc: '' };
      const isOccupied = Boolean(cloned && cloned.name && cloned.name !== '-');
      const isActive = Boolean(isOccupied && cloned.active !== false);
      const normCat = isOccupied ? this.inferInventoryItemCategory(cloned) : 'None';
      if (isOccupied && (!cloned.category || cloned.category === 'Other')) {
        cloned.category = normCat;
      }
      const normDc = isOccupied ? this.normalizeItemDailyCharges(cloned) : null;
      if (normDc) {
        cloned.dailyCharges = normDc;
      }
      const weightVal = isOccupied ? (Number(cloned.weight ?? cloned.weightLb) || 0) : 0;
      const costVal = isOccupied ? (Number(cloned.cost ?? cloned.priceGp) || 0) : 0;
      if (isOccupied) {
        equippedGearGpValue += costVal;
        const cleanSlotName = String(cloned.name || '').toLowerCase().trim();
        if (cleanSlotName && !equippedNameToSlotKey.has(cleanSlotName)) {
          equippedNameToSlotKey.set(cleanSlotName, def.key);
        }
      }
      const slotEntry = Object.assign({}, cloned, {
        slotKey: def.key,
        aliasKey: def.alias,
        slotLabel: def.label,
        trName: def.trName,
        isOccupied,
        isActive,
        weight: weightVal,
        cost: costVal,
        dailyCharges: normDc
      });
      slotsByKey[def.key] = slotEntry;
      if (def.alias) {
        slotsByKey[def.alias] = slotEntry;
      }
      slotList.push(slotEntry);
    });

    // 2. Pool Rows View (cloned & normalized without mutating character.gearPool)
    const EQUIP_CATS = new Set([
      'Weapon', 'Armor', 'Shield', 'Ring', 'Head', 'Eyes', 'Neck', 'Shoulders',
      'Torso', 'Belt', 'Bracers', 'Gloves', 'Boots', 'Wondrous', 'Crystal'
    ]);
    let poolGearGpValue = 0;
    const poolRows = rawPool.filter(Boolean).map((rawItem, idx) => {
      const cloned = JSON.parse(JSON.stringify(rawItem));
      const normCat = this.inferInventoryItemCategory(cloned);
      if (!cloned.category || cloned.category === 'Other') {
        cloned.category = normCat;
      }
      if (!cloned.slot || cloned.slot === 'Other' || cloned.slot === 'None') {
        cloned.slot = cloned.category;
      }
      const qty = (cloned.qty !== undefined && cloned.qty !== null) ? Math.max(0, Number(cloned.qty)) : 1;
      const unitWeight = Number(cloned.weight ?? cloned.weightLb) || 0;
      const unitCost = Number(cloned.cost ?? cloned.priceGp) || 0;
      const cleanName = String(cloned.name || '').toLowerCase().trim();
      const equippedSlotKey = equippedNameToSlotKey.get(cleanName) || (cloned.isEquipped ? (cloned.equippedSlotKey || null) : null);
      const isEquipped = Boolean(cloned.isEquipped || equippedSlotKey);
      poolGearGpValue += unitCost * Math.max(1, qty);
      const totalItemWeight = Math.round(unitWeight * qty * 10) / 10;
      const normDc = this.normalizeItemDailyCharges(cloned);
      if (normDc) {
        cloned.dailyCharges = normDc;
      }
      const inBelt = Boolean(cloned.isBelt || cloned.inBelt);
      const isEquippable = EQUIP_CATS.has(cloned.category);
      const isConsumable = Boolean(cloned.category === 'Consumable' || inBelt || normDc);
      return Object.assign(cloned, {
        idx,
        id: cloned.id !== undefined ? cloned.id : `pool_${idx}`,
        category: cloned.category,
        slot: cloned.slot,
        qty,
        weight: unitWeight,
        totalWeight: totalItemWeight,
        cost: unitCost,
        charges: normDc ? normDc.current : (Number(cloned.charges) || 0),
        dailyCharges: normDc,
        inBelt,
        isBelt: inBelt,
        isEquippable,
        isConsumable,
        isEquipped,
        equippedSlotKey
      });
    });

    // 3. Wealth View
    const rawWealth = w.wealth || w.currency || {};
    const pp = Math.max(0, Number(rawWealth.pp ?? w.pp ?? 0) || 0);
    const gp = Math.max(0, Number(rawWealth.gp ?? w.gp ?? w.gold ?? 0) || 0);
    const sp = Math.max(0, Number(rawWealth.sp ?? w.sp ?? 0) || 0);
    const cp = Math.max(0, Number(rawWealth.cp ?? w.cp ?? 0) || 0);
    const totalGpEquivalent = Math.round((pp * 10 + gp + sp * 0.1 + cp * 0.01) * 100) / 100;
    const gearGpValue = Math.round((equippedGearGpValue + poolGearGpValue) * 100) / 100;

    // 4. Weapons View & Armor View
    const weaponsView = [];
    const seenWeaponNames = new Set();
    ['mainHand', 'offHand'].forEach((sk) => {
      const sEntry = slotsByKey[sk];
      if (sEntry && sEntry.isOccupied && sEntry.category === 'Weapon') {
        weaponsView.push(Object.assign({}, sEntry, { isEquipped: true, equippedSlotKey: sk }));
        seenWeaponNames.add(String(sEntry.name || '').toLowerCase().trim());
      }
    });
    poolRows.forEach((p) => {
      if (p.category === 'Weapon') {
        const key = String(p.name || '').toLowerCase().trim();
        if (!seenWeaponNames.has(key)) {
          weaponsView.push(p);
          seenWeaponNames.add(key);
        }
      }
    });

    const armorView = [];
    const seenArmorNames = new Set();
    ['armor', 'offHand'].forEach((sk) => {
      const sEntry = slotsByKey[sk];
      if (sEntry && sEntry.isOccupied && (sEntry.category === 'Armor' || sEntry.category === 'Shield')) {
        armorView.push(Object.assign({}, sEntry, { isEquipped: true, equippedSlotKey: sk }));
        seenArmorNames.add(String(sEntry.name || '').toLowerCase().trim());
      }
    });
    poolRows.forEach((p) => {
      if (p.category === 'Armor' || p.category === 'Shield') {
        const key = String(p.name || '').toLowerCase().trim();
        if (!seenArmorNames.has(key)) {
          armorView.push(p);
          seenArmorNames.add(key);
        }
      }
    });

    return {
      encumbranceView,
      wealthView: {
        pp,
        gp,
        sp,
        cp,
        totalGpEquivalent,
        gearGpValue
      },
      bodySlotsView: {
        slotsByKey,
        slotList
      },
      poolRows,
      weaponsView,
      armorView
    };
  },

  /**
   * Pure Spells & Maneuvers view-model derivation (Phase R5 Strangler Fig).
   * Computes `casterStatsView`, `slotsByLevelView`, `spellsByLevelView`, and `maneuversView`
   * without mutating `w.spellcasting` or `w.tomeOfBattle`.
   */
  deriveSpellsView(w, workingDb = []) {
    if (!w || typeof w !== 'object') {
      return {
        casterStatsView: {},
        slotsByLevelView: { spontaneous: {}, prepared: {}, divine: {}, spontaneousArray: [], preparedArray: [], divineArray: [] },
        spellsByLevelView: { knownSpells: [], preparedSpells: [], divineSpells: [] },
        maneuversView: { initiatorLevel: 0, maxManeuverLevel: 0, maneuversKnown: [], readiedManeuvers: [], stancesKnown: [], activeStance: '' }
      };
    }

    const abi = w.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const strMod = this.getAbilityMod(abi.str || 10);
    const dexMod = this.getAbilityMod(abi.dex || 10);
    const conMod = this.getAbilityMod(abi.con || 10);
    const intVal = Number(w.stats?.INT?.value ?? abi.int ?? 10);
    const intMod = this.getAbilityMod(intVal);
    const baseWisVal = Number(w.stats?.WIS?.value ?? abi.wis ?? 10);
    const chaVal = Number(w.stats?.CHA?.value ?? abi.cha ?? 10);
    const chaMod = this.getAbilityMod(chaVal);

    const classifyClass = (className) => {
      const c = String(className || '').toLowerCase().trim();
      if (!c) return null;
      if (['wizard', 'artificer', 'archivist', 'wu jen', "sha'ir", 'archmage', 'loremaster', 'incantatrix', 'red wizard', 'pale master', 'eldritch knight', 'arcane trickster', 'abjurant champion'].some(k => c.includes(k))) return 'prepared';
      if (['cleric', 'creric', 'druid', 'paladin', 'ranger', 'spirit shaman', 'shugenja', 'healer', 'adept', 'priest', 'hierophant', 'contemplative', 'radiant servant', 'hospitaler', 'warpriest', 'divine oracle', 'church inquisitor'].some(k => c.includes(k))) return 'divine';
      if (['sorcerer', 'bard', 'favored soul', 'warlock', 'warmage', 'duskblade', 'beguiler', 'dread necromancer', 'dragonfire adept', 'spellthief'].some(k => c.includes(k))) return 'spontaneous';
      if (['warblade', 'swordsage', 'crusader', 'bloodclaw master', 'deepstone sentinel', 'eternal blade', 'jade phoenix mage', 'master of nine', 'ruby knight vindicator', 'shadow sun ninja'].some(k => c.includes(k))) return 'martial';
      return null;
    };

    const discLevels = { spontaneous: 0, prepared: 0, divine: 0, martial: 0 };
    const totalDiscLevels = () => discLevels.spontaneous + discLevels.prepared + discLevels.divine + discLevels.martial;
    const allProg = Array.isArray(w.levelProgression) ? w.levelProgression.filter(Boolean) : [];
    const activeProg = allProg.filter(p => p.active !== false);
    activeProg.forEach(p => {
      const d = classifyClass(p.className || p.class || p.name);
      if (d) discLevels[d] += 1;
    });
    if (totalDiscLevels() === 0 && allProg.length > 0) {
      allProg.forEach(p => {
        const d = classifyClass(p.className || p.class || p.name);
        if (d) discLevels[d] += 1;
      });
    }
    if (totalDiscLevels() === 0 && Array.isArray(w.progression) && w.progression.length > 0) {
      w.progression.forEach(p => {
        const d = classifyClass(p?.className || p?.class || p?.name);
        if (d) discLevels[d] += 1;
      });
    }
    if (totalDiscLevels() === 0 && Array.isArray(w.classProgression) && w.classProgression.length > 0) {
      w.classProgression.forEach(cp => {
        const d = classifyClass(cp?.className || cp?.name || cp?.class);
        if (d) discLevels[d] += (Number(cp?.level) || 1);
      });
    }
    if (totalDiscLevels() === 0 && w.classLevels && typeof w.classLevels === 'object' && !Array.isArray(w.classLevels)) {
      Object.entries(w.classLevels).forEach(([cName, cLvl]) => {
        const d = classifyClass(cName);
        if (d) discLevels[d] += (Number(cLvl) || 0);
      });
    }
    if (totalDiscLevels() === 0 && Array.isArray(w.classes) && w.classes.length > 0) {
      w.classes.forEach(c => {
        const name = typeof c === 'string' ? c : (c?.name || c?.className || c?.class || '');
        const lvl = (c && typeof c === 'object') ? (Number(c.level) || 1) : (Number(w.level) || 1);
        const d = classifyClass(name);
        if (d) discLevels[d] += lvl;
      });
    } else if (totalDiscLevels() === 0 && typeof w.classes === 'string' && w.classes.trim()) {
      const parts = w.classes.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        const numMatch = part.match(/(\d+)/);
        const lvl = numMatch ? (parseInt(numMatch[1], 10) || 1) : (parts.length === 1 ? (Number(w.level) || 1) : 1);
        const d = classifyClass(part);
        if (d) discLevels[d] += lvl;
      });
    }
    if (totalDiscLevels() === 0) {
      const fallbackDisc = classifyClass(w.spellcasting?.primaryClass || w.class);
      if (fallbackDisc) discLevels[fallbackDisc] += (Number(w.spellcasting?.cl || w.level) || 1);
    }

    const getBoonDisciplines = () => {
      if (!w.settings) return [];
      const valid = ['spontaneous', 'prepared', 'divine', 'martial', 'warlock'];
      if (Array.isArray(w.settings.boonDisciplines)) {
        const list = w.settings.boonDisciplines
          .map(d => String(d || '').toLowerCase().trim())
          .filter(d => valid.includes(d));
        if ((w.settings.warlockBoon === true || String(w.settings.clMode || '').includes('Warlock Boon')) && !list.includes('warlock')) {
          list.push('warlock');
        }
        return Array.from(new Set(list));
      }
      const clMode = w.settings.clMode || 'Class Level';
      const isWarlockBoon = clMode.includes('Warlock Boon') || w.settings.warlockBoon === true;
      const isHomebrewActive = (clMode === 'Character Level (Homebrew)') || isWarlockBoon;
      if (!isHomebrewActive) return [];
      const out = [];
      if (isWarlockBoon) out.push('warlock');
      const rawCasterType = String(w.settings.casterType || '').toLowerCase().trim();
      if (w.settings.casterTypeExplicit === true && valid.includes(rawCasterType)) {
        if (!out.includes(rawCasterType)) out.push(rawCasterType);
      } else if (clMode === 'Character Level (Homebrew)') {
        const order = ['spontaneous', 'prepared', 'divine', 'martial'];
        let bestDisc = null;
        let maxLvl = 0;
        order.forEach(d => {
          if ((discLevels[d] || 0) > maxLvl) {
            maxLvl = discLevels[d];
            bestDisc = d;
          }
        });
        const fallback = valid.includes(rawCasterType) ? rawCasterType : (bestDisc || 'spontaneous');
        if (!out.includes(fallback)) out.push(fallback);
      }
      return out;
    };

    const boonDisciplines = getBoonDisciplines();
    const isDiscBoon = (disc) => {
      const target = String(disc || '').toLowerCase().trim();
      if (target === 'spontaneous') return boonDisciplines.includes('spontaneous') || boonDisciplines.includes('warlock');
      if (target === 'warlock') return boonDisciplines.includes('warlock') || Boolean(w.settings?.warlockBoon);
      return boonDisciplines.includes(target);
    };

    const isSpontBoon = isDiscBoon('spontaneous');
    const isWarlockBoon = isDiscBoon('warlock');
    const isPrepBoon = isDiscBoon('prepared');
    const isDivBoon = isDiscBoon('divine');
    const isMartialBoon = isDiscBoon('martial');

    let martialStudyCount = 0;
    let martialStanceCount = 0;
    const progFeats = [];
    activeProg.forEach(p => {
      (p.feats || []).forEach(f => progFeats.push(String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase()));
    });
    if (progFeats.length > 0) {
      martialStudyCount = progFeats.filter(f => f.includes('martial study')).length;
      martialStanceCount = progFeats.filter(f => f.includes('martial stance')).length;
    } else {
      const topFeats = (w.feats || []).map(f => String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase());
      martialStudyCount = topFeats.filter(f => f.includes('martial study')).length;
      martialStanceCount = topFeats.filter(f => f.includes('martial stance')).length;
    }

    const classNames = [];
    if (Array.isArray(w.classes)) w.classes.forEach(c => { if (c && c.name) classNames.push(String(c.name).toLowerCase().trim()); });
    if (typeof w.classes === 'string' && w.classes) classNames.push(w.classes.toLowerCase().trim());
    if (typeof w.class === 'string' && w.class) classNames.push(w.class.toLowerCase().trim());
    if (Array.isArray(w.classProgression)) w.classProgression.forEach(cp => { if (cp && cp.className) classNames.push(String(cp.className).toLowerCase().trim()); });
    if (Array.isArray(w.levelProgression)) w.levelProgression.forEach(lp => { if (lp && lp.className) classNames.push(String(lp.className).toLowerCase().trim()); });
    if (w.classLevels && typeof w.classLevels === 'object' && !Array.isArray(w.classLevels)) {
      Object.entries(w.classLevels).forEach(([cName, cLvl]) => {
        if ((Number(cLvl) || 0) > 0) classNames.push(String(cName).toLowerCase().trim());
      });
    }
    if (classNames.length === 0 && w.spellcasting?.primaryClass) classNames.push(String(w.spellcasting.primaryClass).toLowerCase().trim());
    if (w.isNpc && w.spellcasting && (w.spellcasting.cl > 0 || (w.spellcasting.slots && w.spellcasting.slots.length > 0) || (w.spellcasting.knownSpells && w.spellcasting.knownSpells.length > 0) || (w.spells && w.spells.length > 0))) {
      classNames.push(String(w.spellcasting.primaryClass || 'sorcerer').toLowerCase());
    }

    const hasSpontSlots = (w.isNpc && Array.isArray(w.spellcasting?.slots) && w.spellcasting.slots.some(s => (Number(s.daily) || 0) > 0))
      || (Array.isArray(w.spellcasting?.slots) && w.spellcasting.slots.some(s => (Number(s.dmBonus) || 0) > 0))
      || (Array.isArray(w.spellcasting?.knownSpells) && w.spellcasting.knownSpells.length > 0);
    const hasPrepSlots = (Array.isArray(w.spellcasting?.preparedSlots) && w.spellcasting.preparedSlots.some(s => (Number(s.dmBonus) || 0) > 0))
      || (Array.isArray(w.spellcasting?.preparedSpells) && w.spellcasting.preparedSpells.length > 0);
    const hasDivSlots = (Array.isArray(w.spellcasting?.divineSlots) && w.spellcasting.divineSlots.some(s => (Number(s.dmBonus) || 0) > 0))
      || (Array.isArray(w.spellcasting?.divineSpells) && w.spellcasting.divineSpells.length > 0);
    const hasMartialDmBonus = ((Number(w.tomeOfBattle?.dmReadiedBonus) || 0) > 0)
      || ((Number(w.tomeOfBattle?.dmKnownBonus) || 0) > 0)
      || ((Number(w.tomeOfBattle?.dmStanceBonus) || 0) > 0);
    const hasMartialSlots = martialStudyCount > 0 || martialStanceCount > 0 || hasMartialDmBonus
      || (w.isNpc && Array.isArray(w.tomeOfBattle?.maneuversKnown) && w.tomeOfBattle.maneuversKnown.length > 0);

    const hasSpontaneous = classNames.some(c => classifyClass(c) === 'spontaneous') || hasSpontSlots || isSpontBoon
      || (w.isNpc && Boolean(w.spellcasting?.cl || w.spellcasting?.slots?.length || w.spellcasting?.knownSpells?.length || w.spells?.length));
    const hasPrepared = classNames.some(c => classifyClass(c) === 'prepared') || hasPrepSlots || isPrepBoon;
    const hasDivine = classNames.some(c => classifyClass(c) === 'divine') || hasDivSlots || isDivBoon;
    const hasMartial = classNames.some(c => classifyClass(c) === 'martial') || hasMartialSlots || isMartialBoon;

    const activeLevels = activeProg.length || Number(w.level) || 0;
    const sorcLvls = discLevels.spontaneous || 0;
    const wizLvls = discLevels.prepared || 0;
    const divLvls = discLevels.divine || 0;
    const rawClMode = w.settings?.clMode || 'Class Level';

    const casterLevelBonus = Number(w.ruleFlags?.casterLevelBonus) || 0;
    const spellDcBonus = Number(w.ruleFlags?.spellDcBonus) || 0;

    // 1. Spontaneous Caster Info
    const defaultSpontClass = isWarlockBoon && sorcLvls === 0
      ? 'Warlock (Homebrew)'
      : (isSpontBoon && sorcLvls === 0 ? 'Sorcerer (Homebrew)' : 'Sorcerer');
    const spontClassLabel = w.spellcasting?.primaryClass || (hasSpontaneous ? defaultSpontClass : (w.isNpc ? 'Sorcerer' : ''));
    let spontStatKey = 'CHA';
    if (['Wizard', 'Artificer'].includes(spontClassLabel)) spontStatKey = 'INT';
    else if (['Cleric', 'Druid', 'Favored Soul'].includes(spontClassLabel)) spontStatKey = 'WIS';
    else if (w.spellcasting?.statName) spontStatKey = w.spellcasting.statName;
    else if (w.spellcasting?.ability) spontStatKey = String(w.spellcasting.ability).toUpperCase();
    const spontStatVal = Number(w.stats?.[spontStatKey]?.value ?? abi[spontStatKey.toLowerCase()] ?? 10);
    const spontStatMod = this.getAbilityMod(spontStatVal);
    const spontClMode = isSpontBoon
      ? (isWarlockBoon ? 'Warlock Boon (CL = Char Lvl)' : 'Character Level (Homebrew)')
      : rawClMode;
    let spontCl = 0;
    if (w.isNpc && (w.spellcasting?.cl !== undefined || w.spellcasting?.caster_level !== undefined)) {
      spontCl = Number(w.spellcasting.cl ?? w.spellcasting.caster_level) || 0;
    } else if (isSpontBoon) {
      const rawCl = w.spellcasting?.caster_level ?? w.spellcasting?.cl ?? sorcLvls;
      spontCl = Math.max(Number(rawCl) || 1, sorcLvls, activeLevels, 1);
    } else if (sorcLvls > 0) {
      spontCl = sorcLvls;
    } else if (hasSpontaneous) {
      spontCl = 1;
    }

    // 2. Prepared Caster Info
    let prepCl = 0;
    if (isPrepBoon) prepCl = Math.max(wizLvls, activeLevels, 1);
    else if (wizLvls > 0) prepCl = wizLvls;
    else if (hasPrepared) prepCl = 1;
    const prepClMode = isPrepBoon ? 'Character Level (Homebrew)' : rawClMode;

    // 3. Divine Caster Info & Domains (pure, no mutation of w.spellcasting.domains)
    const getPureClericDomains = () => {
      if (Array.isArray(w.spellcasting?.domains) && w.spellcasting.domains.some(Boolean)) {
        return w.spellcasting.domains.filter(Boolean);
      }
      const harvested = [];
      activeProg.forEach(p => {
        [...(p.specialAbilities || []), ...(p.feats || [])].forEach(str => {
          const m = String(str || '').match(/Domain:\s*([A-Za-z]+)/i);
          if (m && m[1] && !harvested.includes(m[1])) harvested.push(m[1]);
        });
      });
      return harvested.slice(0, 2);
    };
    const chosenDomains = getPureClericDomains();
    let divCl = 0;
    if (isDivBoon) divCl = Math.max(divLvls, activeLevels, 1);
    else if (divLvls > 0) divCl = divLvls;
    else if (hasDivine) divCl = 1;
    const hasMadness = chosenDomains.some(d => String(d || '').toLowerCase() === 'madness');
    const insanityBonus = (hasMadness && (divLvls > 0 || divCl > 0)) ? Math.max(1, Math.floor((divLvls || divCl || 1) / 2)) : 0;
    const wisVal = baseWisVal + insanityBonus;
    const wisMod = this.getAbilityMod(wisVal);
    const divClMode = isDivBoon ? 'Character Level (Homebrew)' : rawClMode;

    const hasDomainCap = (() => {
      const rNames = [];
      activeProg.forEach(p => { if (p.className || p.class) rNames.push(String(p.className || p.class).toLowerCase().trim()); });
      if (rNames.length === 0 && Array.isArray(w.classProgression)) {
        w.classProgression.forEach(cp => { if (cp?.className || cp?.name) rNames.push(String(cp.className || cp.name).toLowerCase().trim()); });
      }
      if (rNames.length === 0 && typeof w.classes === 'string' && w.classes) {
        w.classes.split(/[\/,]/).forEach(s => rNames.push(s.toLowerCase().trim()));
      }
      if (rNames.length === 0 && typeof w.class === 'string' && w.class) {
        rNames.push(w.class.toLowerCase().trim());
      }
      if (rNames.some(c => ['cleric', 'creric', 'priest', 'radiant servant', 'contemplative', 'church inquisitor', 'divine oracle', 'warpriest'].some(k => c.includes(k)))) {
        return true;
      }
      return chosenDomains.length > 0;
    })();

    // 4. Pure Slot Calculations
    const calcPureSorcererSlots = (sorcLevel, chaScore, existingSlots = []) => {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : [];
      if (w.isNpc) {
        if (w.spellSlots && typeof w.spellSlots === 'object') {
          const built = [];
          for (let lvl = 0; lvl <= 9; lvl++) {
            const daily = Number(w.spellSlots[lvl]) || 0;
            if (daily > 0 || lvl === 0) {
              const found = prevSlots.find(s => Number(s.level) === lvl);
              built.push({
                level: lvl,
                daily,
                total: daily,
                bonus: 0,
                known: daily,
                dmBonus: found ? (Number(found.dmBonus) || 0) : 0,
                used: found ? Math.min(Number(found.used) || 0, daily) : 0
              });
            }
          }
          return built;
        }
        if (prevSlots.length > 0) return prevSlots.map(s => ({ ...s, total: Number(s.daily) || 0 }));
      }
      if (Number(sorcLevel) <= 0) {
        return prevSlots.filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({ ...s, total: Number(s.daily) || 0 }));
      }
      const clampedLvl = Math.min(20, Math.max(1, Number(sorcLevel) || 1));
      const cMod = Math.floor(((Number(chaScore) || 10) - 10) / 2);
      const basePerLvl = {
        1: [5, 3], 2: [6, 4], 3: [6, 5], 4: [6, 6, 3], 5: [6, 6, 4],
        6: [6, 6, 5, 3], 7: [6, 6, 6, 4], 8: [6, 6, 6, 5, 3], 9: [6, 6, 6, 6, 4], 10: [6, 6, 6, 6, 5, 3],
        11: [6, 6, 6, 6, 6, 4], 12: [6, 6, 6, 6, 6, 5, 3], 13: [6, 6, 6, 6, 6, 6, 4], 14: [6, 6, 6, 6, 6, 6, 5, 3], 15: [6, 6, 6, 6, 6, 6, 6, 4],
        16: [6, 6, 6, 6, 6, 6, 6, 5, 3], 17: [6, 6, 6, 6, 6, 6, 6, 6, 4], 18: [6, 6, 6, 6, 6, 6, 6, 6, 5, 3], 19: [6, 6, 6, 6, 6, 6, 6, 6, 6, 4], 20: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]
      };
      const knownPerLvl = {
        1: [4, 2], 2: [5, 2], 3: [5, 3], 4: [6, 3, 1], 5: [6, 4, 2],
        6: [7, 4, 2, 1], 7: [7, 5, 3, 2], 8: [8, 5, 3, 2, 1], 9: [8, 5, 4, 3, 2], 10: [9, 5, 4, 3, 2, 1],
        11: [9, 5, 5, 3, 2, 2], 12: [9, 5, 5, 4, 3, 2, 1], 13: [9, 5, 5, 4, 3, 2, 2], 14: [9, 5, 5, 4, 4, 3, 2, 1], 15: [9, 5, 5, 4, 4, 3, 2, 2],
        16: [9, 5, 5, 4, 4, 3, 3, 2, 1], 17: [9, 5, 5, 4, 4, 3, 3, 2, 2], 18: [9, 5, 5, 4, 4, 3, 3, 3, 2, 1], 19: [9, 5, 5, 4, 4, 3, 3, 3, 3, 2], 20: [9, 5, 5, 4, 4, 3, 3, 3, 3, 3]
      };
      const base = basePerLvl[clampedLvl] || [6, 6, 4];
      const knownArr = knownPerLvl[clampedLvl] || [6, 4, 2];
      const names = ['Cantrip', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];
      const result = base.map((dailyBase, spellLvl) => {
        const bonus = (spellLvl > 0 && cMod >= spellLvl) ? (1 + Math.floor((cMod - spellLvl) / 4)) : 0;
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const knownBonus = prev ? (Number(prev.knownBonus) || 0) : 0;
        const dailyTotal = Math.max(0, dailyBase + bonus + dmBonus);
        const usedVal = prev ? Math.min(dailyTotal, Math.max(0, Number(prev.used) || 0)) : 0;
        const baseKnown = knownArr[spellLvl] ?? (spellLvl === 0 ? 4 : 1);
        const knownTotal = Math.max(0, baseKnown + knownBonus);
        return {
          level: spellLvl,
          name: names[spellLvl] || `Level ${spellLvl}`,
          known: knownTotal,
          knownBonus,
          daily: dailyTotal,
          total: dailyTotal,
          bonus,
          dmBonus,
          used: usedVal
        };
      });
      prevSlots.forEach(prev => {
        if (prev && Number(prev.level) >= base.length) {
          const dVal = Number(prev.daily) || 0;
          result.push({
            level: Number(prev.level),
            name: names[prev.level] || `Level ${prev.level}`,
            known: Number(prev.known) || dVal,
            knownBonus: Number(prev.knownBonus) || 0,
            daily: dVal,
            total: dVal,
            bonus: 0,
            dmBonus: Number(prev.dmBonus) || 0,
            used: Math.min(dVal, Number(prev.used) || 0)
          });
        }
      });
      return result;
    };

    const calcPureWizardSlots = (wizardLvl, intScore, existingSlots = []) => {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : [];
      if (Number(wizardLvl) <= 0) {
        return prevSlots.filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({ ...s, total: Number(s.daily) || 0 }));
      }
      const lvl = Math.min(20, Math.max(1, Number(wizardLvl) || 1));
      const iMod = Math.floor(((Number(intScore) || 10) - 10) / 2);
      const wizDailyTable = [
        [], [3, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1],
        [4, 3, 3, 2], [4, 4, 3, 2, 1], [4, 4, 3, 3, 2], [4, 4, 4, 3, 2, 1], [4, 4, 4, 3, 3, 2],
        [4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 3, 3, 2], [4, 4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 4, 3, 3, 2], [4, 4, 4, 4, 4, 4, 3, 2, 1],
        [4, 4, 4, 4, 4, 4, 3, 3, 2], [4, 4, 4, 4, 4, 4, 4, 3, 2, 1], [4, 4, 4, 4, 4, 4, 4, 3, 3, 2], [4, 4, 4, 4, 4, 4, 4, 4, 3, 3], [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
      ];
      const baseDaily = wizDailyTable[lvl] || [3, 1];
      const result = baseDaily.map((base, spellLvl) => {
        const bonus = (spellLvl >= 1 && iMod >= spellLvl) ? Math.floor((iMod - spellLvl) / 4) + 1 : 0;
        const itemSlotBonus = Number(w.bonusSpellSlotsByLevel?.[spellLvl]) || 0;
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const daily = Math.max(0, base + bonus + itemSlotBonus + dmBonus);
        return {
          level: spellLvl,
          daily,
          total: daily,
          bonus: bonus + itemSlotBonus,
          dmBonus,
          used: prev ? Math.min(daily, Number(prev.used) || 0) : 0,
          known: daily
        };
      });
      prevSlots.forEach(prev => {
        if (prev && Number(prev.level) >= baseDaily.length) {
          const dVal = Number(prev.daily) || 0;
          result.push({
            level: Number(prev.level),
            daily: dVal,
            total: dVal,
            bonus: 0,
            dmBonus: Number(prev.dmBonus) || 0,
            used: Math.min(dVal, Number(prev.used) || 0),
            known: dVal
          });
        }
      });
      return result;
    };

    const calcPureDivineSlots = (divineLvl, wisScore, existingSlots = []) => {
      const prevSlots = Array.isArray(existingSlots) ? existingSlots : [];
      if (Number(divineLvl) <= 0) {
        return prevSlots.filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({
          ...s,
          total: Number(s.daily) || 0,
          domainTotal: Number(s.domainDaily) || 0
        }));
      }
      const lvl = Math.min(20, Math.max(1, Number(divineLvl) || 1));
      const wMod = Math.floor(((Number(wisScore) || 10) - 10) / 2);
      const baseDivineTable = [
        [], [3, 1], [4, 2], [4, 2, 1], [5, 3, 2], [5, 3, 2, 1],
        [5, 3, 3, 2], [6, 4, 3, 2, 1], [6, 4, 3, 3, 2], [6, 4, 4, 3, 2, 1], [6, 4, 4, 3, 3, 2],
        [6, 5, 4, 4, 3, 2, 1], [6, 5, 4, 4, 3, 3, 2], [6, 5, 5, 4, 4, 3, 2, 1], [6, 5, 5, 4, 4, 3, 3, 2], [6, 5, 5, 5, 4, 4, 3, 2, 1],
        [6, 5, 5, 5, 4, 4, 3, 3, 2], [6, 5, 5, 5, 5, 4, 4, 3, 2, 1], [6, 5, 5, 5, 5, 4, 4, 3, 3, 2], [6, 5, 5, 5, 5, 4, 4, 4, 3, 3], [6, 5, 5, 5, 5, 5, 4, 4, 4, 4]
      ];
      const baseDaily = baseDivineTable[lvl] || [3, 1];
      const result = baseDaily.map((base, spellLvl) => {
        const bonus = (spellLvl >= 1 && wMod >= spellLvl) ? Math.floor((wMod - spellLvl) / 4) + 1 : 0;
        const prev = prevSlots.find(s => Number(s.level) === spellLvl);
        const dmBonus = prev ? (Number(prev.dmBonus) || 0) : 0;
        const regularDaily = Math.max(0, base + bonus + dmBonus);
        const domainDaily = (hasDomainCap && spellLvl >= 1 && spellLvl <= 9) ? 1 : 0;
        const daily = regularDaily + domainDaily;
        const domainUsed = prev ? Math.min(domainDaily, Math.max(0, Number(prev.domainUsed) || 0)) : 0;
        const used = prev ? Math.min(daily, Math.max(domainUsed, Number(prev.used) || 0)) : 0;
        return {
          level: spellLvl,
          daily,
          total: daily,
          regularDaily,
          domainDaily,
          domainTotal: domainDaily,
          domainUsed,
          bonus,
          dmBonus,
          used,
          known: daily
        };
      });
      prevSlots.forEach(prev => {
        if (prev && Number(prev.level) >= baseDaily.length) {
          const dVal = Number(prev.daily) || 0;
          const domDaily = Number(prev.domainDaily) || 0;
          result.push({
            level: Number(prev.level),
            daily: dVal,
            total: dVal,
            regularDaily: Number(prev.regularDaily ?? dVal) || 0,
            domainDaily: domDaily,
            domainTotal: domDaily,
            domainUsed: Math.min(domDaily, Number(prev.domainUsed) || 0),
            bonus: 0,
            dmBonus: Number(prev.dmBonus) || 0,
            used: Math.min(dVal, Number(prev.used) || 0),
            known: dVal
          });
        }
      });
      return result;
    };

    const spontaneousArray = ((sorcLvls > 0 || isSpontBoon || w.isNpc) && spontCl > 0)
      ? calcPureSorcererSlots(spontCl, spontStatVal, w.spellcasting?.slots)
      : (w.spellcasting?.slots || []).filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({ ...s, total: Number(s.daily) || 0 }));
    const preparedArray = ((wizLvls > 0 || hasPrepared) && prepCl > 0)
      ? calcPureWizardSlots(prepCl, intVal, w.spellcasting?.preparedSlots)
      : (w.spellcasting?.preparedSlots || []).filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({ ...s, total: Number(s.daily) || 0 }));
    const divineArray = ((divLvls > 0 || hasDivine) && divCl > 0)
      ? calcPureDivineSlots(divCl, wisVal, w.spellcasting?.divineSlots)
      : (w.spellcasting?.divineSlots || []).filter(s => (Number(s.dmBonus) || 0) > 0).map(s => ({ ...s, total: Number(s.daily) || 0, domainTotal: Number(s.domainDaily) || 0 }));

    const toLevelMap = (arr, isDiv = false) => {
      const map = {};
      for (let lvl = 0; lvl <= 9; lvl++) {
        const found = arr.find(s => Number(s.level) === lvl);
        if (found) {
          map[lvl] = { ...found };
        } else if (isDiv) {
          map[lvl] = { level: lvl, total: 0, daily: 0, used: 0, domainTotal: 0, domainDaily: 0, domainUsed: 0, regularDaily: 0, dmBonus: 0 };
        } else {
          map[lvl] = { level: lvl, total: 0, daily: 0, used: 0, bonus: 0, known: 0, dmBonus: 0 };
        }
      }
      return map;
    };

    // 5. Martial / Tome of Battle Initiator Info (pure)
    const derivePureInitiatorInfo = () => {
      let martialLvls = 0;
      let otherLvls = 0;
      let adeptClass = null;
      const MANEUVER_ADEPT_CLASSES = ['warblade', 'swordsage', 'crusader', 'bloodclaw master', 'deepstone sentinel', 'eternal blade', 'jade phoenix mage', 'master of nine', 'ruby knight vindicator', 'shadow sun ninja'];
      activeProg.forEach(p => {
        const c = (p.className || p.class || '').toLowerCase();
        if (MANEUVER_ADEPT_CLASSES.some(k => c.includes(k))) {
          martialLvls++;
          if (c.includes('swordsage')) adeptClass = 'Swordsage';
          else if (c.includes('crusader') || c.includes('ruby knight')) adeptClass = 'Crusader';
          else if (c.includes('warblade')) adeptClass = 'Warblade';
          else if (!adeptClass) adeptClass = p.className || 'Martial Adept';
        } else {
          otherLvls++;
        }
      });
      if (activeProg.length === 0 && w.classLevels && typeof w.classLevels === 'object' && !Array.isArray(w.classLevels)) {
        Object.entries(w.classLevels).forEach(([cName, cLvl]) => {
          const c = String(cName || '').toLowerCase();
          const lvlNum = Number(cLvl) || 0;
          if (lvlNum <= 0) return;
          if (MANEUVER_ADEPT_CLASSES.some(k => c.includes(k))) {
            martialLvls += lvlNum;
            if (c.includes('swordsage')) adeptClass = 'Swordsage';
            else if (c.includes('crusader') || c.includes('ruby knight')) adeptClass = 'Crusader';
            else if (c.includes('warblade')) adeptClass = 'Warblade';
            else if (!adeptClass) adeptClass = cName || 'Martial Adept';
          } else {
            otherLvls += lvlNum;
          }
        });
      }
      if (!adeptClass && typeof w.classes === 'string') {
        const cStr = w.classes.toLowerCase();
        if (cStr.includes('swordsage')) adeptClass = 'Swordsage';
        else if (cStr.includes('crusader')) adeptClass = 'Crusader';
        else if (cStr.includes('warblade')) adeptClass = 'Warblade';
      }
      const dmReadiedBonus = Number(w.tomeOfBattle?.dmReadiedBonus) || 0;
      const dmKnownBonus = Number(w.tomeOfBattle?.dmKnownBonus) || 0;
      const dmStanceBonus = Number(w.tomeOfBattle?.dmStanceBonus) || 0;
      const hasMartialFeatOrBoon = martialStudyCount > 0 || martialStanceCount > 0 || dmReadiedBonus > 0 || dmKnownBonus > 0 || dmStanceBonus > 0;

      if (!adeptClass && !hasMartial && !hasMartialFeatOrBoon) {
        return {
          adeptClass: 'No Martial Adept Class',
          martialLvls: 0,
          otherLvls: activeProg.length,
          il: 0,
          adeptIl: 0,
          maxManeuverLvl: 0,
          maxStanceLvl: 0,
          maneuverSlotCeilings: [],
          stanceSlotCeilings: [],
          readiedCount: 0,
          maxReadied: 0,
          baseReadied: 0,
          dmReadiedBonus: 0,
          maxKnownManeuvers: 0,
          baseKnownManeuvers: 0,
          dmKnownBonus: 0,
          maxKnownStances: 0,
          baseKnownStances: 0,
          dmStanceBonus: 0,
          classDisciplines: [],
          martialStudyCount,
          martialStanceCount,
          isMartialBoon: false,
          hasClass: false
        };
      }
      if (!adeptClass) {
        adeptClass = (martialStudyCount > 0 || martialStanceCount > 0) ? 'Martial Study / Stance' : 'Martial Adept (Homebrew)';
      }
      const activeCharLvl = activeProg.length || Number(w.level) || 1;
      const computedIl = isMartialBoon
        ? Math.max(1, activeCharLvl)
        : (martialLvls > 0
          ? (martialLvls + Math.floor(otherLvls / 2))
          : Math.max(1, Math.floor(activeCharLvl / 2)));
      const storedIl = Number(w.tomeOfBattle?.initiatorLevel) || 0;
      const il = w.isNpc ? Math.max(storedIl, computedIl, 1) : Math.max(computedIl, 1);
      const rawMaxManeuverLvl = Math.min(9, Math.max(1, Math.ceil(il / 2)));
      const readiedList = w.tomeOfBattle?.readiedManeuvers || [];

      let baseReadied = 0;
      let baseKnownManeuvers = 0;
      let baseKnownStances = 0;
      const effMartialLvls = (martialLvls > 0) ? martialLvls : (isMartialBoon ? il : 0);
      if (effMartialLvls > 0) {
        if (adeptClass === 'Swordsage') {
          baseKnownManeuvers = 5 + effMartialLvls;
          baseReadied = effMartialLvls >= 20 ? 10 : (effMartialLvls >= 18 ? 9 : (effMartialLvls >= 15 ? 8 : (effMartialLvls >= 12 ? 7 : (effMartialLvls >= 8 ? 6 : (effMartialLvls >= 4 ? 5 : 4)))));
          baseKnownStances = effMartialLvls >= 20 ? 6 : (effMartialLvls >= 14 ? 5 : (effMartialLvls >= 9 ? 4 : (effMartialLvls >= 5 ? 3 : (effMartialLvls >= 2 ? 2 : 1))));
        } else if (adeptClass === 'Crusader') {
          baseKnownManeuvers = 5 + Math.floor((effMartialLvls - 1) / 2);
          baseReadied = effMartialLvls >= 20 ? 7 : (effMartialLvls >= 10 ? 6 : 5);
          baseKnownStances = effMartialLvls >= 14 ? 4 : (effMartialLvls >= 8 ? 3 : (effMartialLvls >= 2 ? 2 : 1));
        } else {
          baseKnownManeuvers = effMartialLvls === 1 ? 3 : (3 + Math.ceil(effMartialLvls / 2));
          baseReadied = effMartialLvls >= 20 ? 7 : (effMartialLvls >= 15 ? 6 : (effMartialLvls >= 9 ? 5 : (effMartialLvls >= 4 ? 4 : 3)));
          baseKnownStances = effMartialLvls >= 16 ? 4 : (effMartialLvls >= 10 ? 3 : (effMartialLvls >= 4 ? 2 : 1));
        }
      }

      const maneuverSlotCeilings = [];
      const stanceSlotCeilings = [];
      const swapLowestManeuverSlot = (newMaxLvl) => {
        if (maneuverSlotCeilings.length === 0) return;
        let minIdx = -1;
        let minVal = 99;
        for (let i = 0; i < maneuverSlotCeilings.length; i++) {
          if (maneuverSlotCeilings[i] < newMaxLvl && maneuverSlotCeilings[i] < minVal) {
            minVal = maneuverSlotCeilings[i];
            minIdx = i;
          }
        }
        if (minIdx >= 0) maneuverSlotCeilings[minIdx] = newMaxLvl;
      };

      let adeptIl = il;
      if (activeProg.length > 0 && martialLvls > 0) {
        let simMartial = 0, simOther = 0, simWb = 0, simSs = 0, simCr = 0, simBcm = 0, simDs = 0, simEb = 0, simJpm = 0, simMon = 0, simRkv = 0, simSsn = 0;
        let simReadied = 0, simClassManeuvers = 0, simClassStances = 0, lastManeuverGrantIl = 1;
        activeProg.forEach(p => {
          const c = (p.className || p.class || '').toLowerCase();
          const isM = MANEUVER_ADEPT_CLASSES.some(k => c.includes(k));
          if (isM) simMartial++; else simOther++;
          const stepIl = isMartialBoon ? (simMartial + simOther) : (simMartial > 0 ? (simMartial + Math.floor(simOther / 2)) : Math.max(1, Math.floor((simMartial + simOther) / 2)));
          const stepMaxLvl = Math.min(9, Math.max(1, Math.ceil(Math.max(1, stepIl) / 2)));
          if (isM) {
            lastManeuverGrantIl = stepIl;
            if (c.includes('swordsage')) {
              simSs++;
              if (simSs === 1) { for (let k = 0; k < 6; k++) maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 6; simReadied += 4; }
              else { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; if ([4, 8, 12, 15, 18, 20].includes(simSs)) simReadied += 1; }
              if (simSs >= 4 && simSs % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
              if ([1, 2, 5, 9, 14, 20].includes(simSs)) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; }
            } else if (c.includes('crusader')) {
              simCr++;
              if (simCr === 1) { for (let k = 0; k < 5; k++) maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 5; simReadied += 5; }
              else { if (simCr >= 3 && simCr % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if ([10, 20].includes(simCr)) simReadied += 1; }
              if (simCr >= 4 && simCr % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
              if ([1, 2, 8, 14].includes(simCr)) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; }
            } else if (c.includes('bloodclaw master')) {
              simBcm++; if (simBcm % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if (simBcm === 3) simReadied += 1;
            } else if (c.includes('deepstone sentinel')) {
              simDs++; if (simDs % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if (simDs === 3) simReadied += 1;
            } else if (c.includes('eternal blade')) {
              simEb++; if (simEb % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if (simEb === 5) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; } if ([3, 6, 9].includes(simEb)) simReadied += 1;
            } else if (c.includes('jade phoenix mage')) {
              simJpm++; if (simJpm % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if (simJpm === 5) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; } if ([3, 6, 9].includes(simJpm)) simReadied += 1;
            } else if (c.includes('master of nine')) {
              simMon++; const addM = (simMon % 2 === 1) ? 2 : 1; for (let k = 0; k < addM; k++) maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += addM; if ([2, 4].includes(simMon)) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; } simReadied += 1;
            } else if (c.includes('ruby knight')) {
              simRkv++; if (simRkv % 2 === 0) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if ([5, 10].includes(simRkv)) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; } if ([3, 6, 9].includes(simRkv)) simReadied += 1;
            } else if (c.includes('shadow sun ninja')) {
              simSsn++; if (simSsn % 2 === 1) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if (simSsn === 5) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; } if ([3, 6, 9].includes(simSsn)) simReadied += 1;
            } else {
              simWb++;
              if (simWb === 1) { for (let k = 0; k < 3; k++) maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 3; simReadied += 3; }
              else { if (simWb === 2 || (simWb >= 3 && simWb % 2 === 1)) { maneuverSlotCeilings.push(stepMaxLvl); simClassManeuvers += 1; } if ([4, 9, 15, 20].includes(simWb)) simReadied += 1; }
              if (simWb >= 4 && simWb % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
              if ([1, 4, 10, 16].includes(simWb)) { stanceSlotCeilings.push(stepMaxLvl); simClassStances += 1; }
            }
          }
          if (Array.isArray(p.feats)) {
            p.feats.forEach(f => {
              const fLow = String(f || '').toLowerCase();
              if (fLow.includes('martial study')) { maneuverSlotCeilings.push(stepMaxLvl); lastManeuverGrantIl = Math.max(lastManeuverGrantIl, stepIl); }
              if (fLow.includes('martial stance')) { stanceSlotCeilings.push(stepMaxLvl); lastManeuverGrantIl = Math.max(lastManeuverGrantIl, stepIl); }
            });
          }
        });
        baseKnownManeuvers = simClassManeuvers;
        baseKnownStances = simClassStances;
        baseReadied = simReadied;
        adeptIl = lastManeuverGrantIl;
      } else if (effMartialLvls > 0) {
        for (let step = 1; step <= effMartialLvls; step++) {
          const stepMaxLvl = Math.min(9, Math.max(1, Math.ceil(step / 2)));
          if (adeptClass === 'Swordsage') {
            if (step === 1) { for (let k = 0; k < 6; k++) maneuverSlotCeilings.push(stepMaxLvl); }
            else maneuverSlotCeilings.push(stepMaxLvl);
            if (step >= 4 && step % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
            if ([1, 2, 5, 9, 14, 20].includes(step)) stanceSlotCeilings.push(stepMaxLvl);
          } else if (adeptClass === 'Crusader') {
            if (step === 1) { for (let k = 0; k < 5; k++) maneuverSlotCeilings.push(stepMaxLvl); }
            else if (step >= 3 && step % 2 === 1) maneuverSlotCeilings.push(stepMaxLvl);
            if (step >= 4 && step % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
            if ([1, 2, 8, 14].includes(step)) stanceSlotCeilings.push(stepMaxLvl);
          } else {
            if (step === 1) { for (let k = 0; k < 3; k++) maneuverSlotCeilings.push(stepMaxLvl); }
            else if (step === 2 || (step >= 3 && step % 2 === 1)) maneuverSlotCeilings.push(stepMaxLvl);
            if (step >= 4 && step % 2 === 0) swapLowestManeuverSlot(stepMaxLvl);
            if ([1, 4, 10, 16].includes(step)) stanceSlotCeilings.push(stepMaxLvl);
          }
        }
      }

      const maxKnownManeuvers = Math.max(0, baseKnownManeuvers + martialStudyCount + dmKnownBonus);
      const maxReadied = Math.max(0, baseReadied + (martialLvls === 0 && martialStudyCount > 0 ? 1 : 0) + dmReadiedBonus);
      const maxKnownStances = Math.max(0, baseKnownStances + martialStanceCount + dmStanceBonus);
      const discSet = new Set();
      const addDiscs = (arr) => arr.forEach(d => discSet.add(d));
      activeProg.forEach(p => {
        const c = (p.className || p.class || '').toLowerCase();
        if (c.includes('crusader')) addDiscs(['Devoted Spirit', 'Stone Dragon', 'White Raven']);
        if (c.includes('swordsage')) addDiscs(['Desert Wind', 'Diamond Mind', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw']);
        if (c.includes('warblade')) addDiscs(['Diamond Mind', 'Iron Heart', 'Stone Dragon', 'Tiger Claw', 'White Raven']);
        if (c.includes('bloodclaw master')) addDiscs(['Tiger Claw']);
        if (c.includes('deepstone sentinel')) addDiscs(['Stone Dragon']);
        if (c.includes('eternal blade')) addDiscs(['Devoted Spirit', 'Diamond Mind', 'Iron Heart', 'White Raven']);
        if (c.includes('jade phoenix mage')) addDiscs(['Desert Wind', 'Devoted Spirit']);
        if (c.includes('master of nine')) addDiscs(['Desert Wind', 'Devoted Spirit', 'Diamond Mind', 'Iron Heart', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw', 'White Raven']);
        if (c.includes('ruby knight')) addDiscs(['Devoted Spirit', 'Shadow Hand', 'Stone Dragon', 'White Raven']);
        if (c.includes('shadow sun ninja')) addDiscs(['Setting Sun', 'Shadow Hand']);
      });
      const classDisciplines = discSet.size > 0
        ? Array.from(discSet)
        : (adeptClass === 'Crusader'
          ? ['Devoted Spirit', 'Stone Dragon', 'White Raven']
          : (adeptClass === 'Swordsage'
            ? ['Desert Wind', 'Diamond Mind', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw']
            : (adeptClass === 'Warblade'
              ? ['Diamond Mind', 'Iron Heart', 'Stone Dragon', 'Tiger Claw', 'White Raven']
              : ['Desert Wind', 'Devoted Spirit', 'Diamond Mind', 'Iron Heart', 'Setting Sun', 'Shadow Hand', 'Stone Dragon', 'Tiger Claw', 'White Raven'])));

      while (maneuverSlotCeilings.length < maxKnownManeuvers) maneuverSlotCeilings.push(rawMaxManeuverLvl);
      if (maneuverSlotCeilings.length > maxKnownManeuvers) {
        maneuverSlotCeilings.sort((a, b) => a - b);
        maneuverSlotCeilings.splice(0, maneuverSlotCeilings.length - maxKnownManeuvers);
      }
      maneuverSlotCeilings.sort((a, b) => a - b);

      while (stanceSlotCeilings.length < maxKnownStances) stanceSlotCeilings.push(rawMaxManeuverLvl);
      if (stanceSlotCeilings.length > maxKnownStances) {
        stanceSlotCeilings.sort((a, b) => a - b);
        stanceSlotCeilings.splice(0, stanceSlotCeilings.length - maxKnownStances);
      }
      stanceSlotCeilings.sort((a, b) => a - b);

      const maxManeuverLvl = maneuverSlotCeilings.length > 0 ? Math.max(...maneuverSlotCeilings) : rawMaxManeuverLvl;
      const maxStanceLvl = stanceSlotCeilings.length > 0 ? Math.max(...stanceSlotCeilings) : maxManeuverLvl;

      return {
        il,
        adeptIl,
        maxManeuverLvl,
        maxStanceLvl,
        maneuverSlotCeilings,
        stanceSlotCeilings,
        readiedCount: readiedList.length,
        maxReadied,
        baseReadied,
        dmReadiedBonus,
        maxKnownManeuvers,
        baseKnownManeuvers,
        dmKnownBonus,
        maxKnownStances,
        baseKnownStances,
        dmStanceBonus,
        adeptClass,
        classDisciplines,
        martialLvls,
        otherLvls,
        martialStudyCount,
        martialStanceCount,
        isMartialBoon,
        hasClass: true
      };
    };

    const initInfo = derivePureInitiatorInfo();
    const martialPrimaryStatLabel = initInfo.adeptClass === 'Swordsage' ? 'WIS' : (initInfo.adeptClass === 'Crusader' ? 'CHA' : 'INT');
    const martialPrimaryMod = martialPrimaryStatLabel === 'WIS' ? wisMod : (martialPrimaryStatLabel === 'CHA' ? chaMod : intMod);

    // 6. Combat Casting / Concentration / Spell Penetration / Touch Attack Bonuses
    const skillList = Array.isArray(w.skills) ? w.skills : Object.values(w.skills || {});
    const concSkill = skillList.find(s => s && String(s.key || s.name || '').toLowerCase().includes('concentration'));
    const allFeatNames = [
      ...(w.feats || []).map(f => String(typeof f === 'string' ? f : (f?.name || '')).toLowerCase()),
      ...progFeats
    ];
    const hasCombatCasting = allFeatNames.some(f => f.includes('combat casting'));
    const hasGreaterSpellPen = allFeatNames.some(f => f.includes('greater spell penetration'));
    const hasSpellPen = allFeatNames.some(f => f.includes('spell penetration'));
    const concentrationBonus = (Number(concSkill?.ranks) || 0) + conMod + (Number(concSkill?.misc) || 0) + (Number(w.buffSkillBonus) || 0);
    let v3SpellPenBonus = 0;
    let hasV3SpellPen = false;
    let hasV3GreaterSpellPen = false;
    const rawSpellFeatRefs = [
      ...(Array.isArray(w.feats) ? w.feats : []),
      ...activeProg.flatMap(p => Array.isArray(p.feats) ? p.feats : [])
    ];
    const seenSpellPenFeatKeys = new Set();
    rawSpellFeatRefs.forEach(fRef => {
      if (!fRef) return;
      const fName = String(typeof fRef === 'string' ? fRef : (fRef.name || fRef.id || '')).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
      const fLow = fName.toLowerCase();
      if (!fLow.includes('spell penetration') || seenSpellPenFeatKeys.has(fLow)) return;
      seenSpellPenFeatKeys.add(fLow);
      const dbF = this.getMasterDbEntry(typeof fRef === 'object' ? fRef : fName, 'Feat');
      const mergedF = Object.assign({}, dbF || {}, typeof fRef === 'object' ? fRef : { name: fName });
      if (Array.isArray(mergedF.effects) && mergedF.effects.length > 0) {
        const evalF = this.evaluateV3Entry({ ...mergedF, _v3Evaluated: false, modifiers: [] }, { character: w, level: activeProg.length || Number(w.level) || 1 });
        const spMods = (evalF.modifiers || []).filter(m => m && String(m.target || '').toLowerCase() === 'caster.spellpenetration');
        if (spMods.length > 0) {
          spMods.forEach(m => { v3SpellPenBonus += Number(m.value) || 0; });
          if (fLow.includes('greater spell penetration')) hasV3GreaterSpellPen = true;
          else hasV3SpellPen = true;
        }
      }
    });
    const legacySpellPenBonus = (hasGreaterSpellPen ? (hasV3GreaterSpellPen ? 0 : (hasV3SpellPen ? 2 : 4)) : (hasSpellPen && !hasV3SpellPen ? 2 : 0));
    const spellResistancePenetrationBonus = v3SpellPenBonus + legacySpellPenBonus + (Number(w.ruleFlags?.spellPenetrationBonus) || 0);
    const sizeBonus = Number(w.acBreakdown?.size) || 0;
    const meleeTouchBonus = (Number(w.bab) || 0) + strMod + sizeBonus;
    const rangedTouchBonus = (Number(w.bab) || 0) + dexMod + sizeBonus;

    // 7. Spells By Level View (pure enrichment with originalIdx, level, isCast, isDomainSpell, saveDc, srText)
    const rawKnownSpells = (Array.isArray(w.spellcasting?.knownSpells) && w.spellcasting.knownSpells.length > 0)
      ? w.spellcasting.knownSpells
      : (Array.isArray(w.spells) ? w.spells : []);
    const rawPreparedSpells = Array.isArray(w.spellcasting?.preparedSpells) ? w.spellcasting.preparedSpells : [];
    const rawDivineSpells = Array.isArray(w.spellcasting?.divineSpells) ? w.spellcasting.divineSpells : [];

    const schoolDcEntries = [];
    const seenSchoolFeatKeys = new Set();
    rawSpellFeatRefs.forEach(fRef => {
      if (!fRef) return;
      const fName = String(typeof fRef === 'string' ? fRef : (fRef.name || fRef.id || '')).replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
      const fLow = fName.toLowerCase();
      if (!fLow || seenSpellPenFeatKeys.has(`dc:${fLow}`) || seenSchoolFeatKeys.has(fLow)) return;
      seenSchoolFeatKeys.add(fLow);
      const dbF = this.getMasterDbEntry(typeof fRef === 'object' ? fRef : fName, 'Feat');
      const mergedF = Object.assign({}, dbF || {}, typeof fRef === 'object' ? fRef : { name: fName }, { name: fName });
      if (Array.isArray(mergedF.effects) && mergedF.effects.length > 0 && this.extractEntryChoice(mergedF)) {
        schoolDcEntries.push(mergedF);
      }
    });

    const enrichSpellList = (list, baseDc) => list.map((s, idx) => {
      const lvl = Number(s?.level) || 0;
      let schoolBonus = 0;
      if (schoolDcEntries.length > 0 && (s?.school || s?.spell?.school)) {
        schoolDcEntries.forEach(fe => {
          const ev = this.evaluateV3Entry(
            { ...fe, _v3Evaluated: false, modifiers: [] },
            { character: w, level: activeProg.length || Number(w.level) || 1, spell: s }
          );
          (ev.modifiers || []).forEach(m => {
            if (m && String(m.target || '').toLowerCase() === 'spell.dc') {
              schoolBonus += Number(m.value) || 0;
            }
          });
        });
      }
      return {
        ...(s || {}),
        originalIdx: idx,
        level: lvl,
        isCast: Boolean(s?.isCast || s?.cast),
        isDomainSpell: Boolean(s?.isDomainSpell),
        saveDc: baseDc + lvl + schoolBonus,
        srText: String(s?.sr || s?.spellResistance || 'No')
      };
    });

    const baseSpontDc = 10 + spontStatMod + spellDcBonus;
    const basePrepDc = 10 + intMod + spellDcBonus;
    const baseDivDc = 10 + wisMod + spellDcBonus;

    const effectiveCasterLevel = (Number(w.spellcasting?.cl || w.casterLevel || spontCl || prepCl || divCl || 1) + casterLevelBonus);

    const canKeepManeuvers = initInfo.hasClass || Boolean(w.isNpc);

    return {
      casterStatsView: {
        casterLevel: effectiveCasterLevel,
        spontaneous: {
          active: Boolean(hasSpontaneous),
          classLabel: spontClassLabel || 'Sorcerer',
          abilityKey: spontStatKey.toLowerCase(),
          statKey: spontStatKey,
          abilityScore: spontStatVal,
          abilityMod: spontStatMod,
          baseSaveDc: baseSpontDc,
          cl: spontCl + (spontCl > 0 ? casterLevelBonus : 0),
          rawCl: spontCl,
          clMode: spontClMode,
          sorcLvls,
          isSpontBoon,
          hasClass: Boolean(hasSpontaneous)
        },
        prepared: {
          active: Boolean(hasPrepared),
          classLabel: isPrepBoon && wizLvls === 0 ? 'Wizard (Homebrew)' : 'Wizard',
          abilityKey: 'int',
          statKey: 'INT',
          abilityScore: intVal,
          abilityMod: intMod,
          baseSaveDc: basePrepDc,
          cl: prepCl + (prepCl > 0 ? casterLevelBonus : 0),
          rawCl: prepCl,
          clMode: prepClMode,
          wizLvls,
          isPrepBoon,
          hasClass: Boolean(hasPrepared)
        },
        divine: {
          active: Boolean(hasDivine),
          classLabel: isDivBoon && divLvls === 0 ? 'Cleric (Homebrew)' : 'Cleric',
          abilityKey: 'wis',
          statKey: 'WIS',
          abilityScore: wisVal,
          baseWisVal,
          insanityBonus,
          abilityMod: wisMod,
          baseSaveDc: baseDivDc,
          cl: divCl + (divCl > 0 ? casterLevelBonus : 0),
          rawCl: divCl,
          clMode: divClMode,
          divLvls,
          isDivBoon,
          hasClass: Boolean(hasDivine),
          clericSpontaneousMode: w.spellcasting?.clericSpontaneousMode || 'good',
          domains: chosenDomains
        },
        martial: {
          active: Boolean(initInfo.hasClass && initInfo.il > 0),
          classLabel: initInfo.adeptClass,
          initiatorLevel: initInfo.il,
          adeptIl: initInfo.adeptIl,
          maxManeuverLevel: initInfo.maxManeuverLvl,
          maxStanceLevel: initInfo.maxStanceLvl,
          primaryMod: martialPrimaryMod,
          primaryStatLabel: martialPrimaryStatLabel,
          maxKnown: initInfo.maxKnownManeuvers,
          maxReadied: initInfo.maxReadied,
          maxStances: initInfo.maxKnownStances,
          maneuverSlotCeilings: initInfo.maneuverSlotCeilings,
          stanceSlotCeilings: initInfo.stanceSlotCeilings,
          classDisciplines: initInfo.classDisciplines,
          martialLvls: initInfo.martialLvls,
          otherLvls: initInfo.otherLvls,
          martialStudyCount: initInfo.martialStudyCount,
          martialStanceCount: initInfo.martialStanceCount,
          isMartialBoon: initInfo.isMartialBoon,
          hasClass: initInfo.hasClass,
          initInfo
        },
        concentrationBonus,
        combatCastingBonus: hasCombatCasting ? 4 : 0,
        spellResistancePenetrationBonus,
        meleeTouchBonus,
        rangedTouchBonus,
        classesStatus: { hasSpontaneous, hasPrepared, hasDivine, hasMartial }
      },
      slotsByLevelView: {
        spontaneous: toLevelMap(spontaneousArray, false),
        prepared: toLevelMap(preparedArray, false),
        divine: toLevelMap(divineArray, true),
        spontaneousArray,
        preparedArray,
        divineArray
      },
      spellsByLevelView: {
        knownSpells: enrichSpellList(rawKnownSpells, baseSpontDc),
        preparedSpells: enrichSpellList(rawPreparedSpells, basePrepDc),
        divineSpells: enrichSpellList(rawDivineSpells, baseDivDc)
      },
      maneuversView: {
        hasClass: initInfo.hasClass,
        il: initInfo.il,
        initiatorLevel: initInfo.il,
        maxManeuverLvl: initInfo.maxManeuverLvl,
        maxManeuverLevel: initInfo.maxManeuverLvl,
        maxReadied: initInfo.maxReadied,
        maxKnownManeuvers: initInfo.maxKnownManeuvers,
        maxKnownStances: initInfo.maxKnownStances,
        maneuversKnown: canKeepManeuvers ? (w.tomeOfBattle?.maneuversKnown || []).map(m => ({ ...m })) : [],
        readiedManeuvers: canKeepManeuvers ? (w.tomeOfBattle?.readiedManeuvers || []).map(m => ({ ...m })) : [],
        stancesKnown: canKeepManeuvers ? (w.tomeOfBattle?.stancesKnown || []).map(s => ({ ...s })) : [],
        activeStance: canKeepManeuvers ? (w.tomeOfBattle?.activeStance || w.activeStance || '') : ''
      }
    };
  },

  /**
   * Pure, zero-mutation progression & character features derivation (Phase R6).
   * Returns `{ levelsView, featSlotsView, skillBudgetsView, featuresView }` without mutating `w`.
   */
  deriveProgressionView(w, workingDb = []) {
    if (!w || typeof w !== 'object') {
      return {
        levelsView: {
          rows: [],
          summary: {
            activeLevelsCount: 0,
            totalLevel: 0,
            classSummaryStr: '',
            totalBab: 0,
            baseSaves: { fort: 0, ref: 0, will: 0 },
            totalSkillPoints: 0,
            featMode: 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)'
          }
        },
        featSlotsView: {
          featMode: 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)',
          regularSlotsEarned: 0,
          bonusSlotsEarned: 0,
          flawSlotsEarned: 0,
          totalSlotsEarned: 0,
          regularFeatsTaken: 0,
          bonusFeatsTaken: 0,
          flawFeatsTaken: 0,
          openRegularSlots: 0,
          openBonusSlots: 0
        },
        skillBudgetsView: {
          isMerged: false,
          charLevel: 1,
          maxClassRank: 4,
          maxCrossRank: 2,
          totalSkillPoints: 0,
          spentSkillPoints: 0,
          remainingSkillPoints: 0,
          isOverBudget: false
        },
        featuresView: {
          featsList: [],
          racialTraits: [],
          classFeatures: [],
          templatesAndBoons: [],
          flawsList: []
        }
      };
    }

    const abi = w.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const intMod = this.getAbilityMod(abi.int || 10);
    const raceTraits = typeof this.getRaceTraits === 'function' ? this.getRaceTraits(w) : null;
    const isHuman = raceTraits ? raceTraits.humanBonusSkillPoints : String(w.race || '').toLowerCase().includes('human');
    const hasRaceBonusFeat1 = raceTraits ? raceTraits.bonusFeatAt1st : isHuman;
    const sys = w.settings?.babSaveSystem || 'standard';
    const rawFeatMode = String(w.settings?.featMode || 'Standard 3.5e (1, 3, 6, 9, 12, 15, 18)');
    const featMode = rawFeatMode.startsWith('Every 2 Levels')
      ? 'Every 2 Levels (1, 3, 5, 7, 9, 11, 13, 15, 17, 19)'
      : rawFeatMode;

    const isLevelQualifiesForFeat = (lvlNum, modeStr) => {
      const m = String(modeStr || '');
      if (m.startsWith('Every 2 Levels')) return lvlNum % 2 === 1;
      if (m.startsWith('Every 4 Levels')) return lvlNum === 1 || lvlNum % 4 === 0;
      if (m.startsWith('All Free')) return true;
      return lvlNum === 1 || lvlNum % 3 === 0;
    };

    const rawProg = Array.isArray(w.levelProgression) ? w.levelProgression : [];
    const progSummary = typeof this.calculateProgression === 'function'
      ? this.calculateProgression(rawProg, { system: sys, isHuman, intMod, character: w })
      : null;

    const classCountsSoFar = {};
    const activeClassCounts = {};
    let regularSlotsEarned = 0;
    let bonusSlotsEarned = 0;
    let flawSlotsEarned = 0;
    let regularFeatsTaken = 0;
    let bonusFeatsTaken = 0;
    let flawFeatsTaken = 0;

    const rows = rawProg.map((lvl, idx) => {
      const isActive = lvl && lvl.active !== false;
      const lvlNum = Number(lvl?.level) || (idx + 1);
      const cName = String(lvl?.className || lvl?.class || 'Fighter').trim();
      classCountsSoFar[cName] = (classCountsSoFar[cName] || 0) + 1;
      const classLevelSoFar = classCountsSoFar[cName];
      if (isActive) {
        activeClassCounts[cName] = (activeClassCounts[cName] || 0) + 1;
      }

      const rowSlice = rawProg.slice(0, idx + 1).map(p => ({ ...p, active: true }));
      const rowCalc = typeof this.calculateProgression === 'function'
        ? this.calculateProgression(rowSlice, { system: sys, isHuman, intMod, character: w })
        : null;
      const rowBab = rowCalc ? rowCalc.baseBab : (Number(lvl?.bab) || 0);
      const rowFort = rowCalc ? rowCalc.baseSaves.fort : (Number(lvl?.fort) || 0);
      const rowRef = rowCalc ? rowCalc.baseSaves.ref : (Number(lvl?.ref) || 0);
      const rowWill = rowCalc ? rowCalc.baseSaves.will : (Number(lvl?.will) || 0);

      const featsArr = Array.isArray(lvl?.feats) ? [...lvl.feats] : [];
      const qualifiesReg = isLevelQualifiesForFeat(lvlNum, featMode);
      if (isActive && qualifiesReg) regularSlotsEarned++;
      if (isActive && lvlNum === 1 && hasRaceBonusFeat1) bonusSlotsEarned++;

      featsArr.forEach(fStr => {
        const s = String(fStr || '');
        if (!s || s.includes('+1 Stat') || s.includes('Stat:') || this.isTraitOrSkillTrickRef(s)) return;
        if (s.includes('[Flaw]') || /^⚠️\s*\[Flaw\]/i.test(s)) {
          if (isActive) flawSlotsEarned++;
        } else if (s.includes('[Flaw Bonus]')) {
          if (isActive) flawFeatsTaken++;
        } else if (s.includes('[Bonus]') || s.includes('[Extra Bonus]') || s.includes('[Racial]') || s.includes('[Extra Racial]')) {
          if (isActive) {
            bonusFeatsTaken++;
            if (s.includes('[Bonus]')) bonusSlotsEarned++;
          }
        } else if (!s.includes('[Homebrew]') && !s.includes('Invocation')) {
          if (isActive) regularFeatsTaken++;
        }
      });

      const rawStatInc = lvl?.statIncrease || lvl?.statIncreased || null;
      return {
        index: idx,
        level: lvlNum,
        active: isActive,
        className: cName,
        classLevelSoFar,
        hd: Number(lvl?.hd) || 8,
        hpRoll: Number(lvl?.hpRoll ?? lvl?.hpGain ?? lvl?.hp) || 0,
        hpGain: Number(lvl?.hpGain ?? lvl?.hpRoll ?? lvl?.hp) || 0,
        bab: rowBab,
        fort: rowFort,
        ref: rowRef,
        will: rowWill,
        skillPoints: Number(lvl?.skillPoints ?? lvl?.skillPts) || 0,
        feats: featsArr,
        classFeatures: Array.isArray(lvl?.classFeatures) ? [...lvl.classFeatures] : [],
        statIncrease: rawStatInc,
        statIncreaseKey: rawStatInc ? String(rawStatInc).toLowerCase() : null
      };
    });

    if (rows.length === 0) {
      const charLvl = Math.max(1, Number(w.level) || 1);
      for (let l = 1; l <= charLvl; l++) {
        if (isLevelQualifiesForFeat(l, featMode)) regularSlotsEarned++;
      }
      if (hasRaceBonusFeat1) bonusSlotsEarned++;
      regularFeatsTaken = Array.isArray(w.feats)
        ? w.feats.filter(f => !(f && typeof f === 'object' && (f.type === 'Trait' || f.type === 'Skill Trick'))).length
        : 0;
    }

    const activeLevelsCount = rows.length > 0
      ? rows.filter(r => r.active).length
      : Math.max(1, Number(w.level) || 1);
    const totalLevel = rows.length > 0 ? rows.length : activeLevelsCount;
    const classSummaryStr = Object.keys(activeClassCounts).length > 0
      ? Object.entries(activeClassCounts).map(([k, v]) => `${k} ${v}`).join(' / ')
      : (typeof w.classes === 'string' ? w.classes : '');

    const totalBab = progSummary && rows.length > 0 ? progSummary.baseBab : (Number(w.bab) || 0);
    const baseSaves = progSummary && rows.length > 0
      ? { ...progSummary.baseSaves }
      : {
          fort: Number(w.baseSaves?.fort ?? w.saves?.fort?.base ?? 0),
          ref: Number(w.baseSaves?.ref ?? w.saves?.ref?.base ?? 0),
          will: Number(w.baseSaves?.will ?? w.saves?.will?.base ?? 0)
        };
    const totalSkillPoints = progSummary && rows.length > 0
      ? progSummary.totalSkillPoints
      : (Number(w.skillPointsTotal) || 0);

    // Skill budgets (routed through active ruleset)
    const activeRuleset = this.getActiveRuleset(w);
    const isMerged = Boolean(w.settings?.skillConsolidation && w.settings.skillConsolidation !== 'standard');
    const maxClassRank = (activeRuleset && typeof activeRuleset.calcMaxSkillRanks === 'function')
      ? activeRuleset.calcMaxSkillRanks(activeLevelsCount, true)
      : (activeLevelsCount + 3);
    const maxCrossRank = (activeRuleset && typeof activeRuleset.calcMaxSkillRanks === 'function')
      ? Math.floor(activeRuleset.calcMaxSkillRanks(activeLevelsCount, false))
      : Math.floor(maxClassRank / 2);
    let spentSkillPoints = 0;
    const skillsList = Array.isArray(w.skills) ? w.skills : Object.values(w.skills || {});
    skillsList.forEach(sk => {
      if (!sk || typeof sk !== 'object') return;
      const ranks = Number(sk.ranks ?? sk.rank ?? 0) || 0;
      const isCls = sk.isClassSkill !== false && sk.classSkill !== false && sk.isClass !== false;
      const ptCost = (activeRuleset && typeof activeRuleset.calcSkillPointCost === 'function')
        ? activeRuleset.calcSkillPointCost(isCls)
        : (isCls ? 1 : 2);
      spentSkillPoints += ranks * ptCost;
    });
    const skillTrickCount = this.countSkillTricks(w);
    spentSkillPoints += skillTrickCount * 2;
    const remainingSkillPoints = totalSkillPoints - spentSkillPoints;

    // Features view
    const featMap = new Map();
    (w.feats || []).forEach(f => {
      if (!f) return;
      const name = (typeof f === 'string' ? f : (f.name || '')).trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!featMap.has(key)) {
        featMap.set(key, {
          name,
          category: typeof f === 'object' ? (f.category || 'Feat') : 'Feat',
          benefit: typeof f === 'object' ? (f.benefit || f.desc || '') : '',
          source: typeof f === 'object' ? (f.source || '') : ''
        });
      }
    });
    rows.forEach(r => {
      if (!r.active) return;
      (r.feats || []).forEach(fn => {
        if (!fn || typeof fn !== 'string' || fn.includes('+1 Stat') || fn.includes('Stat:')) return;
        const clean = fn.replace(/^[🌟🎖️⚔️⚠️🔮💪🧬✨⚜️\s]+(\[.*?\])?\s*/, '').trim();
        const key = clean.toLowerCase();
        if (clean && !featMap.has(key)) {
          featMap.set(key, {
            name: clean,
            category: 'Level Feat',
            benefit: '',
            source: `Level ${r.level}`
          });
        }
      });
    });

    const racialTraits = [];
    const classFeatures = [];
    const templatesAndBoons = [];
    const flawsList = [];
    (w.specialAbilities || []).forEach(a => {
      if (!a) return;
      const entry = typeof a === 'string' ? { name: a, category: 'Special Ability', type: '' } : { ...a };
      const cat = String(entry.category || entry.type || '').toLowerCase();
      if (cat.includes('flaw')) flawsList.push(entry);
      else if (cat.includes('racial')) racialTraits.push(entry);
      else if (cat.includes('boon') || cat.includes('template')) templatesAndBoons.push(entry);
      else classFeatures.push(entry);
    });

    const totalSlotsEarned = regularSlotsEarned + bonusSlotsEarned + flawSlotsEarned;
    const openRegularSlots = Math.max(0, regularSlotsEarned - regularFeatsTaken);
    const openBonusSlots = Math.max(0, (bonusSlotsEarned + flawSlotsEarned) - (bonusFeatsTaken + flawFeatsTaken));
    const featsListArr = Array.from(featMap.values());
    const abilitiesListArr = [...racialTraits, ...classFeatures, ...templatesAndBoons];
    const progressionSummary = {
      activeLevelsCount,
      totalLevel,
      classSummaryStr,
      totalBab,
      baseSaves,
      totalSkillPoints,
      featMode
    };
    const levelsViewArr = rows.slice();
    Object.defineProperty(levelsViewArr, 'rows', { value: rows, enumerable: false });
    Object.defineProperty(levelsViewArr, 'summary', { value: progressionSummary, enumerable: false });

    return {
      levelsView: levelsViewArr,
      activeLevelsCount,
      plannedLevelsCount: rows.length,
      progressionSummary,
      featSlotsView: {
        featMode,
        maxStandardFeats: regularSlotsEarned,
        takenStandardFeats: regularFeatsTaken,
        takenBonusFeats: bonusFeatsTaken,
        takenFlawFeats: flawFeatsTaken,
        regularSlotsEarned,
        bonusSlotsEarned,
        flawSlotsEarned,
        totalSlotsEarned,
        regularFeatsTaken,
        bonusFeatsTaken,
        flawFeatsTaken,
        openRegularSlots,
        openBonusSlots
      },
      skillBudgetsView: {
        isMerged,
        charLevel: activeLevelsCount,
        maxClassRank,
        maxCrossRank,
        totalBudget: totalSkillPoints,
        spentPoints: spentSkillPoints,
        remainingPoints: remainingSkillPoints,
        totalSkillPoints,
        spentSkillPoints,
        remainingSkillPoints,
        skillTrickCount,
        skillTrickPoints: skillTrickCount * 2,
        isOverBudget: totalSkillPoints > 0 && remainingSkillPoints < 0
      },
      featuresView: {
        featsList: featsListArr,
        featCount: featsListArr.length,
        abilitiesList: abilitiesListArr,
        racialTraits,
        classFeatures,
        templatesAndBoons,
        flawsList
      }
    };
  },

  /**
   * Canonical V3 5-Subsystem & Active Discipline Derivation (`sheet.subsystems`):
   * Computes `totalLevel`, `activeDisciplines`, `psionics`, `incarnum`, `pact`, `shadow`, and `truenaming`
   * with full XPH, MoI, and ToM RAW math and zero unsolicited lazy chunk loading.
   */
  deriveSubsystemsView(w, workingDb = []) {
    if (!w) {
      return {
        totalLevel: 0,
        activeDisciplines: [],
        psionics: { manifesterLevel: 0, basePP: 0, bonusPP: 0, maxPP: 0, currentPP: 0, powers: [] },
        incarnum: { meldshaperLevel: 0, essentiaPool: 0, essentiaCapacity: 1, investedEssentia: 0, availableEssentia: 0, maxSoulmelds: 0, maxChakraBinds: 0, soulmelds: [] },
        pact: { binderLevel: 0, effectiveBinderLevel: 0, maxVestiges: 0, maxVestigeLevel: 0, vestiges: [] },
        shadow: { casterLevel: 0, mysteries: [] },
        truenaming: { truenamerLevel: 0, truespeakBonus: 0, utterances: [] }
      };
    }

    const progRows = Array.isArray(w.levelProgression)
      ? w.levelProgression.filter(p => p && p.active !== false)
      : [];
    const parsedClassEntries = [];
    if (Array.isArray(w.classProgression) && w.classProgression.length > 0) {
      w.classProgression.forEach(cp => {
        if (cp && (cp.className || cp.name || cp.class)) {
          parsedClassEntries.push({ className: String(cp.className || cp.name || cp.class).trim(), level: Number(cp.level) || 1 });
        }
      });
    } else if (w.classLevels && typeof w.classLevels === 'object' && !Array.isArray(w.classLevels)) {
      Object.entries(w.classLevels).forEach(([cName, cLvl]) => {
        if ((Number(cLvl) || 0) > 0) parsedClassEntries.push({ className: String(cName).trim(), level: Number(cLvl) || 1 });
      });
    } else if (Array.isArray(w.classes) && w.classes.length > 0) {
      w.classes.forEach(c => {
        const name = typeof c === 'string' ? c : (c?.name || c?.className || c?.class || '');
        const lvl = (c && typeof c === 'object') ? (Number(c.level) || 1) : (Number(w.level) || 1);
        if (name) parsedClassEntries.push({ className: String(name).trim(), level: lvl });
      });
    } else if (typeof w.classes === 'string' && w.classes.trim()) {
      const parts = w.classes.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        const numMatch = part.match(/(\d+)/);
        const lvl = numMatch ? (parseInt(numMatch[1], 10) || 1) : (parts.length === 1 ? (Number(w.level) || 1) : 1);
        const cName = part.replace(/\d+/g, '').replace(/\b(?:lvl|level)\b/gi, '').trim();
        if (cName) parsedClassEntries.push({ className: cName, level: lvl });
      });
    } else if (typeof w.class === 'string' && w.class.trim()) {
      parsedClassEntries.push({ className: w.class.trim(), level: Number(w.level) || 1 });
    }
    const parsedClassLevelsSum = parsedClassEntries.reduce((acc, c) => acc + (Number(c.level) || 0), 0);
    const hasExplicitZeroLevel = w.level === 0 && progRows.length === 0 && parsedClassLevelsSum === 0;
    const totalLevel = hasExplicitZeroLevel
      ? 0
      : (progRows.length > 0 ? progRows.length : (parsedClassLevelsSum > 0 ? parsedClassLevelsSum : (Number(w.level) || 0)));

    const classLevelsByKey = {};
    if (progRows.length > 0) {
      progRows.forEach(r => {
        const ck = String(r.class || r.className || '').toLowerCase().trim();
        if (ck) classLevelsByKey[ck] = (classLevelsByKey[ck] || 0) + 1;
      });
    } else if (parsedClassEntries.length > 0) {
      parsedClassEntries.forEach(c => {
        const ck = String(c.className || '').toLowerCase().trim();
        if (ck) classLevelsByKey[ck] = (classLevelsByKey[ck] || 0) + (Number(c.level) || 0);
      });
    }

    const getClassLvl = (regex) => {
      let sum = 0;
      Object.entries(classLevelsByKey).forEach(([k, lvl]) => {
        if (regex.test(k)) sum += lvl;
      });
      return sum;
    };

    const allFeatNames = [
      ...(Array.isArray(w.feats) ? w.feats : []),
      ...(Array.isArray(w.specialAbilities) ? w.specialAbilities : []),
      ...progRows.flatMap(r => [...(Array.isArray(r.feats) ? r.feats : []), ...(Array.isArray(r.specialAbilities) ? r.specialAbilities : [])])
    ].map(f => String(typeof f === 'string' ? f : (f?.name || f?.id || '')).toLowerCase().trim()).filter(Boolean);
    const hasFeatMatch = (regex) => allFeatNames.some(fn => regex.test(fn));

    const raceStr = String(w.race || '').toLowerCase().trim();
    const abi = w.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const mods = {
      str: this.getAbilityMod(abi.str || 10),
      dex: this.getAbilityMod(abi.dex || 10),
      con: this.getAbilityMod(abi.con || 10),
      int: this.getAbilityMod(abi.int || 10),
      wis: this.getAbilityMod(abi.wis || 10),
      cha: this.getAbilityMod(abi.cha || 10)
    };

    // Raw subsystem arrays on character
    const rawPowers = Array.isArray(w.psionics?.powers)
      ? w.psionics.powers
      : (Array.isArray(w.powers) ? w.powers : []);
    const rawSoulmelds = Array.isArray(w.incarnum?.soulmelds)
      ? w.incarnum.soulmelds
      : (Array.isArray(w.soulmelds) ? w.soulmelds : []);
    const rawVestiges = Array.isArray(w.pactMagic?.vestiges)
      ? w.pactMagic.vestiges
      : (Array.isArray(w.vestiges) ? w.vestiges : []);
    const rawMysteries = Array.isArray(w.shadowMagic?.mysteries)
      ? w.shadowMagic.mysteries
      : (Array.isArray(w.mysteries) ? w.mysteries : []);
    const rawUtterances = Array.isArray(w.truenaming?.utterances)
      ? w.truenaming.utterances
      : (Array.isArray(w.utterances) ? w.utterances : []);
    const rawManeuvers = Array.isArray(w.spellcasting?.maneuvers)
      ? w.spellcasting.maneuvers
      : (Array.isArray(w.maneuvers) ? w.maneuvers : []);
    const rawSpells = Array.isArray(w.spellcasting?.spells)
      ? w.spellcasting.spells
      : (Array.isArray(w.spells) ? w.spells : []);

    // 1. PSIONICS (XPH RAW)
    const psionLvl = getClassLvl(/\bpsion\b/);
    const wilderLvl = getClassLvl(/\bwilder\b/);
    const psyWarriorLvl = getClassLvl(/\bpsychic\s*warrior\b/);
    const soulknifeLvl = getClassLvl(/\bsoulknife\b/);
    const ardentLvl = getClassLvl(/\bardent\b/);
    const lurkLvl = getClassLvl(/\blurk\b/);
    const divineMindLvl = getClassLvl(/\bdivine\s*mind\b/);
    const eruditeLvl = getClassLvl(/\berudite\b/);
    const totalPsionicClassLvl = psionLvl + wilderLvl + psyWarriorLvl + ardentLvl + lurkLvl + divineMindLvl + eruditeLvl;

    const PSION_BASE_PP = [0, 2, 6, 11, 17, 25, 35, 46, 58, 72, 88, 106, 126, 147, 170, 195, 221, 250, 280, 311, 343];
    const PSYWAR_BASE_PP = [0, 0, 1, 3, 5, 7, 11, 15, 19, 23, 27, 35, 43, 51, 59, 67, 79, 91, 103, 115, 127];
    let calcBasePP = 0;
    if (psionLvl + wilderLvl + ardentLvl + eruditeLvl > 0) {
      const fullMl = Math.min(20, psionLvl + wilderLvl + ardentLvl + eruditeLvl);
      calcBasePP += PSION_BASE_PP[fullMl] || 0;
    }
    if (psyWarriorLvl + lurkLvl + divineMindLvl > 0) {
      const halfMl = Math.min(20, psyWarriorLvl + lurkLvl + divineMindLvl);
      calcBasePP += PSYWAR_BASE_PP[halfMl] || 0;
    }
    const getFeatV3StatOrFallback = (regex, defaultId, targetKey, fallbackVal) => {
      if (!hasFeatMatch(regex)) return 0;
      const rawFeatList = [
        ...(Array.isArray(w.feats) ? w.feats : []),
        ...(Array.isArray(w.specialAbilities) ? w.specialAbilities : []),
        ...progRows.flatMap(r => [...(Array.isArray(r.feats) ? r.feats : []), ...(Array.isArray(r.specialAbilities) ? r.specialAbilities : [])])
      ];
      const matchedRaw = rawFeatList.find(f => {
        const s = String(typeof f === 'string' ? f : (f?.name || f?.id || '')).toLowerCase();
        return regex.test(s);
      });
      const dbF = this.getMasterDbEntry(matchedRaw || defaultId, 'Feat');
      const mergedF = Object.assign({}, dbF || {}, (matchedRaw && typeof matchedRaw === 'object') ? matchedRaw : {});
      if (Array.isArray(mergedF.effects) && mergedF.effects.length > 0) {
        const evalF = this.evaluateV3Entry({ ...mergedF, _v3Evaluated: false, modifiers: [] }, { character: w, level: totalLevel || 1 });
        const tMods = (evalF.modifiers || []).filter(m => m && String(m.target || '').toLowerCase() === targetKey.toLowerCase());
        if (tMods.length > 0) {
          return tMods.reduce((sum, m) => sum + (Number(m.value) || 0), 0);
        }
      }
      return fallbackVal;
    };

    if (hasFeatMatch(/\bwild\s*talent\b/)) calcBasePP += getFeatV3StatOrFallback(/\bwild\s*talent\b/, 'feat-wild-talent', 'psionics.powerPoints', 2);
    if (hasFeatMatch(/\bhidden\s*talent\b/)) calcBasePP += getFeatV3StatOrFallback(/\bhidden\s*talent\b/, 'feat-hidden-talent', 'psionics.powerPoints', 2);
    if (/kalashtar/i.test(raceStr)) calcBasePP += Math.max(1, totalLevel);
    else if (/elans?\b|maenad|xeph|duergar|githyanki|githzerai|synad/i.test(raceStr)) calcBasePP += 2;

    const explicitML = Number(w.psionics?.manifesterLevel ?? w.manifesterLevel ?? 0);
    const hasHiddenTalent = hasFeatMatch(/\bhidden\s*talent\b/);
    const manifesterLevel = explicitML > 0
      ? explicitML
      : (totalPsionicClassLvl > 0
          ? totalPsionicClassLvl
          : ((rawPowers.length > 0 || hasHiddenTalent) ? Math.max(1, totalLevel || 1) : 0));

    let psionicKeyStat = String(w.psionics?.keyAbility || w.psionics?.ability || '').toLowerCase().trim();
    if (!psionicKeyStat) {
      if (wilderLvl > 0 || (hasHiddenTalent && totalPsionicClassLvl === 0)) psionicKeyStat = 'cha';
      else if (psyWarriorLvl > 0 || ardentLvl > 0 || divineMindLvl > 0) psionicKeyStat = 'wis';
      else psionicKeyStat = 'int';
    }
    const keyAbilityMod = mods[psionicKeyStat] !== undefined ? mods[psionicKeyStat] : mods.int;

    const basePP = w.psionics?.basePP !== undefined
      ? Number(w.psionics.basePP)
      : calcBasePP;
    // XPH RAW Table 2-1: Bonus Power Points = floor(keyAbilityMod * ML / 2) when ML >= 1 and keyAbilityMod > 0
    const rawBonusPP = (manifesterLevel >= 1 && keyAbilityMod > 0)
      ? Math.floor((keyAbilityMod * manifesterLevel) / 2)
      : 0;
    const extraBonusPP = Number(w.bonusPowerPoints || w.psionics?.extraPP || 0);
    const bonusPP = w.psionics?.bonusPP !== undefined
      ? Number(w.psionics.bonusPP)
      : (rawBonusPP + extraBonusPP);
    const maxPP = w.psionics?.maxPP !== undefined
      ? Number(w.psionics.maxPP)
      : (basePP + bonusPP);
    const currentPP = w.psionics?.currentPP !== undefined
      ? Math.min(maxPP, Math.max(0, Number(w.psionics.currentPP)))
      : maxPP;

    const evaluatedPowers = rawPowers.map(rawP => {
      const pObj = typeof rawP === 'string' ? { id: rawP, name: rawP } : { ...rawP };
      const dbP = this.getMasterDbEntry(pObj.id || pObj.baseEntryId || pObj.name, 'Power');
      const mergedP = dbP ? { ...dbP, ...pObj, blocks: Array.isArray(pObj.blocks) && pObj.blocks.length > 0 ? pObj.blocks : dbP.blocks } : pObj;
      const powerLvl = Number(mergedP.level ?? mergedP.powerLevel ?? 1) || 1;
      const defaultBaseCost = powerLvl <= 1 ? 1 : (powerLvl * 2 - 1);
      const baseCost = Number(mergedP.baseCost ?? mergedP.powerPoints ?? mergedP.ppCost ?? defaultBaseCost) || defaultBaseCost;
      const requestedAugmentPP = Math.max(0, Number(mergedP.augmentPP ?? mergedP.augmentedPP ?? 0) || 0);
      const maxAugmentByML = Math.max(0, manifesterLevel - baseCost);
      const effectiveAugmentPP = Math.min(requestedAugmentPP, maxAugmentByML);
      const totalPPCost = baseCost + effectiveAugmentPP;
      const isOverMLCap = (baseCost + requestedAugmentPP) > manifesterLevel && manifesterLevel > 0;
      const v3Eval = this.evaluateV3Entry(
        { ...mergedP, schemaVersion: 3 },
        { character: w, level: totalLevel || 1, ml: manifesterLevel, cl: manifesterLevel, augmentPP: effectiveAugmentPP }
      );
      return {
        ...mergedP,
        id: mergedP.id || mergedP.name,
        name: mergedP.name || mergedP.id,
        level: powerLvl,
        baseCost,
        augmentPP: effectiveAugmentPP,
        requestedAugmentPP,
        maxAugmentPP: maxAugmentByML,
        totalPPCost,
        isOverMLCap,
        modifiers: v3Eval.modifiers,
        damageParts: v3Eval.damageParts,
        tacticalBadges: v3Eval.tacticalBadges
      };
    });

    // 2. INCARNUM (MoI RAW)
    const incarnateLvl = getClassLvl(/\bincarnate\b/);
    const totemistLvl = getClassLvl(/\btotemist\b/);
    const soulbornLvl = getClassLvl(/\bsoulborn\b/);
    const totalMeldshaperClassLvl = incarnateLvl + totemistLvl + (soulbornLvl >= 4 ? Math.floor(soulbornLvl / 2) : 0);
    const explicitMeldLvl = Number(w.incarnum?.meldshaperLevel ?? w.meldshaperLevel ?? 0);
    const meldshaperLevel = explicitMeldLvl > 0
      ? explicitMeldLvl
      : (totalMeldshaperClassLvl > 0
          ? totalMeldshaperClassLvl
          : (rawSoulmelds.length > 0 ? Math.max(1, totalLevel || 1) : 0));

    // MoI RAW Table 2-1 Essentia Capacity by character level: 1-5 -> 1, 6-11 -> 2, 12-17 -> 3, 18+ -> 4
    const charLvlForCap = Math.max(1, totalLevel || 1);
    let baseEssentiaCap = 1;
    if (charLvlForCap >= 18) baseEssentiaCap = 4;
    else if (charLvlForCap >= 12) baseEssentiaCap = 3;
    else if (charLvlForCap >= 6) baseEssentiaCap = 2;

    const expandedCapBonus = getFeatV3StatOrFallback(/\bexpanded\s*soulmeld\s*capacity\b/, 'feat-expanded-soulmeld-capacity', 'incarnum.capacityBonus', 1);
    const incarnateCapBonus = incarnateLvl >= 15 ? 2 : (incarnateLvl >= 3 ? 1 : 0);
    const explicitCapBonus = Number(w.incarnum?.capacityBonus ?? 0) || 0;
    const essentiaCapacity = w.incarnum?.essentiaCapacity !== undefined
      ? Number(w.incarnum.essentiaCapacity)
      : (baseEssentiaCap + expandedCapBonus + incarnateCapBonus + explicitCapBonus);

    let calcEssentiaPool = 0;
    if (incarnateLvl > 0) calcEssentiaPool += incarnateLvl;
    if (totemistLvl > 0) calcEssentiaPool += totemistLvl;
    if (soulbornLvl >= 2) calcEssentiaPool += Math.floor(soulbornLvl / 2);
    if (/azurin|duskling|rilkan|skarn/i.test(raceStr)) calcEssentiaPool += 1;
    if (hasFeatMatch(/\bbonus\s*essentia\b/)) calcEssentiaPool += getFeatV3StatOrFallback(/\bbonus\s*essentia\b/, 'feat-bonus-essentia', 'incarnum.essentiaPool', 2);
    allFeatNames.forEach(fn => {
      if (/\b(?:azure|cerulean|cobalt|midnight|soultouched|psycarnum|healing\s*soul|indigo)\b/.test(fn) && !/bonus\s*essentia/.test(fn)) {
        calcEssentiaPool += 1;
      }
    });

    const essentiaPool = w.incarnum?.essentiaPool !== undefined
      ? Number(w.incarnum.essentiaPool)
      : calcEssentiaPool;

    let totalInvestedEssentia = 0;
    const evaluatedSoulmelds = rawSoulmelds.map(rawSm => {
      const smObj = typeof rawSm === 'string' ? { id: rawSm, name: rawSm, essentia: 0 } : { ...rawSm };
      const dbSm = this.getMasterDbEntry(smObj.id || smObj.baseEntryId || smObj.name, 'Soulmeld');
      const mergedSm = dbSm ? {
        ...dbSm,
        ...smObj,
        blocks: Array.isArray(smObj.blocks) && smObj.blocks.length > 0 ? smObj.blocks : dbSm.blocks,
        chakraBinds: smObj.chakraBinds || dbSm.chakraBinds
      } : smObj;
      const smCapBonus = Number(mergedSm.capacityBonus || 0) || 0;
      const maxCap = essentiaCapacity + smCapBonus;
      const rawInvested = Math.max(0, Number(mergedSm.essentia ?? mergedSm.investedEssentia ?? 0) || 0);
      const invested = Math.min(rawInvested, maxCap);
      if (mergedSm.shaped !== false && mergedSm.active !== false) {
        totalInvestedEssentia += invested;
      }
      const boundChakra = mergedSm.boundChakra || mergedSm.chakraBind || null;
      const v3Eval = this.evaluateV3Entry(
        { ...mergedSm, essentia: invested, boundChakra, schemaVersion: 3 },
        { character: w, level: totalLevel || 1, cl: meldshaperLevel || totalLevel || 1, essentia: invested, boundChakra }
      );
      return {
        ...mergedSm,
        id: mergedSm.id || mergedSm.name,
        name: mergedSm.name || mergedSm.id,
        essentia: invested,
        maxCapacity: maxCap,
        boundChakra,
        modifiers: v3Eval.modifiers,
        damageParts: v3Eval.damageParts,
        tacticalBadges: v3Eval.tacticalBadges
      };
    });

    const investedEssentia = w.incarnum?.investedEssentia !== undefined
      ? Number(w.incarnum.investedEssentia)
      : totalInvestedEssentia;
    const availableEssentia = Math.max(0, essentiaPool - investedEssentia);
    const conScore = Number(abi.con || 10);
    const maxSoulmeldsByCon = Math.max(0, conScore - 10);
    const calcMaxSoulmelds = (incarnateLvl + totemistLvl + soulbornLvl) > 0
      ? Math.min(maxSoulmeldsByCon, Math.max(2, Math.floor((incarnateLvl + totemistLvl) / 3) + 2))
      : (hasFeatMatch(/\bshape\s*soulmeld\b/) ? 1 : rawSoulmelds.length);
    const maxSoulmelds = w.incarnum?.maxSoulmelds !== undefined
      ? Number(w.incarnum.maxSoulmelds)
      : calcMaxSoulmelds;
    const maxChakraBinds = w.incarnum?.maxChakraBinds !== undefined
      ? Number(w.incarnum.maxChakraBinds)
      : ((incarnateLvl + totemistLvl) >= 2 ? Math.max(1, Math.floor((incarnateLvl + totemistLvl + 2) / 4)) : (hasFeatMatch(/\bopen\s+(?:least|lesser|greater)\s+chakra\b/) ? 1 : 0));

    // 3. PACT MAGIC (ToM RAW)
    const binderClassLvl = getClassLvl(/\bbinder\b/);
    const explicitBinderLvl = Number(w.pactMagic?.binderLevel ?? w.binderLevel ?? 0);
    const binderLevel = explicitBinderLvl > 0
      ? explicitBinderLvl
      : (binderClassLvl > 0 ? binderClassLvl : (rawVestiges.length > 0 ? Math.max(1, totalLevel || 1) : 0));
    const hasImpBindVestige = hasFeatMatch(/\bimproved\s*bind\s*vestige\b/);
    const hasExpelVestige = hasFeatMatch(/\bexpel\s*vestige\b/);
    const explicitEBL = Number(w.pactMagic?.effectiveBinderLevel ?? w.effectiveBinderLevel ?? 0);
    const effectiveBinderLevel = explicitEBL > 0
      ? explicitEBL
      : (binderLevel + (hasImpBindVestige ? 2 : 0));

    // ToM Table 1-1: Max Vestiges by Binder Level (1-7:1, 8-13:2, 14-19:3, 20+:4)
    let calcMaxVestiges = 0;
    if (binderLevel >= 20) calcMaxVestiges = 4;
    else if (binderLevel >= 14) calcMaxVestiges = 3;
    else if (binderLevel >= 8) calcMaxVestiges = 2;
    else if (binderLevel >= 1 || hasFeatMatch(/\bbind\s*vestige\b/) || rawVestiges.length > 0) calcMaxVestiges = 1;

    // ToM Table 1-1: Max Vestige Level by Effective Binder Level (1-2:1, 3-4:2, 5-6:3, 7-9:4, 10-11:5, 12-14:6, 15-16:7, 17+:8)
    let calcMaxVestigeLevel = 0;
    if (effectiveBinderLevel >= 17) calcMaxVestigeLevel = 8;
    else if (effectiveBinderLevel >= 15) calcMaxVestigeLevel = 7;
    else if (effectiveBinderLevel >= 12) calcMaxVestigeLevel = 6;
    else if (effectiveBinderLevel >= 10) calcMaxVestigeLevel = 5;
    else if (effectiveBinderLevel >= 7) calcMaxVestigeLevel = 4;
    else if (effectiveBinderLevel >= 5) calcMaxVestigeLevel = 3;
    else if (effectiveBinderLevel >= 3) calcMaxVestigeLevel = 2;
    else if (effectiveBinderLevel >= 1) calcMaxVestigeLevel = 1;

    const maxVestiges = w.pactMagic?.maxVestiges !== undefined ? Number(w.pactMagic.maxVestiges) : calcMaxVestiges;
    const maxVestigeLevel = w.pactMagic?.maxVestigeLevel !== undefined ? Number(w.pactMagic.maxVestigeLevel) : calcMaxVestigeLevel;

    const evaluatedVestiges = rawVestiges.map(rawV => {
      const vObj = typeof rawV === 'string' ? { id: rawV, name: rawV } : { ...rawV };
      const dbV = this.getMasterDbEntry(vObj.id || vObj.baseEntryId || vObj.name, 'Vestige');
      const mergedV = dbV ? {
        ...dbV,
        ...vObj,
        blocks: Array.isArray(vObj.blocks) && vObj.blocks.length > 0 ? vObj.blocks : dbV.blocks
      } : vObj;
      const v3Eval = this.evaluateV3Entry(
        { ...mergedV, schemaVersion: 3 },
        { character: w, level: totalLevel || 1, ebl: effectiveBinderLevel || 1, cl: effectiveBinderLevel || totalLevel || 1 }
      );
      return {
        ...mergedV,
        id: mergedV.id || mergedV.name,
        name: mergedV.name || mergedV.id,
        level: Number(mergedV.level ?? mergedV.vestigeLevel ?? 1) || 1,
        bindingDC: Number(mergedV.bindingDC ?? mergedV.dc ?? 15) || 15,
        modifiers: v3Eval.modifiers,
        damageParts: v3Eval.damageParts,
        tacticalBadges: v3Eval.tacticalBadges
      };
    });

    // 4. SHADOW MAGIC (ToM RAW)
    const shadowcasterLvl = getClassLvl(/\bshadowcaster\b/);
    const explicitShadowCL = Number(w.shadowMagic?.casterLevel ?? w.shadowCasterLevel ?? 0);
    const shadowCasterLevel = explicitShadowCL > 0
      ? explicitShadowCL
      : (shadowcasterLvl > 0 ? shadowcasterLvl : (rawMysteries.length > 0 ? Math.max(1, totalLevel || 1) : 0));

    const evaluatedMysteries = rawMysteries.map(rawM => {
      const mObj = typeof rawM === 'string' ? { id: rawM, name: rawM } : { ...rawM };
      const dbM = this.getMasterDbEntry(mObj.id || mObj.baseEntryId || mObj.name, 'Mystery');
      const mergedM = dbM ? {
        ...dbM,
        ...mObj,
        blocks: Array.isArray(mObj.blocks) && mObj.blocks.length > 0 ? mObj.blocks : dbM.blocks
      } : mObj;
      const mysLvl = Number(mergedM.level ?? mergedM.mysteryLevel ?? 1) || 1;
      const tier = mergedM.tier || (mysLvl <= 3 ? 'Apprentice' : (mysLvl <= 6 ? 'Initiate' : 'Master'));
      // ToM Shadowcaster progression: Apprentice (1-3) -> Spell (CL 1-6), Sp (CL 7-12, 2/day), Su (CL 13+, 3/day)
      let castType = 'Spell';
      let usesPerDay = 1;
      if (tier === 'Apprentice') {
        if (shadowCasterLevel >= 13) { castType = 'Su'; usesPerDay = 3; }
        else if (shadowCasterLevel >= 7) { castType = 'Sp'; usesPerDay = 2; }
        else { castType = 'Spell'; usesPerDay = 1; }
      } else if (tier === 'Initiate') {
        if (shadowCasterLevel >= 13) { castType = 'Sp'; usesPerDay = 2; }
        else { castType = 'Spell'; usesPerDay = 1; }
      } else {
        castType = 'Spell';
        usesPerDay = 1;
      }
      const v3Eval = this.evaluateV3Entry(
        { ...mergedM, schemaVersion: 3 },
        { character: w, level: totalLevel || 1, cl: shadowCasterLevel || 1 }
      );
      return {
        ...mergedM,
        id: mergedM.id || mergedM.name,
        name: mergedM.name || mergedM.id,
        level: mysLvl,
        tier,
        castType,
        usesPerDay: Number(mergedM.usesPerDay || usesPerDay) || usesPerDay,
        modifiers: v3Eval.modifiers,
        damageParts: v3Eval.damageParts,
        tacticalBadges: v3Eval.tacticalBadges
      };
    });

    // 5. TRUENAMING (ToM RAW - Law of Resistance)
    const truenamerClassLvl = getClassLvl(/\btruenamer\b/);
    const explicitTruenamerLvl = Number(w.truenaming?.truenamerLevel ?? w.truenamerLevel ?? 0);
    const truenamerLevel = explicitTruenamerLvl > 0
      ? explicitTruenamerLvl
      : (truenamerClassLvl > 0 ? truenamerClassLvl : (rawUtterances.length > 0 ? Math.max(1, totalLevel || 1) : 0));

    let truespeakBonus = Number(w.truenaming?.truespeakBonus ?? 0);
    if (!truespeakBonus && w.skills && typeof w.skills === 'object') {
      const tsSkill = w.skills.truespeak || w.skills.Truespeak;
      if (tsSkill) {
        const ranks = Number(tsSkill.ranks || 0);
        const misc = Number(tsSkill.misc || 0);
        truespeakBonus = ranks + mods.int + misc;
      }
    }

    const evaluatedUtterances = rawUtterances.map(rawU => {
      const uObj = typeof rawU === 'string' ? { id: rawU, name: rawU } : { ...rawU };
      const dbU = this.getMasterDbEntry(uObj.id || uObj.baseEntryId || uObj.name, 'Utterance');
      const mergedU = dbU ? {
        ...dbU,
        ...uObj,
        blocks: Array.isArray(uObj.blocks) && uObj.blocks.length > 0 ? uObj.blocks : dbU.blocks
      } : uObj;
      const targetCR = Math.max(1, Number(mergedU.targetCR ?? w.truenaming?.targetCR ?? totalLevel ?? 1) || 1);
      const castsToday = Math.max(0, Number(mergedU.castsToday ?? mergedU.usesToday ?? 0) || 0);
      // ToM p.195 Law of Resistance: Truespeak DC = 15 + (2 * CR) + (2 * castsToday)
      const lawOfResistanceDC = 15 + (2 * targetCR) + (2 * castsToday);
      const v3Eval = this.evaluateV3Entry(
        { ...mergedU, schemaVersion: 3 },
        { character: w, level: totalLevel || 1, cl: truenamerLevel || 1, targetCR, castsToday }
      );
      return {
        ...mergedU,
        id: mergedU.id || mergedU.name,
        name: mergedU.name || mergedU.id,
        level: Number(mergedU.level ?? mergedU.utteranceLevel ?? 1) || 1,
        targetCR,
        castsToday,
        dc: lawOfResistanceDC,
        lawOfResistanceDC,
        modifiers: v3Eval.modifiers,
        damageParts: v3Eval.damageParts,
        tacticalBadges: v3Eval.tacticalBadges
      };
    });

    // 6. ACTIVE DISCIPLINES DETECTION
    // Canonical order: ['spontaneous','prepared','divine','martial','psionics','incarnum','pact','shadow','truenaming']
    const discSet = new Set();
    const castTypeLow = String(w.spellcasting?.castType || w.spellcasting?.type || '').toLowerCase();
    const hasSpontaneousClass = getClassLvl(/\b(?:sorcerer|bard|warmage|dread\s*necromancer|beguiler|duskblade|favored\s*soul|spirit\s*shaman|dragon\s*shaman|spellthief|hexblade)\b/) > 0;
    const hasPreparedArcaneClass = getClassLvl(/\b(?:wizard|wu\s*jen|archivist|artificer|mage)\b/) > 0;
    const hasDivineClass = getClassLvl(/\b(?:cleric|druid|paladin|ranger|favored\s*soul|spirit\s*shaman|archivist|shugenja|healer|adept|blackguard)\b/) > 0;
    const hasMartialClass = getClassLvl(/\b(?:warblade|swordsage|crusader|bloodclaw\s*master|bloodstorm\s*blade|deepstone\s*sentinel|eternal\s*blade|jade\s*phoenix\s*mage|master\s*of\s*nine|ruby\s*knight\s*vindicator|shadow\s*sun\s*ninja)\b/) > 0;

    if (hasSpontaneousClass || castTypeLow.includes('spontaneous') || rawSpells.some(s => s && /spontaneous/i.test(String(s.castType || s.prepMode || '')))) {
      discSet.add('spontaneous');
    }
    if (hasPreparedArcaneClass || castTypeLow.includes('prepared') || (rawSpells.length > 0 && !hasSpontaneousClass && !hasDivineClass)) {
      discSet.add('prepared');
    }
    if (hasDivineClass || castTypeLow.includes('divine') || (Array.isArray(w.domains) && w.domains.length > 0) || rawSpells.some(s => s && /divine|cleric|druid|paladin|ranger/i.test(String(s.tradition || s.sourceClass || s.type || '')))) {
      discSet.add('divine');
    }
    if (hasMartialClass || rawManeuvers.length > 0 || hasFeatMatch(/\bmartial\s*(?:study|stance)\b/)) {
      discSet.add('martial');
    }
    if (totalPsionicClassLvl > 0 || soulknifeLvl > 0 || rawPowers.length > 0 || maxPP > 0 || hasFeatMatch(/\b(?:wild|hidden)\s*talent\b/)) {
      discSet.add('psionics');
    }
    if (totalMeldshaperClassLvl > 0 || rawSoulmelds.length > 0 || essentiaPool > 0 || hasFeatMatch(/\b(?:shape\s*soulmeld|open\s*(?:least|lesser|greater)\s*chakra|bonus\s*essentia)\b/)) {
      discSet.add('incarnum');
    }
    if (binderClassLvl > 0 || rawVestiges.length > 0 || hasFeatMatch(/\b(?:bind\s*vestige|improved\s*bind\s*vestige)\b/)) {
      discSet.add('pact');
    }
    if (shadowcasterLvl > 0 || rawMysteries.length > 0 || hasFeatMatch(/\b(?:shadow\s*cast|path\s*focus|favored\s*mystery)\b/)) {
      discSet.add('shadow');
    }
    if (truenamerClassLvl > 0 || rawUtterances.length > 0 || hasFeatMatch(/\b(?:minor\s*utterance|utterance\s*focus)\b/)) {
      discSet.add('truenaming');
    }

    // Check homebrewBoons / specialAbilities for granted spells/powers/maneuvers
    const boonsAndAbilities = [
      ...(Array.isArray(w.homebrewBoons) ? w.homebrewBoons : []),
      ...(Array.isArray(w.specialAbilities) ? w.specialAbilities : [])
    ];
    boonsAndAbilities.forEach(b => {
      if (!b || typeof b !== 'object' || b.active === false) return;
      const bCat = String(b.category || b.type || b.discipline || '').toLowerCase();
      if (bCat.includes('psionic') || b.grantedPower) discSet.add('psionics');
      if (bCat.includes('incarnum') || bCat.includes('soulmeld')) discSet.add('incarnum');
      if (bCat.includes('vestige') || bCat.includes('pact')) discSet.add('pact');
      if (bCat.includes('shadow') || bCat.includes('mystery')) discSet.add('shadow');
      if (bCat.includes('truename') || bCat.includes('utterance')) discSet.add('truenaming');
      if (bCat.includes('martial') || bCat.includes('maneuver')) discSet.add('martial');
      if (b.grantedSpell || bCat.includes('spell-like')) discSet.add('spontaneous');
    });

    const canonicalOrder = ['spontaneous', 'prepared', 'divine', 'martial', 'psionics', 'incarnum', 'pact', 'shadow', 'truenaming'];
    const activeDisciplines = canonicalOrder.filter(d => discSet.has(d));

    return {
      totalLevel,
      activeDisciplines,
      psionics: {
        manifesterLevel,
        basePP,
        bonusPP,
        maxPP,
        currentPP,
        powers: evaluatedPowers
      },
      incarnum: {
        meldshaperLevel,
        essentiaPool,
        essentiaCapacity,
        investedEssentia,
        availableEssentia,
        maxSoulmelds,
        maxChakraBinds,
        soulmelds: evaluatedSoulmelds
      },
      pact: {
        binderLevel,
        effectiveBinderLevel,
        maxVestiges,
        maxVestigeLevel,
        vestiges: evaluatedVestiges
      },
      shadow: {
        casterLevel: shadowCasterLevel,
        mysteries: evaluatedMysteries
      },
      truenaming: {
        truenamerLevel,
        truespeakBonus,
        utterances: evaluatedUtterances
      }
    };
  },

  _fastClonePlain(val) {
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      const len = val.length;
      const arr = new Array(len);
      for (let i = 0; i < len; i++) arr[i] = this._fastClonePlain(val[i]);
      return arr;
    }
    const out = {};
    const keys = Object.keys(val);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = this._fastClonePlain(val[k]);
    }
    return out;
  },

  _cloneCharForDerive(inputChar) {
    if (!inputChar || typeof inputChar !== 'object') return {};
    const shareByRef = {
      portrait: true, wallpaper: true, avatar: true, image: true,
      customDb: true, smartNotes: true, journal: true, diceHistory: true, bio: true
    };
    const transientSkip = {
      legoEvaluation: true, evaluatedDefenses: true, evaluatedResources: true,
      evaluatedModes: true, grantedCapabilities: true, abilitySources: true,
      initiativeBreakdown: true, activeConditionWarnings: true, twoHandedConflict: true,
      _workingSnapshot: true
    };
    const out = {};
    const keys = Object.keys(inputChar);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (transientSkip[k]) continue;
      if (shareByRef[k]) {
        out[k] = inputChar[k];
      } else {
        out[k] = this._fastClonePlain(inputChar[k]);
      }
    }
    return out;
  },

  /**
   * Pure, zero-mutation sheet derivation pipeline (Phase R1 Strangler Fig + Sprint B.5 Zero-Clone).
   * Accepts `(inputChar, customDb, tacticalOptions)` or `(inputChar, { masterDb, session, tactical })`.
   * Returns a self-contained `SheetView` without mutating `inputChar` or `customDb`.
   */
  deriveSheet(inputChar, customDbOrOptions = [], tacticalOptions = {}) {
    const working = this._cloneCharForDerive(inputChar);
    const fallbackDb = Array.isArray(working.customDb) ? working.customDb : [];
    let rawDb = [];
    let rawSession = null;
    let resolvedTactical = Object.assign({}, tacticalOptions || {});

    if (Array.isArray(customDbOrOptions)) {
      rawDb = customDbOrOptions.length > 0
        ? customDbOrOptions
        : fallbackDb;
    } else if (customDbOrOptions && typeof customDbOrOptions === 'object') {
      rawDb = Array.isArray(customDbOrOptions.customDb)
        ? customDbOrOptions.customDb
        : (Array.isArray(customDbOrOptions.masterDb)
          ? customDbOrOptions.masterDb
          : fallbackDb);
      if (customDbOrOptions.session && typeof customDbOrOptions.session === 'object') {
        rawSession = customDbOrOptions.session;
      }
      resolvedTactical = Object.assign({}, customDbOrOptions.tactical || tacticalOptions || {});
    } else {
      rawDb = fallbackDb;
    }
    // Preserve masterDb entry object identities so SrdCompendium WeakMap hash cache hits in O(1)
    const workingDb = Array.isArray(rawDb) ? rawDb : [];
    const workingSession = rawSession ? this._fastClonePlain(rawSession) : null;
    if (
      workingSession &&
      workingSession.actionEconomy &&
      !resolvedTactical.spentActions &&
      !working.tactical?.spentActions &&
      Object.values(workingSession.actionEconomy).some(Boolean)
    ) {
      resolvedTactical.spentActions = Object.assign({}, workingSession.actionEconomy);
    }

    const migrator = (typeof window !== 'undefined' && window.SchemaMigrator)
      || (typeof SchemaMigrator !== 'undefined' ? SchemaMigrator : null);
    if (migrator && typeof migrator.sanitizeCharacterAbilitiesAndPool === 'function') {
      migrator.sanitizeCharacterAbilitiesAndPool(working);
    }

    this.recalculateCharacter(working, workingDb, resolvedTactical);

    const abi = working.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const mods = {
      str: this.getAbilityMod(abi.str || 10),
      dex: this.getAbilityMod(abi.dex || 10),
      con: this.getAbilityMod(abi.con || 10),
      int: this.getAbilityMod(abi.int || 10),
      wis: this.getAbilityMod(abi.wis || 10),
      cha: this.getAbilityMod(abi.cha || 10)
    };

    const evaluatedWeapons = (working.weapons || []).map(w => {
      const isOff = w.slot === 'offHand' || /off-?hand/i.test(String(w.grip || ''));
      const evalRes = this.evaluateWeaponAttack(working, w, {
        grip: isOff ? 'Off-Hand' : (w.grip || '1-Hand')
      });
      return {
        ...w,
        evaluated: evalRes
      };
    });

    const consumablesGrouped = this.deriveConsumablesView(working);
    const inventoryView = this.deriveInventoryView(working);
    const spellsView = this.deriveSpellsView(working, workingDb);
    const progressionView = this.deriveProgressionView(working, workingDb);
    const subsystemsView = this.deriveSubsystemsView(working, workingDb);
    const specialPool = this.deriveSpecialPowerPool(working, working.legoEvaluation, workingDb);
    const specialAttacks = specialPool.filter(r => r.category === 'attack');
    const activatedAbilities = specialPool.filter(r => r.category === 'ability' || r.category === 'spell');
    const activeBuffsStrip = this.deriveActiveBuffsStrip(working);
    const skillsBonusMap = this.deriveSkillsBonusMap(working);
    const spent = working.tactical?.spentActions || working.actionEconomy?.spentActions || {};
    const ae = working.actionEconomy || {};
    const isActionAvailable = (val, spentFlag) => {
      if (spentFlag === true) return false;
      if (val === false || val === 'spent' || val === 'unavailable' || val === 'consumed_by_immediate' || val === 'consumed_by_swift') return false;
      return true;
    };
    const derivedActionEconomy = {
      standard: isActionAvailable(ae.standard, spent.standard),
      move: isActionAvailable(ae.move, spent.move),
      swift: isActionAvailable(ae.swift, spent.swift),
      immediate: isActionAvailable(ae.immediate, spent.immediate)
    };
    const derivedTactical = {
      powerAttack: Number(working.tactical?.powerAttack || 0),
      combatExpertise: Number(working.tactical?.combatExpertise || 0),
      fightingDefensively: Boolean(working.tactical?.fightingDefensively),
      totalDefense: Boolean(working.tactical?.totalDefense),
      shieldBlockActive: Boolean(working.tactical?.shieldBlockActive),
      flanking: Boolean(working.tactical?.flanking),
      charge: Boolean(working.tactical?.charge),
      higherGround: Boolean(working.tactical?.higherGround),
      activeWeaponSet: Number(working.activeWeaponSet || (working.tactical?.weaponSets?.activeSet === 2 ? 2 : 1)),
      maxBabCap: Math.min(5, Number(working.bab || 0))
    };

    return {
      meta: {
        id: working.id || null,
        name: working.name || 'Unnamed Hero',
        race: working.race || 'Human',
        size: working.size || 'Medium',
        alignment: working.alignment || 'Neutral',
        deity: working.deity || '',
        classes: working.classes || '',
        level: Number(working.level) || 1,
        ecl: Number(working.ecl) || Number(working.level) || 1,
        levelAdjustment: Number(working.levelAdjustment) || 0,
        templateSummary: working.templateSummary || null
      },
      abilities: {
        str: abi.str,
        dex: abi.dex,
        con: abi.con,
        int: abi.int,
        wis: abi.wis,
        cha: abi.cha,
        mods,
        sources: working.abilitySources || {}
      },
      ac: {
        ...(working.acBreakdown || {}),
        conditionalBonuses: working.conditionalAcBonuses || []
      },
      saves: {
        ...(working.evaluatedSaves || {}),
        detail: working.saves || {},
        conditionalBonuses: working.conditionalSaveBonuses || []
      },
      hp: {
        current: Number(working.hp?.current ?? working.hp?.max ?? 10),
        max: Number(working.hp?.max ?? 10),
        temp: Number(working.hp?.temp ?? 0),
        nonlethal: Number(working.hp?.nonlethal ?? 0),
        baseMax: Number(working.hp?.baseMax ?? 10),
        conBonusHp: Number(working.hp?.conBonusHp ?? 0),
        bonusFeatHp: Number(working.hp?.bonusFeatHp ?? 0),
        flawHpPenalty: Number(working.hp?.flawHpPenalty ?? 0),
        debuffHpPenalty: Number(working.hp?.debuffHpPenalty ?? 0),
        periodicEffects: working.periodicHpEffects || []
      },
      combat: {
        round: Number(working.tactical?.round || working.encounterRound || 1),
        bab: Number(working.bab) || 0,
        grapple: Number(working.grappleBonus) || 0,
        initiative: (Number(working.buffInitiativeBonus) || 0) + (() => {
          const initSwap = this.resolveSwapSlot(working.legoEvaluation?.replacements, 'initiative.abilityMod', mods.dex, 'DEX', { character: working });
          return initSwap.value + initSwap.addItems.reduce((s, x) => s + x.val, 0);
        })(),
        initiativeBreakdown: working.initiativeBreakdown || [],
        speed: {
          land: working.effectiveSpeed || working.baseSpeed || 30,
          swim: working.swimSpeed || 0,
          climb: working.climbSpeed || 0,
          fly: working.flySpeed || 0,
          burrow: working.burrowSpeed || 0
        },
        weapons: evaluatedWeapons,
        modes: working.evaluatedModes || [],
        actionEconomy: derivedActionEconomy,
        tactical: derivedTactical,
        specialAttacks,
        activatedAbilities,
        activeBuffsStrip
      },
      defenses: {
        ...(working.evaluatedDefenses || {}),
        ruleFlags: working.ruleFlags || {}
      },
      resources: working.evaluatedResources || {},
      lego: working.legoEvaluation || { entries: [], modes: [], defenses: {}, resources: {} },
      inventory: {
        bodySlots: working.bodySlots || {},
        gearPool: working.gearPool || [],
        consumables: working.consumables || [],
        consumablesGrouped,
        encumbranceView: inventoryView.encumbranceView,
        wealthView: inventoryView.wealthView,
        bodySlotsView: inventoryView.bodySlotsView,
        poolRows: inventoryView.poolRows,
        weaponsView: inventoryView.weaponsView,
        armorView: inventoryView.armorView
      },
      spells: {
        spellcasting: working.spellcasting || {},
        bonusSpellSlotsByLevel: working.bonusSpellSlotsByLevel || {},
        bonusPowerPoints: Number(working.bonusPowerPoints) || 0,
        buffs: working.buffs || [],
        casterStatsView: spellsView.casterStatsView,
        slotsByLevelView: spellsView.slotsByLevelView,
        spellsByLevelView: spellsView.spellsByLevelView,
        maneuversView: spellsView.maneuversView
      },
      subsystems: subsystemsView,
      progression: progressionView,
      skillsBonusMap,
      session: workingSession,
      warnings: working.activeConditionWarnings || [],
      _workingSnapshot: working
    };
  },

  /**
   * Strangler Fig Compatibility Bridge (`R1`–`R6`):
   * Copies all derived & sanitized fields from a deep-cloned `sheetView._workingSnapshot`
   * back onto `targetChar` in memory so unmigrated tabs achieve 100% Deep-Equal parity.
   */
  writeBackLegacyFields(targetChar, sheetView) {
    if (!targetChar || !sheetView || !sheetView._workingSnapshot) return targetChar;
    const prevPlayerTs = targetChar.hp?._lastPlayerChangeTs;
    const prevDmTs = targetChar.hp?._lastDmUpdateTs;
    const snap = sheetView._workingSnapshot;
    const preserveRefs = { customDb: true, portrait: true, wallpaper: true, smartNotes: true, journal: true, diceHistory: true };
    const snapKeys = Object.keys(snap);
    for (let i = 0; i < snapKeys.length; i++) {
      const k = snapKeys[i];
      if (preserveRefs[k] && targetChar[k] !== undefined) continue;
      targetChar[k] = this._fastClonePlain(snap[k]);
    }
    if (targetChar.hp && typeof targetChar.hp === 'object') {
      if (targetChar.hp._lastDmUpdateTs === undefined && prevDmTs !== undefined) {
        targetChar.hp._lastDmUpdateTs = prevDmTs;
      }
      if (prevPlayerTs !== undefined || targetChar.hp._lastPlayerChangeTs !== undefined) {
        targetChar.hp._lastPlayerChangeTs = Math.max(
          Number(prevPlayerTs) || 0,
          Number(targetChar.hp._lastPlayerChangeTs) || 0
        );
      }
    }
    return targetChar;
  },

  TACTICAL_MOD_KEYS: Object.freeze([
    'flanking', 'charge', 'higherGround',
    'fightingDefensively', 'totalDefense', 'shieldBlockActive',
    'powerAttackActive', 'combatExpertiseActive',
    'rapidShot', 'manyshot', 'pointBlankShot', 'deadlyAim',
    'targetInMelee', 'coverPenalty', 'defensiveCastingActive',
    'rangePenalty', 'enhanceArrow', 'trueStrike', 'sneakAttack', 'bootsHaste', 'witchlightSpeed'
  ]),

  /**
   * Returns a clean clone of `charDoc` with heavy transient evaluation-only properties stripped,
   * while preserving `abilities`, `hp`, `acBreakdown`, `evaluatedSaves`, and `saves` for `hub.html` card compatibility.
   */
  stripDerivedFields(charDoc) {
    if (!charDoc || typeof charDoc !== 'object') return charDoc;
    const clean = this._cloneCharForDerive(charDoc);
    if (Array.isArray(charDoc.customDb)) {
      clean.customDb = charDoc.customDb.slice();
    }
    return clean;
  }
};

// Export for module systems and attach to window/globalThis
if (typeof window !== 'undefined') {
  window.RuleEngine = RuleEngine;
}
if (typeof globalThis !== 'undefined') {
  globalThis.RuleEngine = RuleEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RuleEngine;
}
