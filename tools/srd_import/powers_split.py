"""Move the psionic powers (type "Power") out of the eager srd_spells.json into the lazy srd_powers.json. Idempotent.
Powers load on demand (Spotlight / fetchEntry, or the character's own srd-snapshots), so a non-psionic character
never downloads them. Index rows are re-pointed at the new chunk; tools/verify_and_sync.js refreshes counts and hashes.
Usage: powers_split.py <database dir>
"""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
DB = sys.argv[1]
SPELLS, POWERS = 'srd_spells.json', 'srd_powers.json'
def load(n): return json.load(open(os.path.join(DB, n), encoding='utf-8'))
def save(n, d):
    p = os.path.join(DB, n)
    # keep the file's own trailing-newline convention (srd_spells.json has none) so the diff shows only moved records
    nl = '\n' if not os.path.exists(p) or open(p, encoding='utf-8', newline='').read().endswith('\n') else ''
    with open(p, 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(d, indent=2, ensure_ascii=False) + nl)

spells = load(SPELLS)
powers = load(POWERS) if os.path.exists(os.path.join(DB, POWERS)) else []
moved = [e for e in spells if isinstance(e, dict) and e.get('type') == 'Power']
keep = [e for e in spells if not (isinstance(e, dict) and e.get('type') == 'Power')]
have = {p['id'] for p in powers}
powers += [p for p in moved if p['id'] not in have]
ids = [p['id'] for p in powers]
assert len(ids) == len(set(ids)), 'duplicate power ids'
assert all(p.get('type') == 'Power' for p in powers)
if moved: save(SPELLS, keep)
save(POWERS, powers)

idx = load('srd_index.json')
pid = set(ids)
repointed = 0
for row in idx['index']:
    if row.get('id') in pid and row.get('f') != POWERS:
        row['f'] = POWERS; repointed += 1
meta = idx['chunks'].get(POWERS) or {'count': 0, 'hash': ''}
meta.update({'count': len(powers), 'bytes': os.path.getsize(os.path.join(DB, POWERS)), 'eagerLoad': False})
idx['chunks'][POWERS] = meta
idx['chunks'][SPELLS]['count'] = len(keep)
idx['chunks'][SPELLS]['bytes'] = os.path.getsize(os.path.join(DB, SPELLS))
save('srd_index.json', idx)
print({'moved': len(moved), 'powers': len(powers), 'spells left': len(keep), 'index rows re-pointed': repointed})
