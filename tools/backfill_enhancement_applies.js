#!/usr/bin/env node
/* One-off, idempotent: normalise `appliesTo` on Armor Enhancement records to 'armor' | 'shield' | 'armor+shield'.
 * Weapon/Misc enhancements are left untouched. Original MIC wording is preserved in `appliesToText`.
 * Usage: node tools/backfill_enhancement_applies.js [--dry]
 */
const fs = require('fs');
const path = require('path');
const DRY = process.argv.includes('--dry');
const FILES = ['database/mic_compendium.json', 'database/srd_equipment.json'];
const ROOT = path.resolve(__dirname, '..');
// Text-only fallback, used when the record's own appliesTo wording is empty/ambiguous.
function classify(e) {
  const own = String(e.appliesToText != null ? e.appliesToText : e.appliesTo || '').trim();
  const ownL = own.toLowerCase();
  const text = String(e.text || e.shortDescription || '');
  const t = text.toLowerCase();
  const both = /(armor|armour) or (a )?shield|shield or (an? )?(armor|armour)|suit of armor or shield|armor and shield/;
  if (['armor', 'shield', 'armor+shield'].includes(own) && e.appliesToText == null) {
    return { v: own, why: 'already normalised' };
  }
  if (both.test(ownL)) return { v: 'armor+shield', why: 'appliesTo: "' + own + '"' };
  if (/^shield\b/.test(ownL)) return { v: 'shield', why: 'appliesTo: "' + own + '"' };
  if (/armor/.test(ownL)) return { v: 'armor', why: 'appliesTo: "' + own + '"' };
  let m = t.match(both);
  if (m) return { v: 'armor+shield', why: 'text: "' + m[0] + '"' };
  m = t.match(/(only|this|a|an|the|any)?\s*(light |heavy |tower )?shield[^.]{0,40}/);
  const mentionsShield = /\bshield/.test(t);
  const mentionsArmor = /\b(armor|armour|suit)\b/.test(t);
  if (mentionsShield && !mentionsArmor) return { v: 'shield', why: 'text mentions shield only: "' + (m ? m[0].trim() : '') + '"' };
  if (mentionsShield && mentionsArmor) return { v: 'armor', why: 'text mentions both but not "armor or shield" (ambiguous -> armor)' };
  return { v: 'armor', why: 'no shield reference' };
}
// DMG shield-only enchantments whose SRD text does not literally say "armor or shield".
const SHIELD_ONLY_IDS = new Set(['enh-bashing', 'enh-animated', 'enh-arrow-deflection', 'enh-reflecting', 'enh-arrow-catching']);
// DMG energy resistance family is "armor or shield" even where the short SRD text omits it.
const ARMOR_SHIELD_IDS = /^enh-(fire|cold|acid|electricity|sonic)-resistance/;
const rows = [];
const isArmorEnh = (e) => e.type === 'Enhancement' && e.category === 'Armor Enhancement';
const baseDecision = (e) => (SHIELD_ONLY_IDS.has(e.id) ? { v: 'shield', why: 'DMG shield-only ability (id override)' }
  : ARMOR_SHIELD_IDS.test(e.id) ? { v: 'armor+shield', why: 'DMG energy resistance: armor or shield (id override)' } : classify(e));
// Pass 1: classify every record across all files, so variants can inherit from their base ability.
const loaded = FILES.map((f) => { const fp = path.join(ROOT, f); const raw = fs.readFileSync(fp, 'utf8'); return { f, fp, raw, arr: JSON.parse(raw) }; });
const baseById = new Map();
loaded.forEach(({ arr }) => arr.forEach((e) => { if (isArmorEnh(e)) baseById.set(e.id, baseDecision(e)); }));
// MIC "[Synergy]" / Greater / Improved / Lesser variants "function as <base> armor": they inherit the base ability's applicability.
function variantBaseId(id) {
  let cur = String(id);
  for (let i = 0; i < 3; i++) {
    const next = cur.replace(/-synergy$/, '').replace(/-(greater|improved|lesser|least)$/, '');
    if (next === cur) break;
    cur = next;
    if (baseById.has(cur)) return cur;
  }
  return null;
}
for (const { f, fp, raw, arr } of loaded) {
  let changed = 0;
  for (const e of arr) {
    // Weapon special abilities: normalise to 'weapon' (descriptive MIC wording such as "Melee weapon" kept in appliesToText).
    if (e.type === 'Enhancement' && e.category === 'Weapon Enhancement') {
      if (e.appliesToText == null && e.appliesTo && String(e.appliesTo) !== 'weapon') e.appliesToText = e.appliesTo;
      if (e.appliesTo !== 'weapon') { e.appliesTo = 'weapon'; changed++; }
      if (e.itemModifier && e.itemModifier.appliesTo !== 'weapon') { e.itemModifier.appliesTo = 'weapon'; changed++; }
      continue;
    }
    if (!isArmorEnh(e)) continue;
    const baseId = variantBaseId(e.id);
    const r = baseId ? { v: baseById.get(baseId).v, why: 'variant of ' + baseId } : baseById.get(e.id);
    if (e.appliesToText == null && e.appliesTo && !['armor', 'shield', 'armor+shield'].includes(String(e.appliesTo))) e.appliesToText = e.appliesTo;
    if (e.appliesTo !== r.v) { e.appliesTo = r.v; changed++; }
    if (e.itemModifier && e.itemModifier.appliesTo !== r.v) { e.itemModifier.appliesTo = r.v; changed++; }
    if (Array.isArray(e.tags) && r.v !== 'armor' && !e.tags.includes('shield')) e.tags.push('shield');
    rows.push([f.replace('database/', '').replace('.json', ''), e.id, r.v, r.why.slice(0, 90)]);
  }
  if (!DRY && changed) fs.writeFileSync(fp, JSON.stringify(arr, null, raw.startsWith('[\n  ') ? 2 : 0) + (raw.endsWith('\n') ? '\n' : ''));
  console.log(f, 'changed fields:', changed);
}
rows.forEach((r) => console.log(r.join(' | ')));
const c = {}; rows.forEach((r) => { c[r[2]] = (c[r[2]] || 0) + 1; }); console.log(c);
