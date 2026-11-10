"""SRD import P4: write the class chassis records into lazy chunks and register them in srd_index.json. Idempotent.
  srd_classes_splat.json   3.5 WotC base + prestige classes (chassis only, contentLevel "stub")
  srd_classes_legacy.json  3.0 + licensed classes; index meta optIn: true (only with the "3.0 & Licensed" setting)
Index rows, counts and hashes are filled by tools/verify_and_sync.js.
Usage: p4_assemble.py <database dir> <p4 out dir>
"""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
DB, P4 = sys.argv[1:3]
OWN = ('srd_classes_splat.json', 'srd_classes_legacy.json')
def load(p): return json.load(open(p, encoding='utf-8'))
def save(n, d):
    with open(os.path.join(DB, n), 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
def norm(s): return ''.join(ch for ch in (s or '').lower() if ch.isalnum())

new = {b: load(os.path.join(P4, f'p4_{b}.json')) for b in ('splat', 'legacy')}
idx = load(os.path.join(DB, 'srd_index.json'))
other_ids, other_class_names = set(), set()
for chunk in idx['chunks']:
    if chunk in OWN or not os.path.exists(os.path.join(DB, chunk)): continue
    d = load(os.path.join(DB, chunk))
    for e in d if isinstance(d, list) else []:
        if not isinstance(e, dict): continue
        if e.get('id'): other_ids.add(e['id'])
        if e.get('type') == 'Class': other_class_names.add(norm(e.get('name')))
recs = [r for b in new.values() for r in b]
ids = [r['id'] for r in recs]
assert len(ids) == len(set(ids)), 'duplicate ids among new classes'
assert not (set(ids) & other_ids), sorted(set(ids) & other_ids)[:10]
names = [norm(r['name']) for r in recs]
assert len(names) == len(set(names)), 'duplicate class names among new classes'
assert not (set(names) & other_class_names), sorted(set(names) & other_class_names)[:10]
assert all(r.get('type') == 'Class' and r.get('maxLevel') for r in recs)

for name, b, opt in (('srd_classes_splat.json', 'splat', False), ('srd_classes_legacy.json', 'legacy', True)):
    save(name, new[b])
    meta = idx['chunks'].get(name) or {'count': 0, 'hash': ''}
    meta.update({'bytes': os.path.getsize(os.path.join(DB, name)), 'eagerLoad': False})
    if opt: meta['optIn'] = True
    idx['chunks'][name] = meta
save('srd_index.json', idx)
print({k: len(v) for k, v in new.items()})
