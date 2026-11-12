/**
 * Unescaped HTML interpolation ratchet.
 *
 * Names, labels and descriptions come from homebrew entries, AI-parsed rules and Campaign DB packs
 * written by other people. Interpolating them into an HTML template string without escaping lets
 * that text run as markup. This gate counts such interpolations per file and fails when a file
 * goes above its recorded cap (`unescaped_interp_caps.json`), so the debt can only shrink.
 *
 * What is counted: interpolations that read a text-like property as a value (`${a.name}`,
 * `${a.name || '-'}`) and sit on, or right next to, a line containing an HTML tag. Wrapping the value in
 * `UI.escapeHtml(...)` / `UI.escapeAttr(...)` (or any call) removes it from the count, as does
 * rendering through the auto-escaping `UI.html` tagged template with a local variable.
 *
 * This is a debt counter based on a line heuristic, not a proof of safety.
 */
const fs = require('fs');
const path = require('path');

const FILES = ['char_hud.js', 'char_combat.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js', 'rule_master.js', 'ui_shared.js', 'hub_notes.js'];
const TEXT_PROPS = 'name|displayName|label|title|subtitle|desc|description|note|notes|className|source|summary|benefit|effect|text'
  + '|category|school|prereq|tooltip|info|reason|range|duration|durationText|targetWeapon';
// Any brace-free interpolation that reads a text-like property as a value (`${a.name}`,
// `${a.name || '-'}`, `${ok ? a.label : b.label}`), unless the expression already goes through an
// escaping/encoding call. A property that is only compared, called or dereferenced further
// (`a.name === 'x'`, `a.name.length`) is not a value read.
const INTERP_ANY = /\$\{([^{}`]*)\}/g;
const VALUE_READ = new RegExp('\\??\\.(?:' + TEXT_PROPS + ')\\b(?!\\s*(?:===|!==|==|!=|\\(|\\.|\\[))');
const ALREADY_SAFE = /esc\w*\s*\(|safe\w*\s*\(|encodeURI\w*\s*\(|JSON\.stringify\s*\(|parseInt\s*\(|parseFloat\s*\(|Number\s*\(/i;
const TAG = /<\/?[A-Za-z][^>]*>?|<\/[A-Za-z]/;

function countFile(text) {
  const lines = text.split('\n');
  const hits = [];
  const nearTag = (i) => {
    if (TAG.test(lines[i])) return true;
    for (let j = i - 1; j >= 0 && j >= i - 3; j--) { if (lines[j].trim()) return TAG.test(lines[j]); }
    return false;
  };
  const nextTag = (i) => {
    for (let j = i + 1; j < lines.length && j <= i + 3; j++) { if (lines[j].trim()) return TAG.test(lines[j]); }
    return false;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf('${') === -1) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    const found = [];
    for (const m of line.matchAll(INTERP_ANY)) {
      const expr = m[1];
      if (!VALUE_READ.test(expr) || ALREADY_SAFE.test(expr)) continue;
      found.push(m[0]);
    }
    if (!found.length) continue;
    if (!(nearTag(i) || nextTag(i))) continue;
    for (const expr of found) hits.push({ line: i + 1, expr });
  }
  return hits;
}

function scan(root) {
  const capsPath = path.join(root, 'tools', 'unescaped_interp_caps.json');
  const caps = fs.existsSync(capsPath) ? JSON.parse(fs.readFileSync(capsPath, 'utf8')) : {};
  const results = [];
  for (const rel of FILES) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const hits = countFile(fs.readFileSync(full, 'utf8'));
    results.push({ file: rel, count: hits.length, cap: caps[rel], hits });
  }
  return results;
}

module.exports = { scan, countFile };

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const only = process.argv[2];
  for (const r of scan(root)) {
    console.log(`${r.file}\t${r.count}\tcap=${r.cap === undefined ? '-' : r.cap}`);
    if (only && r.file === only) for (const h of r.hits) console.log(`  ${r.file}:${h.line}  ${h.expr}`);
  }
}
