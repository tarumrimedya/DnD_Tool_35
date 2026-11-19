#!/usr/bin/env node
'use strict';

/**
 * Text-to-Block Generator CLI (0 tokens, dry-run by default).
 *
 * Scans corpus entries in database/*.json (via srd_index.json), generates Pure Canonical V3
 * blocks for uncovered `missing` claims using tools/lib/v3_block_generator.js, verifies every
 * block against the dead-block validator & silent-failure condition gate, and optionally applies
 * accepted blocks in-place.
 *
 * Usage:
 *   node tools/generate_v3_blocks.js --family save                       dry-run for `save` family
 *   node tools/generate_v3_blocks.js --family save,skill --type Feat     dry-run filtered by type
 *   node tools/generate_v3_blocks.js --id mi-cloak-of-arachnida          inspect a single record
 *   node tools/generate_v3_blocks.js --family save --apply               write accepted blocks to database/*.json
 *   node tools/generate_v3_blocks.js --family save --limit 25            cap modified records
 *   node tools/generate_v3_blocks.js --json out.json                     write full report JSON
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
const RuleEngine = require(path.join(ROOT, 'rule_engine.js'));
const gen = require(path.join(__dirname, 'lib', 'v3_block_generator.js'));

function parseArgs(argv) {
  const opts = {
    apply: false,
    families: null,
    types: null,
    id: null,
    limit: Infinity,
    jsonOut: null,
    samples: 20
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') opts.apply = true;
    else if (a === '--family' && argv[i + 1]) opts.families = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--type' && argv[i + 1]) opts.types = new Set(argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    else if (a === '--id' && argv[i + 1]) opts.id = argv[++i].trim();
    else if (a === '--limit' && argv[i + 1]) opts.limit = Math.max(1, Number(argv[++i]) || Infinity);
    else if (a === '--samples' && argv[i + 1]) opts.samples = Math.max(0, Number(argv[++i]) || 20);
    else if (a === '--json' && argv[i + 1]) opts.jsonOut = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node tools/generate_v3_blocks.js [--family save,skill] [--type Feat,MagicItem] [--id <id>] [--limit N] [--apply] [--json file]');
      console.log('Supported families:', [...gen.SUPPORTED_FAMILIES].join(', '));
      process.exit(0);
    }
  }
  return opts;
}

function main() {
  const startMs = Date.now();
  const opts = parseArgs(process.argv);
  const idx = JSON.parse(fs.readFileSync(path.join(DB_DIR, 'srd_index.json'), 'utf8'));
  const probes = gen.makeProbes();

  const summary = {
    mode: opts.apply ? 'APPLY' : 'DRY-RUN',
    families: opts.families || [...gen.SUPPORTED_FAMILIES],
    recordsScanned: 0,
    recordsWithAccepted: 0,
    blocksAccepted: 0,
    blocksRejected: 0,
    acceptedByFamily: {},
    rejectedByReason: {},
    chunksModified: [],
    results: []
  };

  for (const chunkName of Object.keys(idx.chunks || {})) {
    const fp = path.join(DB_DIR, chunkName);
    if (!fs.existsSync(fp)) continue;
    const origText = fs.readFileSync(fp, 'utf8');
    const isPretty = origText.includes('\n  ');
    const raw = JSON.parse(origText);
    const isArr = Array.isArray(raw);
    const entries = isArr ? raw : (Array.isArray(raw.entries) ? raw.entries : []);
    let chunkDirty = false;

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || !entry.id) continue;
      if (opts.id && entry.id !== opts.id) continue;
      if (opts.types && !opts.types.has(entry.type)) continue;
      if (gen.SKIP_RECORD_TYPES.has(entry.type)) continue;
      if (summary.recordsWithAccepted >= opts.limit) break;

      summary.recordsScanned++;
      const res = gen.generateBlocksForEntry(RuleEngine, entry, {
        families: opts.families,
        probes
      });

      if (res.accepted.length || (opts.id && res.rejected.length)) {
        res.chunk = chunkName;
        summary.results.push(res);
      }

      if (res.accepted.length) {
        summary.recordsWithAccepted++;
        summary.blocksAccepted += res.accepted.length;
        res.accepted.forEach((a) => {
          summary.acceptedByFamily[a.claim.family] = (summary.acceptedByFamily[a.claim.family] || 0) + 1;
        });

        if (opts.apply) {
          if (!Array.isArray(entry.effects)) entry.effects = [];
          res.accepted.forEach((a) => entry.effects.push(a.block));
          entry.schemaVersion = 3;
          chunkDirty = true;
        }
      }

      if (res.rejected.length) {
        summary.blocksRejected += res.rejected.length;
        res.rejected.forEach((r) => {
          summary.rejectedByReason[r.reason] = (summary.rejectedByReason[r.reason] || 0) + 1;
        });
      }
    }

    if (opts.apply && chunkDirty) {
      const outJson = isPretty ? (JSON.stringify(raw, null, 2) + '\n') : JSON.stringify(raw);
      fs.writeFileSync(fp, outJson, 'utf8');
      summary.chunksModified.push(chunkName);
    }
  }

  const elapsedMs = Date.now() - startMs;
  console.log(`\n=== V3 Text-to-Block Generator (${summary.mode}) — ${elapsedMs} ms ===`);
  console.log(`Families: ${summary.families.join(', ')}`);
  console.log(`Records scanned: ${summary.recordsScanned} | Records matched: ${summary.recordsWithAccepted}`);
  console.log(`Blocks accepted (gate-verified): ${summary.blocksAccepted} | Rejected: ${summary.blocksRejected}`);
  if (Object.keys(summary.acceptedByFamily).length) {
    console.log('Accepted by family:', Object.entries(summary.acceptedByFamily).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', '));
  }
  if (Object.keys(summary.rejectedByReason).length) {
    console.log('Rejected by reason:', Object.entries(summary.rejectedByReason).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}=${v}`).join(', '));
  }
  if (summary.chunksModified.length) {
    console.log('Chunks written:', summary.chunksModified.join(', '));
  }

  const sampleList = summary.results.slice(0, opts.samples);
  if (sampleList.length) {
    console.log(`\n--- Sample outputs (${sampleList.length}/${summary.results.length}) ---`);
    for (const r of sampleList) {
      console.log(`* ${r.entryId} (${r.entryType}) "${r.entryName}" [${r.chunk}]`);
      for (const a of r.accepted) {
        console.log(`    + [${a.claim.family}] "${a.claim.phrase}" -> ${JSON.stringify(a.block)}`);
      }
      if (opts.id) {
        for (const rej of r.rejected) {
          console.log(`    - [${rej.claim.family}] "${rej.claim.phrase}" REJECTED (${rej.reason})`);
        }
      }
    }
  }

  if (opts.jsonOut) {
    fs.writeFileSync(opts.jsonOut, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    console.log(`\nWrote JSON report: ${opts.jsonOut}`);
  }
}

if (require.main === module) main();
