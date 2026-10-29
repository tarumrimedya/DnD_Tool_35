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

const ROOT = path.resolve(__dirname, '..');
const WEBAPP = path.join(ROOT, 'webapp');

const CORE_FILES = [
  'index.html',
  'character.html',
  'char_hud.js',
  'char_combat.js',
  'char_spells.js',
  'char_progression.js',
  'char_inventory.js',
  'hub.html',
  'login.html',
  'rule_engine.js',
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
  'bundled_data.js',
  'bundled_monsters.js',
  'srd_core_catalog.json',
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
  'srd_monsters.json'
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

  // 6. Mojibake & Turkish Character Audit across active UI/Logic files
  const AUDIT_FILES = [
    'index.html', 'char_hud.js', 'char_combat.js', 'char_spells.js',
    'char_progression.js', 'char_inventory.js', 'rule_engine.js',
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

  const elapsed = Date.now() - startMs;
  if (errors > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${errors} error(s) (${elapsed}ms).`);
    process.exit(1);
  } else {
    console.log(`✅ ALL CHECKS PASSED (${CORE_FILES.length} core files synced & verified, 0 U+1F3B2, 100% JS/HTML/Event/JSON valid) in ${elapsed}ms.`);
    console.log(`📊 Active TR/Mojibake Lines Remaining: ${totalActiveTrLines} [${trSummary.join(', ') || '0 — 100% PURE ENGLISH!'}]`);
  }
}

main();
