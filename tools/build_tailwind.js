/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — STATIC TAILWIND CSS COMPILER
 * ============================================================================
 * Scans all .html and .js files in the project (including dynamic color
 * template patterns), runs the official Tailwind v3.4 PostCSS engine, and
 * outputs a minified `tailwind_compiled.css` synced to `webapp/`.
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILES = [
  'index.html',
  'hub.html',
  'login.html',
  'char_modals.js',
  'char_hud.js',
  'char_combat.js',
  'char_spells.js',
  'char_progression.js',
  'char_inventory.js',
  'ui_shared.js',
  'rule_engine.js',
  'rule_master.js',
  'srd_compendium.js',
  'hub_notes.js',
  'hub_dice.js',
  'hub_ai.js',
  'gdrive_sync.js',
  'supabase_auth.js',
  'dice3d.js'
];

const PALETTE_COLORS = [
  'slate', 'gray', 'zinc', 'red', 'orange', 'amber', 'yellow',
  'emerald', 'green', 'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const OPACITIES = ['', '/10', '/15', '/20', '/25', '/30', '/40', '/50', '/60', '/70', '/75', '/80', '/90', '/95'];

function extractCandidateTokens() {
  const tokens = new Set();

  // Regex matching valid Tailwind utility class tokens (including responsive/state prefixes and arbitrary values)
  const tokenRegex = /[a-zA-Z0-9_!:\-\/.\[\]%#]+/g;

  for (const rel of SOURCE_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    let content = fs.readFileSync(full, 'utf8');

    // If file contains JSON-encoded HTML strings (like char_modals.js), also unescape quotes
    if (rel === 'char_modals.js') {
      content += '\n' + content.replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }

    // Expand dynamic template literal color patterns like `bg-${color}-950/60`, `border-${theme}-500/40`, `from-${c}-600`
    const dynPattern = /([a-z\-:]+)-\$\{[^}]+\}(-[0-9]{2,3}(?:\/[0-9]{1,3})?)?/g;
    let dynMatch;
    while ((dynMatch = dynPattern.exec(content)) !== null) {
      const prefix = dynMatch[1];
      const suffix = dynMatch[2] || '';
      for (const col of PALETTE_COLORS) {
        if (suffix) {
          tokens.add(`${prefix}-${col}${suffix}`);
        } else {
          for (const sh of SHADES) {
            tokens.add(`${prefix}-${col}-${sh}`);
          }
        }
      }
    }

    const matches = content.match(tokenRegex);
    if (matches) {
      for (const m of matches) {
        if (m.length >= 2 && m.length <= 80 && !m.startsWith('//') && !m.startsWith('http')) {
          tokens.add(m);
        }
      }
    }
  }

  // Always include all custom D&D theme utilities & dynamic grid helpers
  const DND_COLORS = ['dndDark', 'dndCard', 'dndCardLight', 'dndBorder', 'dndRed', 'dndGold', 'dndSky', 'dndGreen', 'dndPurple'];
  for (const c of DND_COLORS) {
    for (const op of OPACITIES) {
      tokens.add(`bg-${c}${op}`);
      tokens.add(`text-${c}${op}`);
      tokens.add(`border-${c}${op}`);
      tokens.add(`hover:bg-${c}${op}`);
      tokens.add(`hover:text-${c}${op}`);
      tokens.add(`hover:border-${c}${op}`);
    }
  }
  for (let n = 1; n <= 12; n++) {
    tokens.add(`grid-cols-${n}`);
    tokens.add(`col-span-${n}`);
  }

  return Array.from(tokens);
}

async function buildTailwind() {
  const startMs = Date.now();
  const tokens = extractCandidateTokens();
  console.log(`[Tailwind Build] Extracted ${tokens.length} candidate tokens across ${SOURCE_FILES.length} files.`);

  const cacheCompilerPath = path.join('C:\\Users\\tarum\\.gemini\\antigravity\\brain\\791c795a-678d-4a21-af81-ed29f70a48df\\scratch', 'tailwind_cdn.js');
  let compilerCode;
  if (fs.existsSync(cacheCompilerPath)) {
    compilerCode = fs.readFileSync(cacheCompilerPath, 'utf8');
  } else {
    const res = await fetch('https://cdn.tailwindcss.com');
    compilerCode = await res.text();
  }

  let capturedStyleEl = null;
  let domReadyFn = null;

  const mockDoc = {
    documentElement: {},
    body: {},
    head: {
      append(el) {
        capturedStyleEl = el;
      },
      appendChild(el) {
        capturedStyleEl = el;
      }
    },
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        textContent: '',
        isConnected: true,
        setAttribute() {},
        getAttribute() { return null; }
      };
    },
    querySelectorAll(sel) {
      if (sel === '[class]') {
        return [{ classList: tokens }];
      }
      return [];
    },
    addEventListener(evt, cb) {
      if (evt === 'DOMContentLoaded') domReadyFn = cb;
    }
  };

  const sandbox = {
    window: null,
    self: null,
    globalThis: null,
    document: mockDoc,
    MutationObserver: class {
      constructor() {}
      observe() {}
      disconnect() {}
    },
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Symbol,
    Error,
    TypeError,
    SyntaxError,
    Math,
    Date,
    JSON,
     navigator: { userAgent: 'Mozilla/5.0' },
    location: { href: 'http://localhost/', protocol: 'http:' }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(compilerCode, sandbox);

  // Apply project's custom D&D 3.5e Tailwind config
  sandbox.tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          dndDark: '#080e1e',
          dndCard: '#0f172a',
          dndCardLight: '#1e293b',
          dndBorder: '#334155',
          dndRed: '#f43f5e',
          dndGold: '#fbbf24',
          dndSky: '#38bdf8',
          dndGreen: '#10b981',
          dndPurple: '#c084fc'
        }
      }
    }
  };

  if (domReadyFn) await domReadyFn();
  // Wait briefly for async PostCSS pipeline to resolve
  for (let i = 0; i < 40; i++) {
    if (capturedStyleEl && capturedStyleEl.textContent && capturedStyleEl.textContent.length > 1000) break;
    await new Promise(r => setTimeout(r, 50));
  }

  if (!capturedStyleEl || !capturedStyleEl.textContent) {
    throw new Error('Failed to capture compiled CSS from Tailwind engine.');
  }

  // Minify CSS comments & redundant whitespace for fast loading
  const rawCss = capturedStyleEl.textContent;
  const css = rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/\s*\{\s*/g, '{')
    .replace(/\s*\}\s*/g, '}\n')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/;\}/g, '}')
    .replace(/\.hidden\{display:none\}/g, '.hidden{display:none}\ninput.flex-1,select.flex-1,textarea.flex-1{min-width:0}')
    .trim();
  const outPath = path.join(ROOT, 'tailwind_compiled.css');
  fs.writeFileSync(outPath, css, 'utf8');
  const webappOutPath = path.join(ROOT, 'webapp', 'tailwind_compiled.css');
  if (fs.existsSync(path.dirname(webappOutPath))) {
    fs.writeFileSync(webappOutPath, css, 'utf8');
  }

  console.log(`✅ Compiled tailwind_compiled.css (${(css.length / 1024).toFixed(1)} KB) in ${Date.now() - startMs}ms.`);
}

buildTailwind().catch(err => {
  console.error(err);
  process.exit(1);
});
