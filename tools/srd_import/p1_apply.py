"""P1: apply book-verified fixes (HEROFORGE_VERIFICATION_TABLE.md) to database JSON. Idempotent."""
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
DB = sys.argv[1]
def load(n): return json.load(open(os.path.join(DB, n), encoding='utf-8'))
def save(n, d):
    with open(os.path.join(DB, n), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
log = []
def setf(rec, key, val):
    if rec.get(key) != val:
        log.append(f"{rec['id']}.{key}: {rec.get(key)!r} -> {val!r}"); rec[key] = val

# ---- A. Class saves (V2 savingThrows high/low + legacy top-level good/poor) ----
SAVES = {  # id: {save: 'high'|'low'}  -- sources in verification table
    'cls-knight': {'fort': 'low'},             # PHB2 Table 1-4
    'cls-spellthief': {'ref': 'low'},          # CAd p.18 Table 1-3
    'cls-dervish': {'fort': 'low', 'will': 'high'},  # CW p.26 Table 2-7
    'cls-ur-priest': {'fort': 'low'},          # CD p.70 Table 2-23
    'cls-jade-phoenix-mage': {'will': 'low'},  # ToB Table 5-5
}
legacy = {'high': 'good', 'low': 'poor'}
cr = load('srd_classes_races.json')
for rec in cr:
    fx = SAVES.get(rec.get('id'))
    if not fx: continue
    for s, v in fx.items():
        st = dict(rec['savingThrows'])
        if st.get(s) != v:
            log.append(f"{rec['id']}.savingThrows.{s}: {st.get(s)} -> {v}"); st[s] = v; rec['savingThrows'] = st
        setf(rec, s, legacy[v])
save('srd_classes_races.json', cr)

# ---- B. Fighter bonus feat flags ----
FB_FALSE = {
    'feat-tower-shield-proficiency': {'category': 'General', 'source': 'PHB p.101', 'tags': ['feat', 'general']},  # PHB p.101
    'feat-monkey-grip': {'category': 'General', 'tags': ['feat', 'general']},  # CW p.103
    'feat-evasive-reflexes': {}, 'feat-snap-kick': {}, 'feat-stone-power': {},  # ToB p.30 Table 2-1
}
FB_TRUE = {'feat-sharp-shooting': {'source': 'Complete Warrior p.105'}}  # CW p.105
ft = load('srd_feats.json')
for rec in ft:
    i = rec.get('id')
    if i in FB_FALSE:
        setf(rec, 'isFighterBonusFeat', False)
        for k, v in FB_FALSE[i].items(): setf(rec, k, v)
    elif i in FB_TRUE:
        setf(rec, 'isFighterBonusFeat', True)
        for k, v in FB_TRUE[i].items(): setf(rec, k, v)
save('srd_feats.json', ft)

# ---- C. Maneuver alias (ToB p.66 header is "Absolute Steel") ----
mn = load('srd_maneuvers.json')
for rec in mn:
    if rec.get('name') == 'Absolute Steel':
        al = list(rec.get('aliases') or [])
        if 'Absolute Steel Stance' not in al:
            al.append('Absolute Steel Stance'); setf(rec, 'aliases', al)
save('srd_maneuvers.json', mn)

# ---- D. Index mirror (c / fb keys) ----
ix = load('srd_index.json')
want = {k: v.get('category') for k, v in FB_FALSE.items()}
for it in ix['index']:
    i = it['id']
    if i in FB_FALSE:
        if it.pop('fb', None) is not None: log.append(f'index {i}.fb removed')
        if want[i] and it.get('c') != want[i]: log.append(f"index {i}.c: {it.get('c')} -> {want[i]}"); it['c'] = want[i]
    elif i in FB_TRUE and it.get('fb') != 1:
        it['fb'] = 1; log.append(f'index {i}.fb = 1')
save('srd_index.json', ix)
print('\n'.join(log) or 'no changes'); print(len(log), 'changes')
