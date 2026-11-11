/**
 * Undefined CSS class gate.
 *
 * The sheet ships a pre-compiled stylesheet, so a class name with no rule behind it silently does
 * nothing. This module lists every class used in `class="..."` attributes of the sheet files that
 * has no selector in the stylesheets and is not on the allowlist (`css_class_allowlist.json`).
 *
 * Allowlist buckets:
 *  - `hooks`: names used only as JS/DOM hooks or state markers; they are not meant to carry style.
 *  - `unresolved`: names with no rule anywhere whose intent is unclear; decide and clear them.
 *  - `pendingRebuild`: valid Tailwind utilities that were added after `tailwind_compiled.css` was
 *    last built. They start working when `tools/build_tailwind.js` is run; remove them from the
 *    list after that rebuild has been reviewed.
 */
const fs = require('fs');
const path = require('path');

const SHEET_FILES = ['index.html', 'char_hud.js', 'char_combat.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js'];
const CSS_FILES = ['tailwind_compiled.css', 'design_tokens.css'];

function readDefinedClasses(root) {
  let css = '';
  for (const rel of CSS_FILES) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) css += '\n' + fs.readFileSync(full, 'utf8');
  }
  const stylesDir = path.join(root, 'styles');
  if (fs.existsSync(stylesDir)) {
    for (const name of fs.readdirSync(stylesDir)) {
      if (name.endsWith('.css')) css += '\n' + fs.readFileSync(path.join(stylesDir, name), 'utf8');
    }
  }
  const indexPath = path.join(root, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) css += '\n' + m[1];
  }
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const defined = new Set();
  for (const m of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
    defined.add(m[1].replace(/\\(.)/g, '$1'));
  }
  return defined;
}

/** Static class tokens of one `class="..."` value; template expressions are dropped. */
function staticTokens(value) {
  let v = value.replace(/\$\{[^}]*\}/g, ' \u0000 ');
  const open = v.indexOf('${');
  if (open !== -1) v = v.slice(0, open) + ' \u0000';
  const raw = v.split(/\s+/);
  const tokens = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    if (!t || t === '\u0000') continue;
    // A token glued to a template expression (`bg-${color}-500`) is only a fragment.
    if (t.includes('\u0000')) continue;
    if (!/^[A-Za-z][A-Za-z0-9_\-:.\/\[\]%#!]*$/.test(t)) continue;
    if (/[-:]$/.test(t)) continue;
    tokens.push(t);
  }
  return tokens;
}

function findUndefinedClasses(root) {
  const defined = readDefinedClasses(root);
  const allowPath = path.join(root, 'tools', 'css_class_allowlist.json');
  const allow = fs.existsSync(allowPath) ? JSON.parse(fs.readFileSync(allowPath, 'utf8')) : {};
  const allowed = new Set([...(allow.hooks || []), ...(allow.unresolved || []), ...(allow.pendingRebuild || [])]);
  const found = new Map();
  for (const rel of SHEET_FILES) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      // In a JS template the fragments on either side of `${...}` meet the expression directly.
      const value = (m[1] !== undefined ? m[1] : m[2]).replace(/(\S)\$\{/g, '$1\u0000${').replace(/\}(\S)/g, '}\u0000$1');
      for (const t of staticTokens(value)) {
        if (defined.has(t) || allowed.has(t)) continue;
        if (!found.has(t)) found.set(t, { token: t, count: 0, first: `${rel}:${text.slice(0, m.index).split('\n').length}` });
        found.get(t).count++;
      }
    }
  }
  const stale = [...allowed].filter(t => defined.has(t));
  return { undefinedClasses: [...found.values()], staleAllowlist: stale };
}

module.exports = { findUndefinedClasses };

if (require.main === module) {
  const res = findUndefinedClasses(path.resolve(__dirname, '..'));
  for (const u of res.undefinedClasses) console.log(`${u.token}\t${u.count}\t${u.first}`);
  console.log(`undefined: ${res.undefinedClasses.length}, stale allowlist entries: ${res.staleAllowlist.length}`);
}
