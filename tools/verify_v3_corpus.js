#!/usr/bin/env node
'use strict';

/**
 * 0-Token Canonical V3 Corpus Compatibility & Dialect Scanner (`tools/verify_v3_corpus.js`)
 * Scans all 7,987 entries across the 24 modular SRD/Splat/MIC database chunks in ~1 second (0 LLM tokens),
 * testing lossless V2 -> V3 adaptation, Sprint B V3 dialect parity, dynamic formula preservation,
 * and classifying any unmapped targets/flags for Sprint C scope review.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');

const CANONICAL_V3_BLOCK_TYPES = new Set([
  'stat', 'roll', 'attack', 'defense', 'effect', 'resource', 'when', 'table', 'carrier'
]);

const SIZE_SCOPES = new Set(['grapple', 'bullRush', 'trip', 'overrun', 'sunder', 'weaponSize', 'opposedSize']);
const CANONICAL_V3_TARGETS = new Set([
  'str', 'dex', 'con', 'int', 'wis', 'cha',
  'choice.ability.1', 'choice.ability.2', 'choice.ability.3', 'choice.ability.4',
  'choice.skill.1', 'choice.save.1', 'choice.school.1',
  'ac.total', 'ac.touch', 'ac.flatFooted', 'ac.armor', 'ac.shield', 'ac.shieldBonus', 'ac.natural', 'ac.deflection', 'ac.dodge', 'ac.size', 'ac.luck', 'ac.insight', 'ac.sacred', 'ac.profane', 'ac.cover',
  'save.all', 'save.fort', 'save.ref', 'save.will',
  'atk.all', 'atk.melee', 'atk.ranged', 'atk.weapon', 'atk.touch', 'atk.grapple', 'atk.natural', 'atk.critConfirm',
  'dmg.all', 'dmg.melee', 'dmg.ranged', 'dmg.weapon', 'dmg.sneakAttack', 'dmg.natural', 'dmg.unarmed',
  'initiative', 'grapple',
  'cmd.stability', 'size.effective', 'healing.receivedMultiplier', 'spell.asf', 'cmd.bullRush', 'cmd.trip', 'cmd.overrun', 'cmd.bullRushTripDisarmOverrun',
  'speed.land', 'speed.fly', 'speed.swim', 'speed.climb', 'speed.burrow', 'speed.all',
  'hp.temp', 'hp.max', 'hp.perLevel', 'fastHealing',
  'casterLevel', 'spell.dc', 'spell.effectiveLevel', 'spell.damage', 'sr.penetration', 'caster.spellPenetration',
  'sr', 'dr', 'fortification', 'turnLevel', 'turning.check', 'turning.damageDice', 'wildEmpathy', 'carryingCapacity',
  'resource.pp', 'resource.essentia', 'psionics.powerPoints', 'incarnum.essentiaPool', 'incarnum.capacityBonus',
  'entity.animal_companion.levelBonus', 'entity.familiar.levelBonus', 'entity.special_mount.levelBonus', 'entity.fiendish_servant.levelBonus',
  'skill.all'
]);

// All 40 canonical skills (36 PHB + 4 Sprint B subsystem skills)
const CANONICAL_SKILLS = [
  'appraise', 'autohypnosis', 'balance', 'bluff', 'climb', 'concentration', 'craft',
  'decipher-script', 'diplomacy', 'disable-device', 'disguise', 'escape-artist', 'forgery',
  'gather-information', 'handle-animal', 'heal', 'hide', 'intimidate', 'jump', 'knowledge',
  'knowledge-psionics', 'listen', 'move-silently', 'open-lock', 'perform', 'profession',
  'psicraft', 'ride', 'search', 'sense-motive', 'sleight-of-hand', 'speak-language',
  'spellcraft', 'spot', 'survival', 'swim', 'truespeak', 'tumble', 'use-magic-device',
  'use-psionic-device', 'use-rope'
];
CANONICAL_SKILLS.forEach((s) => CANONICAL_V3_TARGETS.add('skill.' + s));

// Deterministic alias dictionary bridging V2 DB, RuleEngine, and Sprint B Splat V3 shorthand
const TARGET_ALIAS_MAP = {
  'ability.str': 'str', 'ability.dex': 'dex', 'ability.con': 'con',
  'ability.int': 'int', 'ability.wis': 'wis', 'ability.cha': 'cha',
  'ac': 'ac.total', 'ac.all': 'ac.total', 'ac.flat': 'ac.flatFooted',
  'init': 'initiative',
  'attack': 'atk.all', 'attack.all': 'atk.all', 'attack.melee': 'atk.melee',
  'attack.ranged': 'atk.ranged', 'attack.weapon': 'atk.weapon', 'attack.touch': 'atk.touch',
  'damage': 'dmg.all', 'damage.all': 'dmg.all', 'damage.melee': 'dmg.melee',
  'damage.ranged': 'dmg.ranged', 'damage.weapon': 'dmg.weapon', 'damage.sneakAttack': 'dmg.sneakAttack',
  'speed': 'speed.land',
  'psionic.powerPoints': 'resource.pp', 'powerpoints': 'resource.pp', 'psionic': 'resource.pp',
  'incarnum.essentia': 'resource.essentia',
  'carryingCapacity.strBonus': 'carryingCapacity',
  // Sprint B splat V3 skill abbreviations
  'skill.spt': 'skill.spot', 'skill.lsn': 'skill.listen', 'skill.hid': 'skill.hide',
  'skill.ms': 'skill.move-silently', 'skill.jmp': 'skill.jump', 'skill.swm': 'skill.swim',
  'skill.bal': 'skill.balance', 'skill.clm': 'skill.climb', 'skill.tum': 'skill.tumble',
  'skill.int': 'skill.intimidate', 'skill.dip': 'skill.diplomacy', 'skill.blf': 'skill.bluff',
  'skill.sm': 'skill.sense-motive', 'skill.src': 'skill.search', 'skill.sur': 'skill.survival',
  'skill.con': 'skill.concentration', 'skill.spl': 'skill.spellcraft', 'skill.umd': 'skill.use-magic-device',
  'skill.upd': 'skill.use-psionic-device', 'skill.psi': 'skill.psicraft', 'skill.tru': 'skill.truespeak',
  'skill.lis': 'skill.listen', 'skill.han': 'skill.handle-animal', 'skill.soh': 'skill.sleight-of-hand',
  'skill.wilderness_lore': 'skill.survival',
  'will': 'save.will', 'fort': 'save.fort', 'ref': 'save.ref',
  'cmb': 'grapple', 'turnUndead': 'turnLevel',
  'check.str': 'ability.str.check', 'skill.strength': 'ability.str.check'
};

const EXTRA_CANONICAL_TARGETS = new Set([
  'ability.str.check', 'ability.dex.check', 'ability.con.check',
  'ability.int.check', 'ability.wis.check', 'ability.cha.check',
  'bab',
  'atk.melee.abilityMod', 'atk.ranged.abilityMod', 'atk.thrown.abilityMod', 'atk.touch.abilityMod', 'grapple.abilityMod',
  'dmg.melee.abilityMod', 'dmg.ranged.abilityMod',
  'save.fort.abilityMod', 'save.ref.abilityMod', 'save.will.abilityMod',
  'ac.abilityMod', 'initiative.abilityMod', 'hp.abilityMod', 'concentration.abilityMod',
  'choice.skill.1.abilityMod', 'spell.dc.abilityMod', 'spell.bonusSlots.abilityMod'
]);
EXTRA_CANONICAL_TARGETS.forEach((t) => CANONICAL_V3_TARGETS.add(t));
CANONICAL_SKILLS.forEach((s) => CANONICAL_V3_TARGETS.add('skill.' + s + '.abilityMod'));

function canonicalizeTarget(rawTarget) {
  if (!rawTarget || typeof rawTarget !== 'string') return { ok: false, canonical: null, raw: rawTarget };
  const trimmed = rawTarget.trim();
  if (CANONICAL_V3_TARGETS.has(trimmed)) return { ok: true, canonical: trimmed, aliased: false };
  if (TARGET_ALIAS_MAP[trimmed]) return { ok: true, canonical: TARGET_ALIAS_MAP[trimmed], aliased: true };
  if (trimmed.startsWith('skill.')) {
    const sub = trimmed.slice(6).toLowerCase().replace(/_/g, '-');
    if (CANONICAL_V3_TARGETS.has('skill.' + sub)) {
      return { ok: true, canonical: 'skill.' + sub, aliased: true };
    }
    if (/^(craft|perform|profession|knowledge)-/.test(sub)) {
      return { ok: true, canonical: 'skill.' + sub, aliased: trimmed !== ('skill.' + sub), parameterizedSkill: true };
    }
  }
  if (/^spellSlot\.level\d+$/.test(trimmed)) {
    return { ok: true, canonical: trimmed, aliased: true, toEffectSlotBlock: true };
  }
  if (/^casterLevel\./.test(trimmed)) {
    return { ok: true, canonical: 'casterLevel', aliased: true, conditionFromSubkey: trimmed.split('.')[1] };
  }
  if (/^ability\.[a-z]{3}_check$/.test(trimmed)) {
    return { ok: true, canonical: trimmed.replace('_', '.'), aliased: true };
  }
  return { ok: false, canonical: null, raw: trimmed };
}

function runCorpusAudit() {
  const startMs = Date.now();
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  const reSrc = fs.readFileSync(path.join(ROOT, 'rule_engine.js'), 'utf8');

  // Weapon ids a `proficiency` / `familiarity` effect block may reference (immutable `wpn-*` ids from the equipment chunk)
  const WEAPON_IDS = new Set();
  try {
    const eqRaw = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_equipment.json'), 'utf8'));
    (Array.isArray(eqRaw) ? eqRaw : (eqRaw.entries || [])).forEach((x) => { if (x && /^wpn-/.test(x.id || '')) WEAPON_IDS.add(x.id); });
  } catch (_) { /* equipment chunk missing: weapon-id check is skipped */ }

  // Feat ids a `feat` effect block (specific bonus feat) may reference (immutable `feat-*` ids from every feat chunk)
  const FEAT_IDS = new Set();
  ['srd_feats.json', 'srd_feats_splat.json', 'srd_feats_epic.json', 'srd_feats_legacy.json'].forEach((fn) => {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DB_DIR, fn), 'utf8'));
      (Array.isArray(raw) ? raw : (raw.entries || [])).forEach((x) => { if (x && /^feat-/.test(x.id || '')) FEAT_IDS.add(x.id); });
    } catch (_) { /* chunk missing: feat-id check is skipped */ }
  });

  const report = {
    totalEntries: 0,
    v2Entries: 0,
    v3Entries: 0,
    monsterEntries: 0,
    validMonsterChassis: 0,
    diskTopLevelModifiersCount: 0,
    diskDamagePartsCount: 0,
    nonItemSlotNoneCount: 0,
    foundryGarbageFormulasCount: 0,
    autoCompatibleEntries: 0,
    aliasedModifiersResolved: 0,
    dynamicFormulasBridged: 0,
    splatV3DialectFixesNeeded: 0,
    splatV3PerVarCount: 0,
    unmappedTargets: {},
    unmappedV3BlockTypes: {},
    badProficiencyGrants: [],
    badSizeScopes: [],
    badModes: [],
    structuredSubsystems: {
      v2ModesEntries: 0,
      xphAugmentPowers: 0,
      soulmeldChakraBinds: 0
    },
    ruleFlagsSummary: {
      totalEntriesWithFlags: 0,
      distinctKeys: 0,
      engineSupportedKeys: [],
      engineIgnoredKeys: []
    }
  };

  const ruleFlagCounts = {};
  const ITEM_BLUEPRINTS = new Set(['item', 'weapon', 'armor', 'itemMod']);

  for (const chunkName of Object.keys(idx.chunks || {})) {
    const fp = path.join(DB_DIR, chunkName);
    if (!fs.existsSync(fp)) continue;
    const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const entries = Array.isArray(raw) ? raw : (raw.entries || []);

    for (const e of entries) {
      report.totalEntries++;
      let hasUnmapped = false;

      if (Object.prototype.hasOwnProperty.call(e, 'modifiers')) {
        report.diskTopLevelModifiersCount++;
      }
      if (Object.prototype.hasOwnProperty.call(e, 'damageParts') || JSON.stringify(e).includes('"damageParts"')) {
        report.diskDamagePartsCount++;
      }
      if (e.slot === 'None' && !ITEM_BLUEPRINTS.has(e.blueprint) && !['Item', 'Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion', 'Scroll', 'Weapon', 'Armor', 'Shield', 'Consumable'].includes(e.type)) {
        report.nonItemSlotNoneCount++;
      }
      if (e.blueprint === 'monster' || e.type === 'Monster') {
        report.monsterEntries++;
        if (e.monster && e.monster.hitDice && e.monster.ac && e.monster.speeds && e.monster.abilities && Array.isArray(e.effects)) {
          report.validMonsterChassis++;
        }
      }

      if (e.schemaVersion === 3) {
        report.v3Entries++;
        let needsDialectFix = false;
        const walk = (list) => {
          for (const ef of (list || [])) {
            if (!ef || typeof ef !== 'object') continue;
            if (!CANONICAL_V3_BLOCK_TYPES.has(ef.type)) {
              report.unmappedV3BlockTypes[ef.type || 'MISSING'] = (report.unmappedV3BlockTypes[ef.type || 'MISSING'] || 0) + 1;
              hasUnmapped = true;
            }
            if (ef.formula && /\$\{this\.|@attributes\./.test(String(ef.formula))) {
              report.foundryGarbageFormulasCount++;
            }
            if (ef.type === 'stat' && Array.isArray(ef.targets) && ef.targets.includes('size.effective')) {
              // Scoped size shift (Powerful Build): appliesTo must name known scopes (rule_engine.js evaluateLegoCharacter consumers)
              const scopes = Array.isArray(ef.appliesTo) ? ef.appliesTo : [];
              if (ef.targets.length !== 1 || !(Number(ef.value) > 0) || scopes.some((sc) => !SIZE_SCOPES.has(sc))) {
                report.badSizeScopes.push((e.id || '?') + ' -> ' + JSON.stringify(ef.appliesTo));
              }
            }
            if (ef.type === 'effect' && (ef.effectKind === 'proficiency' || ef.effectKind === 'familiarity')) {
              const tok = String(ef.targetId || '');
              let ok;
              if (ef.effectKind === 'familiarity') {
                ok = (WEAPON_IDS.size === 0 || WEAPON_IDS.has(tok)) && ef.treatAs === 'martial';
              } else {
                const m = /^(weapon|armor|shield):(.+)$/.exec(tok);
                ok = !!m && (m[1] === 'weapon' ? (['simple', 'martial', 'exotic'].includes(m[2]) || WEAPON_IDS.size === 0 || WEAPON_IDS.has(m[2]))
                  : m[1] === 'armor' ? ['light', 'medium', 'heavy'].includes(m[2]) : ['shield', 'tower'].includes(m[2]));
              }
              if (!ok) report.badProficiencyGrants.push((e.id || '?') + ' -> ' + ef.effectKind + ' ' + tok);
            }
            if (ef.type === 'attack' && ef.attackMode === 'natural') {
              const okNat = typeof ef.weaponName === 'string' && ef.weaponName.trim() && /^\d+d\d+$/.test(String(ef.dice || '').trim())
                && (ef.count === undefined || (Number.isInteger(ef.count) && ef.count >= 1)) && (ef.natKind === undefined || ['primary', 'secondary', 'primary2h'].includes(ef.natKind))
                && (ef.usesHands === undefined || typeof ef.usesHands === 'boolean');
              if (!okNat) report.badProficiencyGrants.push((e.id || '?') + ' -> natural attack ' + JSON.stringify(ef.weaponName));
            }
            if (ef.type === 'effect' && ef.effectKind === 'feat') {
              const fid = String(ef.targetId || '');
              if (!/^feat-/.test(fid) || (FEAT_IDS.size > 0 && !FEAT_IDS.has(fid))) report.badProficiencyGrants.push((e.id || '?') + ' -> feat ' + fid);
            }
            if (ef.type === 'effect' && ef.effectKind === 'entity') {
              const okEnt = ['animal_companion', 'familiar', 'special_mount', 'fiendish_servant'].includes(ef.entityKind)
                && typeof ef.levelFormula === 'string' && ef.levelFormula.trim().length > 0
                && ['druidProgression', 'familiarProgression', 'paladinMountProgression', 'fiendishServantProgression'].includes(ef.progressionKey);
              if (!okEnt) report.badProficiencyGrants.push((e.id || '?') + ' -> entity ' + JSON.stringify({ entityKind: ef.entityKind, levelFormula: ef.levelFormula, progressionKey: ef.progressionKey }));
            }
            if (ef.type === 'stat') {
              if (ef.mode === 'perVar') {
                report.splatV3PerVarCount++;
                needsDialectFix = true;
              }
              const tgts = ef.targets || (ef.target ? [ef.target] : []);
              for (const t of tgts) {
                const res = canonicalizeTarget(t);
                if (!res.ok) {
                  report.unmappedTargets[t] = (report.unmappedTargets[t] || 0) + 1;
                  hasUnmapped = true;
                } else if (res.aliased) {
                  needsDialectFix = true;
                }
              }
            }
            if (Array.isArray(ef.branches)) ef.branches.forEach((b) => walk(b.effects || b.kids || b.then || b.children || b.blocks));
            if (Array.isArray(ef.effects)) walk(ef.effects);
            if (Array.isArray(ef.then)) walk(ef.then);
            if (Array.isArray(ef.else)) walk(ef.else);
            if (Array.isArray(ef.blocks)) walk(ef.blocks);
            if (Array.isArray(ef.children)) walk(ef.children);
            if (Array.isArray(ef.rows)) ef.rows.forEach((r) => walk(r.effects || r.kids || r.then || r.blocks));
          }
        };
        walk(e.effects);
        if (e.modes !== undefined) {
          // modes[] contract (ADR-056, schema ModeV3): array of { id, label, effects[] }, unique ids, blocks only in effects[]
          if (!Array.isArray(e.modes)) report.badModes.push(`${e.id}: modes is not an array`);
          else {
            const modeIds = new Set();
            e.modes.forEach((m, mi) => {
              if (!m || typeof m !== 'object' || Array.isArray(m)) { report.badModes.push(`${e.id} modes[${mi}]: not an object`); return; }
              if (typeof m.id !== 'string' || !m.id) report.badModes.push(`${e.id} modes[${mi}]: missing id`);
              else if (modeIds.has(m.id)) report.badModes.push(`${e.id} modes[${mi}]: duplicate id "${m.id}"`);
              else modeIds.add(m.id);
              if (typeof m.label !== 'string' || !m.label) report.badModes.push(`${e.id} modes[${mi}]: missing label`);
              if (m.blocks !== undefined || m.modifiers !== undefined) report.badModes.push(`${e.id} modes[${mi}]: blocks must live in effects[]`);
              if (m.effects !== undefined && !Array.isArray(m.effects)) report.badModes.push(`${e.id} modes[${mi}]: effects is not an array`);
              if (m.combatScope !== undefined && !['melee', 'ranged', 'both'].includes(m.combatScope)) report.badModes.push(`${e.id} modes[${mi}]: combatScope "${m.combatScope}"`);
              if (Array.isArray(m.effects)) walk(m.effects);
            });
          }
        }
        if (e.chakraBinds && typeof e.chakraBinds === 'object') {
          Object.values(e.chakraBinds).forEach((cb) => {
            if (Array.isArray(cb)) walk(cb);
            else if (cb && Array.isArray(cb.effects)) walk(cb.effects);
            else if (cb && Array.isArray(cb.blocks)) walk(cb.blocks);
          });
        }
        if (needsDialectFix) report.splatV3DialectFixesNeeded++;
      } else {
        report.v2Entries++;
      }

      if (Array.isArray(e.modifiers)) {
        for (const m of e.modifiers) {
          if (!m) continue;
          const res = canonicalizeTarget(m.target);
          if (!res.ok) {
            report.unmappedTargets[m.target || 'MISSING'] = (report.unmappedTargets[m.target || 'MISSING'] || 0) + 1;
            hasUnmapped = true;
          } else if (res.aliased) {
            report.aliasedModifiersResolved++;
          }
          if (m.formula !== undefined && m.formula !== null && String(m.formula).trim() !== '' && String(m.formula).trim() !== String(m.value)) {
            report.dynamicFormulasBridged++;
          }
        }
      }

      if (Array.isArray(e.modes) && e.modes.length > 0) report.structuredSubsystems.v2ModesEntries++;
      if (e.augment) report.structuredSubsystems.xphAugmentPowers++;
      if (e.chakraBinds) report.structuredSubsystems.soulmeldChakraBinds++;

      if (e.ruleFlags && typeof e.ruleFlags === 'object' && Object.keys(e.ruleFlags).length > 0) {
        report.ruleFlagsSummary.totalEntriesWithFlags++;
        for (const k of Object.keys(e.ruleFlags)) {
          ruleFlagCounts[k] = (ruleFlagCounts[k] || 0) + 1;
        }
      }

      if (!hasUnmapped) report.autoCompatibleEntries++;
    }
  }

  const allFlagKeys = Object.keys(ruleFlagCounts);
  report.ruleFlagsSummary.distinctKeys = allFlagKeys.length;
  for (const [k, cnt] of Object.entries(ruleFlagCounts).sort((a, b) => b[1] - a[1])) {
    if (reSrc.includes(k)) report.ruleFlagsSummary.engineSupportedKeys.push({ key: k, count: cnt });
    else report.ruleFlagsSummary.engineIgnoredKeys.push({ key: k, count: cnt });
  }

  report.elapsedMs = Date.now() - startMs;
  return report;
}

