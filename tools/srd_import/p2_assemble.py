"""Write P2 records into database/: two new lazy chunks + Weak Will (eager feats) + Boulder Roll (maneuvers). Idempotent."""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
DB, GEAR, OPTS = sys.argv[1:4]
def load(n): return json.load(open(os.path.join(DB, n), encoding='utf-8'))
def save(n, d):
    with open(os.path.join(DB, n), 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
gear = json.load(open(GEAR, encoding='utf-8'))
opts = json.load(open(OPTS, encoding='utf-8'))

# all existing ids across every chunk: new ids must not collide
idx = load('srd_index.json')
existing = set()
for chunk in idx['chunks']:
    if chunk in ('srd_equipment_splat.json', 'srd_feats_splat.json'): continue
    d = load(chunk)
    for e in (d if isinstance(d, list) else []):
        if isinstance(e, dict) and e.get('id'): existing.add(e['id'])
new_ids = [r['id'] for r in gear + opts['splat']]
assert len(new_ids) == len(set(new_ids)), 'duplicate ids in new chunks'
assert not (set(new_ids) & existing), set(new_ids) & existing

save('srd_equipment_splat.json', gear)
save('srd_feats_splat.json', opts['splat'])

feats = load('srd_feats.json')
if not any(e.get('id') == 'flaw-weak-will' for e in feats):
    i = max(k for k, e in enumerate(feats) if e.get('type') == 'Flaw')  # keep the UA flaws together
    feats.insert(i + 1, opts['weakWill']); save('srd_feats.json', feats)

mans = load('srd_maneuvers.json')
if not any(e.get('id') == 'tob-maneuver-boulder-roll' for e in mans):
    ben = ('Boost an overrun attempt: +4 on the Strength check to overrun; if the check fails, the target cannot knock you prone '
           '(you stop in the last legal space you occupied). Neither the movement nor the overrun attempts provoke attacks of opportunity.')
    rec = {'id': 'tob-maneuver-boulder-roll', 'schemaVersion': 2, 'name': 'Boulder Roll', 'type': 'Maneuver', 'subType': 'Boost',
           'category': 'Stone Dragon', 'discipline': 'Stone Dragon', 'school': 'Stone Dragon', 'level': 4, 'slot': 'None',
           'action': 'Full-round', 'prereq': 'None', 'range': 'Personal', 'target': 'You', 'duration': 'Instantaneous', 'save': 'None',
           'source': 'ToB p.81', 'description': ben, 'shortDescription': ben, 'benefit': ben, 'desc': ben,
           'tags': ['maneuver', 'boost', 'stone-dragon'],
           'modifiers': [{'target': 'ability.str_check', 'value': 4, 'formula': '4', 'type': 'Untyped', 'condition': 'Overrun attempts'}],
           'damageParts': [], 'modes': [], 'ruleFlags': {'noAooOnOverrun': True, 'cannotBeTrippedOnFailedOverrun': True},
           'tacticalBadges': ['+4 Overrun', 'No AoO'], 'contentLevel': 'summary', 'verification': 'verified',
           'provenance': {'origin': 'rulebook', 'book': 'Tome of Battle', 'page': 81}}
    i = max(k for k, e in enumerate(mans) if e.get('discipline') == 'Stone Dragon')
    mans.insert(i + 1, rec); save('srd_maneuvers.json', mans)

# register the lazy chunks; tools/verify_and_sync.js fills index rows, counts and hashes
for name in ('srd_equipment_splat.json', 'srd_feats_splat.json'):
    meta = idx['chunks'].get(name) or {}
    meta.update({'count': meta.get('count', 0), 'bytes': os.path.getsize(os.path.join(DB, name)), 'hash': meta.get('hash', ''), 'eagerLoad': False})
    idx['chunks'][name] = meta
save('srd_index.json', idx)
print('gear', len(gear), '| traits+tricks', len(opts['splat']), '| feats', len(load('srd_feats.json')), '| maneuvers', len(load('srd_maneuvers.json')))
