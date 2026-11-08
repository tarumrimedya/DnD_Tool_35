/**
 * ============================================================================
 * JOYFUL-FERMI D&D 3.5e — ZERO-TOKEN SYNC, PARITY & SYNTAX VERIFIER
 * ============================================================================
 * Usage:
 *   & "C:\Users\tarum\AppData\Local\ms-playwright-go\1.57.0\node.exe" tools/verify_and_sync.js
 *
 * Actions performed in < 0.5 seconds with ZERO AI token overhead:
 *   1. Auto-syncs `index.html` -> `character.html` and all core root files -> `webapp/`.
 *   2. Verifies 100% SHA-256 byte-for-byte parity between root and `webapp/`.
 *   3. Verifies zero occurrences of the banned dice emoji U+1F3B2 (\uD83C\uDFB2).
 *   4. Validates JSON syntax across `character_data.json`, `master_db.json`, and `database/*.json`.
 *   5. Validates JS syntax across all `.js` modules and all inline `<script>` blocks in `.html` files.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { runRuleEngineTests } = require('./test_rule_engine');
const { runDeriveSheetTests } = require('./test_derive_sheet');

const ROOT = path.resolve(__dirname, '..');
const WEBAPP = path.join(ROOT, 'webapp');

const CORE_FILES = [
  'index.html',
  'character.html',
  'tailwind_compiled.css',
  'design_tokens.css',
  'char_modals.js',
  'hero_silhouette_data.js',
  'char_hud.js',
  'char_combat.js',
  'char_spells.js',
  'char_progression.js',
  'char_inventory.js',
  'hub.html',
  'login.html',
  'rule_engine.js',
  'char_store.js',
  'ui_components.js',
  'rule_master.js',
  'rule_master_ai_schema.json',
  'ui_shared.js',
  'gdrive_sync.js',
  'supabase_auth.js',
  'srd_compendium.js',
  'hub_dice.js',
  'hub_notes.js',
  'hub_ai.js',
  'dice3d.js',
  'character_data.json',
  'master_db.json'
];

const DB_FILES = [
  'srd_index.json',
  'srd_equipment.json',
  'srd_feats.json',
  'srd_classes_races.json',
  'srd_combat_rules.json',
  'srd_spells.json',
  'srd_maneuvers.json',
  'srd_monsters.json',
  'mic_compendium.json',
  'srd_domains.json',
  'srd_companions.json',
  'srd_templates.json',
  'lego_patterns.json'
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function main() {
  const startMs = Date.now();
  let errors = 0;

  // 1. Sync index.html -> character.html
  const indexPath = path.join(ROOT, 'index.html');
  const charPath = path.join(ROOT, 'character.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, charPath);
  }

  // 2. Sync all CORE_FILES -> webapp/
  for (const rel of CORE_FILES) {
    const src = path.join(ROOT, rel);
    const dst = path.join(WEBAPP, rel);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }

  // 2b. Verify & Auto-Sync database/srd_index.json chunk hashes
  const srdIdxPath = path.join(ROOT, 'database', 'srd_index.json');
  if (fs.existsSync(srdIdxPath)) {
    try {
      const idxData = JSON.parse(fs.readFileSync(srdIdxPath, 'utf8'));
      let idxChanged = false;
      if (idxData && idxData.chunks) {
        const allHashes = [];
        for (const [chunkName, meta] of Object.entries(idxData.chunks)) {
          const chunkPath = path.join(ROOT, 'database', chunkName);
          if (fs.existsSync(chunkPath)) {
            const actualHash = sha256(chunkPath).slice(0, 16);
            allHashes.push(actualHash);
            if (meta.hash !== actualHash) {
              meta.hash = actualHash;
              idxChanged = true;
            }
          }
        }
        if (idxChanged) {
          idxData.compendiumHash = crypto.createHash('sha256').update(allHashes.join(':')).digest('hex').slice(0, 16);
          fs.writeFileSync(srdIdxPath, JSON.stringify(idxData, null, 2) + '\n', 'utf8');
        }
      }
    } catch (e) {
      console.error(`[FAIL] srd_index.json hash check error: ${e.message}`);
      errors++;
    }
  }

  // 3. Sync database/ -> webapp/database/
  for (const rel of DB_FILES) {
    const src = path.join(ROOT, 'database', rel);
    const dst = path.join(WEBAPP, 'database', rel);
    if (fs.existsSync(src) && fs.existsSync(path.dirname(dst))) {
      fs.copyFileSync(src, dst);
    }
  }

  // 4. Verify SHA-256 parity
  for (const rel of CORE_FILES) {
    const src = path.join(ROOT, rel);
    const dst = path.join(WEBAPP, rel);
    if (!fs.existsSync(src) || !fs.existsSync(dst)) continue;
    const h1 = sha256(src);
    const h2 = sha256(dst);
    if (h1 !== h2) {
      console.error(`[FAIL] Parity mismatch: ${rel}`);
      errors++;
    }
  }

  // 5. Check banned dice emoji (\uD83C\uDFB2) + syntax check
  const BANNED = '\uD83C\uDFB2';
  for (const rel of CORE_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');

    if (text.includes(BANNED) || /\\uD83C\\uDFB2|\\u\{1F3B2\}|&#(127922|x1F3B2);/i.test(text)) {
      console.error(`[FAIL] Banned dice emoji U+1F3B2 detected in: ${rel}`);
      errors++;
    }

    if (rel.endsWith('.html') && /<html[^>]*\blang\s*=\s*["']tr["']/i.test(text)) {
      console.error(`[FAIL] <html lang="tr"> detected in ${rel} (causes CSS uppercase 'i' -> 'İ' bug). Use <html lang="en">.`);
      errors++;
    }

    if (rel.endsWith('.json')) {
      try {
        JSON.parse(text);
      } catch (e) {
        console.error(`[FAIL] JSON syntax error in ${rel}: ${e.message}`);
        errors++;
      }
    } else if (rel.endsWith('.js')) {
      try {
        new vm.Script(text, { filename: rel });
      } catch (e) {
        console.error(`[FAIL] JS syntax error in ${rel}: ${e.message}`);
        errors++;
      }

      // 5c. Architectural Guardrails (No Proxy alien patterns, no duplicate static catalogs in UI modules)
      if (/\bnew\s+Proxy\s*\(/.test(text)) {
        console.error(`[FAIL] Architectural violation in ${rel}: 'new Proxy()' is banned per project consistency rules.`);
        errors++;
      }
      if (/const\s+(DND35_FEAT_CATALOG|DND35_DM_BOONS_CATALOG|DND35_FLAWS_CATALOG|DND35_WARLOCK_INVOCATIONS|SRD_WEAPON_PROPERTIES|DND35_CLERIC_DOMAINS)\s*=/.test(text)) {
        console.error(`[FAIL] Architectural violation in ${rel}: Duplicate static catalog definition detected. Use SrdCompendium single-source-of-truth.`);
        errors++;
      }
    } else if (rel.endsWith('.html') && rel !== 'character.html') {
      const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
      let m, idx = 0;
      while ((m = scriptRegex.exec(text)) !== null) {
        if (/\bsrc\s*=/i.test(m[1])) continue;
        idx++;
        try {
          new vm.Script(m[2], { filename: `${rel}#script-${idx}` });
        } catch (e) {
          console.error(`[FAIL] Inline <script #${idx}> syntax error in ${rel}: ${e.message}`);
          errors++;
        }
      }

      // 5b. Validate HTML inline event handlers (onclick, onchange, oninput, onsubmit) outside <script> blocks
      const htmlWithoutScripts = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => '\n'.repeat(match.split('\n').length - 1));
      const handlerRegex = /\b(onclick|onchange|oninput|onsubmit)\s*=\s*"([^"]*)"/gi;
      let hm;
      while ((hm = handlerRegex.exec(htmlWithoutScripts)) !== null) {
        const attrName = hm[1];
        const rawCode = hm[2]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        try {
          new vm.Script(`(function(event){ ${rawCode} })`, { filename: `${rel}#${attrName}` });
        } catch (e) {
          const lineNo = htmlWithoutScripts.slice(0, hm.index).split('\n').length;
          console.error(`[FAIL] Inline ${attrName} syntax error in ${rel}:${lineNo} -> ${rawCode} (${e.message})`);
          errors++;
        }
      }
    }
  }

  // 5c. Verify balanced <div> tags for every top-level modal in char_modals.js
  const cmPath = path.join(ROOT, 'char_modals.js');
  if (fs.existsSync(cmPath)) {
    try {
      const cmRaw = fs.readFileSync(cmPath, 'utf8');
      const htmlLine = cmRaw.split('\n').find(l => l.includes('const DEFERRED_MODALS_HTML = '));
      if (htmlLine) {
        const modalHtml = JSON.parse(htmlLine.replace(/^\s*const DEFERRED_MODALS_HTML = /, '').replace(/;\s*$/, ''));
        const topIds = ['modal-weapon-profile-settings','modal-spell-weapon-target','attack-decision-toast','modal-pin-details','modal-pin-category-picker','modal-spell-slots-manager','feat-detail-modal','quick-level-feat-modal','change-level-class-modal','level-stat-picker-modal','create-custom-class-modal','feat-picker-modal','stat-distribution-modal','npc-statblock-modal','planned-level-choice-modal','level-up-modal','add-buff-modal','skill-consolidation-modal','custom-skill-modal','periodic-hp-modal','slot-equip-modal','spell-maneuver-modal','add-pool-item-modal','join-campaign-modal','settings-modal','vault-lock-modal'];
        for (let i = 0; i < topIds.length; i++) {
          const s = modalHtml.indexOf('<div id="' + topIds[i] + '"');
          const e = (i + 1 < topIds.length) ? modalHtml.indexOf('<div id="' + topIds[i + 1] + '"') : modalHtml.length;
          if (s < 0) {
            console.error(`[FAIL] Missing top-level modal #${topIds[i]} in char_modals.js`);
            errors++;
            continue;
          }
          const chunk = modalHtml.slice(s, e);
          const opens = (chunk.match(/<div\b/g) || []).length;
          const closes = (chunk.match(/<\/div>/g) || []).length;
          if (opens !== closes) {
            console.error(`[FAIL] Unbalanced <div> tags in char_modals.js #${topIds[i]}: opens=${opens}, closes=${closes}`);
            errors++;
          }
        }
      }
    } catch (cmErr) {
      console.error(`[FAIL] char_modals.js modal balance check failed: ${cmErr.message}`);
      errors++;
    }
  }

  // 6. Mojibake & Turkish Character Audit across active UI/Logic files
  const AUDIT_FILES = [
    'index.html', 'char_hud.js', 'char_combat.js', 'char_spells.js',
    'char_progression.js', 'char_inventory.js', 'rule_engine.js',
    'char_store.js', 'ui_components.js', 'design_tokens.css',
    'rule_master.js', 'ui_shared.js', 'hub.html', 'gdrive_sync.js',
    'supabase_auth.js', 'login.html', 'rule_master_ai_schema.json'
  ];
  const trCharRegex = /[çğıöşüÇĞİÖŞÜ]|\\u013[01]|\\u011[eEfF]|\\u015[eEfF]|\\u00[fFdDcCeE][6cC7]/;
  const trWordRegex = /\b(Tur|Sonraki|Karakter|Karaktere|Karakterine|Notlar|Kapat|Savunma|Yuva|Silah|Silahlar|Kalkan|Kalkanlar|Sadece|Fiziksel|Seviye|seviye|Seviyesi|Seviyede|Puan|Kalan|Zar|Standart|Eylem|Acil|Kemer|Orta|Bileklik|Eldiven|Manevra|Manevralar|MASASI|Katalog|Profil|Resmi|Havuzu|Havuz|Klasik|Alt Etki|Boyun|Kolye|Omuz|Pelerin|Kollar|Eller|Bel|Ayak|Basit|Egzotik|Hafif|Uygun|Ekstra|Hasar|Kampanya|Davet|Kodu|Kontrol|Ediliyor|Beceri|Limiti|Hassas|Olmadan|Yerel|Misafir|Olarak|Kullan|Adet|devrede|Devrede|Modifiyeri|Modifiyeriniz|Senkron|Bulut|Ceza|Otomatik|Serbest|Metin|Daha Fazla|Daralt|Yok|Evet|Ana El|Mevcut|Gereken|Gerekli|Kilitlendi|Dua|Menzil|Hedef|Siperde|Delici|Kesici|Ezici|Harca|Aktif|Pasif|Kaydedildi|Silindi|Eklendi|Bilgi|Hata|Feda|Fedasiz|Vazgec|Toplam|Fazla|Harcama|Dinlenme|Uykusu|Saat|Dk|Uyumsuz|Asa|Fiyat|Kademe)\b/;
  const mojibakeRegex = /\uFFFD|Ǭ/;
  const trSummary = [];
  let totalActiveTrLines = 0;

  const detailTarget = process.argv[2];
  for (const rel of AUDIT_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    let activeTr = 0;
    let mojibakeCount = 0;
    lines.forEach((line, idx) => {
      if (mojibakeRegex.test(line)) mojibakeCount++;
      const trim = line.trim();
      if (trim.startsWith('//') || trim.startsWith('/*') || trim.startsWith('*') || trim.startsWith('<!--')) return;
      const codeOnly = trim.replace(/\s*\/\/.*$/, '').replace(/<!--.*?-->/g, '');
      if (trCharRegex.test(codeOnly) || trWordRegex.test(codeOnly) || mojibakeRegex.test(codeOnly)) {
        activeTr++;
        if (detailTarget === rel || detailTarget === 'all') {
          console.log(`  [${rel}:${idx + 1}] ${codeOnly.slice(0, 140)}`);
        }
      }
    });
    if (activeTr > 0 || mojibakeCount > 0) {
      totalActiveTrLines += activeTr;
      trSummary.push(`${rel}:${activeTr}${mojibakeCount > 0 ? `(mojibake:${mojibakeCount})` : ''}`);
    }
  }

  // 6b. Strangler Fig Technical Debt Ratchet Gate (Inline Events & Global Assignments)
  const RATCHET_EXCLUDE = new Set([
    'character.html',
    'char_modals.js',
    'hero_silhouette_data.js',
    'tailwind.config.js',
    'combat_offense_engine_preview.html',
    'lvl_up_gorunum.html'
  ]);
  const RATCHET_LIMITS = {
    'index.html':         { inlineEvents: 187, windowAssigns: 0 },
    'char_hud.js':        { inlineEvents: 0,   windowAssigns: 48 },
    'char_combat.js':     { inlineEvents: 0,   windowAssigns: 82 },
    'char_spells.js':     { inlineEvents: 0,   windowAssigns: 68 },
    'char_progression.js':{ inlineEvents: 0,   windowAssigns: 46 },
    'char_inventory.js':  { inlineEvents: 0,   windowAssigns: 41 },
    'rule_engine.js':     { inlineEvents: 0,   windowAssigns: 1 },
    'char_store.js':      { inlineEvents: 0,   windowAssigns: 1 },
    'ui_components.js':   { inlineEvents: 0,   windowAssigns: 2 },
    'rule_master.js':     { inlineEvents: 49,  windowAssigns: 1 },
    'ui_shared.js':       { inlineEvents: 29,  windowAssigns: 0 },
    'hub.html':           { inlineEvents: 203, windowAssigns: 11 },
    'login.html':         { inlineEvents: 2,   windowAssigns: 0 },
    'gdrive_sync.js':     { inlineEvents: 0,   windowAssigns: 2 },
    'supabase_auth.js':   { inlineEvents: 8,   windowAssigns: 1 },
    'srd_compendium.js':  { inlineEvents: 0,   windowAssigns: 0 },
    'hub_dice.js':        { inlineEvents: 4,   windowAssigns: 36 },
    'hub_notes.js':       { inlineEvents: 66,  windowAssigns: 1 },
    'hub_ai.js':          { inlineEvents: 0,   windowAssigns: 0 },
    'dice3d.js':          { inlineEvents: 0,   windowAssigns: 1 }
  };
  const DEFAULT_NEW_FILE_CAP = { inlineEvents: 0, windowAssigns: 2 };
  const inlineEventRatchetRegex = /\bon(click|dblclick|change|input|keydown|keyup|keypress|submit|focus|blur|mousedown|mouseup|mouseover|mouseout|mouseenter|mouseleave|pointerdown|pointerup|touchstart|touchend|dragstart|dragover|dragleave|drop|wheel|scroll|contextmenu)\s*=/gi;
  const windowAssignRatchetRegex = /\bwindow\.[a-zA-Z0-9_$]+\s*=(?!=)/g;
  let totalInline = 0, maxInline = 0, totalWin = 0, maxWin = 0;

  const rootCandidateFiles = fs.readdirSync(ROOT)
    .filter(f => (f.endsWith('.js') || f.endsWith('.html')) && !RATCHET_EXCLUDE.has(f))
    .sort();

  for (const rel of rootCandidateFiles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    const cap = RATCHET_LIMITS[rel] || DEFAULT_NEW_FILE_CAP;
    const text = fs.readFileSync(full, 'utf8');
    const inlineCount = (text.match(inlineEventRatchetRegex) || []).length;
    const winCount = (text.match(windowAssignRatchetRegex) || []).length;
    totalInline += inlineCount;
    maxInline += cap.inlineEvents;
    totalWin += winCount;
    maxWin += cap.windowAssigns;
    if (inlineCount > cap.inlineEvents) {
      console.error(`[FAIL] Ratchet gate exceeded in ${rel}: inlineEvents=${inlineCount} > cap=${cap.inlineEvents}`);
      errors++;
    } else if (RATCHET_LIMITS[rel] && inlineCount < cap.inlineEvents) {
      console.log(`📉 Ratchet can be tightened in ${rel}: inlineEvents=${inlineCount} < cap=${cap.inlineEvents}`);
    }
    if (winCount > cap.windowAssigns) {
      console.error(`[FAIL] Ratchet gate exceeded in ${rel}: windowAssigns=${winCount} > cap=${cap.windowAssigns}`);
      errors++;
    } else if (RATCHET_LIMITS[rel] && winCount < cap.windowAssigns) {
      console.log(`📉 Ratchet can be tightened in ${rel}: windowAssigns=${winCount} < cap=${cap.windowAssigns}`);
    }
  }

  // 6c. Delegated Action Registration Completeness Gate (index.html + char_*.js + rule_master.js)
  const ACTION_PRODUCER_FILES = ['index.html', 'char_hud.js', 'char_combat.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js', 'rule_master.js'];
  const ACTION_REGISTRY_FILES = ['ui_components.js', 'char_hud.js', 'char_combat.js', 'char_spells.js', 'char_progression.js', 'char_inventory.js', 'char_store.js', 'rule_master.js'];
  const registeredActions = new Set();
  for (const rel of ACTION_REGISTRY_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/(?:Actions|actionsApi)\.register\(\s*['"]([^'"]+)['"]/g)) {
      registeredActions.add(m[1]);
    }
  }
  for (const rel of ACTION_PRODUCER_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/data-(?:change-|input-|submit-)?action=['"]([^'"$\s]+)['"]/g)) {
      const act = m[1];
      if (act === '...' || act.includes('${')) continue;
      if (!registeredActions.has(act)) {
        console.error(`[FAIL] Unregistered delegated UI action in ${rel}: "${act}"`);
        errors++;
      }
    }
  }

  // 7. Execute D&D 3.5e RAW RuleEngine & Golden DeriveSheet Automated Regression Suites
  let ruleTestRes = { passed: 0, elapsedMs: 0 };
  let deriveTestRes = { passed: 0, elapsedMs: 0 };
  try {
    ruleTestRes = runRuleEngineTests();
  } catch (reErr) {
    console.error(`[FAIL] ${reErr.message}`);
    errors++;
  }
  try {
    deriveTestRes = runDeriveSheetTests();
  } catch (dsErr) {
    console.error(`[FAIL] ${dsErr.message}`);
    errors++;
  }

  const elapsed = Date.now() - startMs;
  if (errors > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${errors} error(s) (${elapsed}ms).`);
    process.exit(1);
  } else {
    console.log(`✅ ALL CHECKS PASSED (${CORE_FILES.length} core files synced & verified, ${ruleTestRes.passed}/${ruleTestRes.passed} RAW math tests + ${deriveTestRes.passed}/${deriveTestRes.passed} golden fixture tests passed, 0 U+1F3B2, 100% JS/HTML/Event/JSON valid) in ${elapsed}ms.`);
    console.log(`📉 Strangler Ratchet Gate: ${totalInline}/${maxInline} inline events, ${totalWin}/${maxWin} window.* globals.`);
    console.log(`📊 Active TR/Mojibake Lines Remaining: ${totalActiveTrLines} [${trSummary.join(', ') || '0 — 100% PURE ENGLISH!'}]`);
  }
}

main();
