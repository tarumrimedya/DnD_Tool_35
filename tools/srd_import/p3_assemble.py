"""SRD import P3: write splatbook feats into the lazy chunks and register them in srd_index.json. Idempotent.
  srd_feats_splat.json   traits + skill tricks (P2) + 3.5 heroic feats
  srd_feats_epic.json    3.5 epic feats
  srd_feats_legacy.json  3.0 + licensed 3.5 feats; index meta optIn: true (never auto-loaded)
Usage: p3_assemble.py <database dir> <p3 out dir>
"""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
DB, P3 = sys.argv[1:3]
def load(p): return json.load(open(p, encoding='utf-8'))
def save(n, d):
    with open(os.path.join(DB, n), 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
new = {b: load(os.path.join(P3, f'p3_{b}.json')) for b in ('splat', 'epic', 'legacy')}
idx = load(os.path.join(DB, 'srd_index.json'))
others = set()
for chunk in idx['chunks']:
    if chunk in ('srd_feats_epic.json', 'srd_feats_legacy.json'): continue
    d = load(os.path.join(DB, chunk))
    for e in d if isinstance(d, list) else []:
        if isinstance(e, dict) and e.get('id') and not (chunk == 'srd_feats_splat.json' and e.get('type') == 'Feat'): others.add(e['id'])
ids = [r['id'] for b in new.values() for r in b]
assert len(ids) == len(set(ids)), 'duplicate ids among new feats'
assert not (set(ids) & others), sorted(set(ids) & others)[:10]

splat = [e for e in load(os.path.join(DB, 'srd_feats_splat.json')) if e.get('type') != 'Feat'] + new['splat']
save('srd_feats_splat.json', splat)
save('srd_feats_epic.json', new['epic'])
save('srd_feats_legacy.json', new['legacy'])
for name, opt in (('srd_feats_splat.json', False), ('srd_feats_epic.json', False), ('srd_feats_legacy.json', True)):
    meta = idx['chunks'].get(name) or {'count': 0, 'hash': ''}
    meta.update({'bytes': os.path.getsize(os.path.join(DB, name)), 'eagerLoad': False})
    if opt: meta['optIn'] = True
    idx['chunks'][name] = meta
save('srd_index.json', idx)
print({k: len(v) for k, v in new.items()}, '| srd_feats_splat.json total', len(splat))