if (require.main === module) {
  const rep = runCorpusAudit();
  const unmappedTargetList = Object.entries(rep.unmappedTargets).sort((a, b) => b[1] - a[1]);
  const unmappedBlockList = Object.entries(rep.unmappedV3BlockTypes).sort((a, b) => b[1] - a[1]);
  console.log(`✅ Pure V3 Corpus & Bestiary Gate completed in ${rep.elapsedMs}ms (${rep.totalEntries} entries, 0 LLM tokens):`);
  console.log(`   • Schema split           : ${rep.v3Entries}/${rep.totalEntries} V3 (${((rep.v3Entries / rep.totalEntries) * 100).toFixed(2)}%), ${rep.v2Entries} V2`);
  console.log(`   • Bestiary V3 monsters   : ${rep.validMonsterChassis}/${rep.monsterEntries} valid V3 monster chassis`);
  console.log(`   • Disk modifiers[] arrays: ${rep.diskTopLevelModifiersCount}`);
  console.log(`   • Disk damageParts[] keys: ${rep.diskDamagePartsCount}`);
  console.log(`   • Non-item slot="None"   : ${rep.nonItemSlotNoneCount}`);
  console.log(`   • Foundry leftover exprs : ${rep.foundryGarbageFormulasCount}`);
  console.log(`   • Splat dialect drift    : ${rep.splatV3DialectFixesNeeded} (${rep.splatV3PerVarCount} perVar)`);
  console.log(`   • Unmapped targets/blocks: ${unmappedTargetList.length} targets, ${unmappedBlockList.length} block types`);
  if (unmappedTargetList.length > 0) console.error('   ❌ Unmapped targets:', unmappedTargetList.slice(0, 20));
  if (unmappedBlockList.length > 0) console.error('   ❌ Unmapped block types:', unmappedBlockList);
  if (rep.badSizeScopes.length > 0) console.error('   ❌ Invalid size.effective blocks:', rep.badSizeScopes.slice(0, 20));
  if (rep.badProficiencyGrants.length > 0) console.error('   ❌ Invalid proficiency/familiarity grants:', rep.badProficiencyGrants.slice(0, 20));
  if (rep.badModes.length > 0) console.error('   ❌ Invalid modes[] (ModeV3 contract):', rep.badModes.slice(0, 20));

  const failed =
    rep.v2Entries > 0 ||
    rep.v3Entries !== rep.totalEntries ||
    rep.validMonsterChassis !== rep.monsterEntries ||
    rep.monsterEntries < 649 ||
    rep.diskTopLevelModifiersCount > 0 ||
    rep.diskDamagePartsCount > 0 ||
    rep.nonItemSlotNoneCount > 0 ||
    rep.foundryGarbageFormulasCount > 0 ||
    unmappedTargetList.length > 0 ||
    unmappedBlockList.length > 0 ||
    rep.badProficiencyGrants.length > 0 ||
    rep.badModes.length > 0 ||
    rep.badSizeScopes.length > 0;
  if (failed) {
    console.error('❌ FAIL: Pure V3 Corpus Gate failed.');
    process.exit(1);
  }
}

module.exports = { runCorpusAudit, canonicalizeTarget, TARGET_ALIAS_MAP, CANONICAL_V3_TARGETS };
