"""Join crystalkeep weapon rows with builder workbook WeaponInfo.csv and the JF catalog; classify agreement."""
import sys, re, json, csv, collections
sys.stdout.reconfigure(encoding='utf-8')
EQ, CSVP, JFDB, OUT = sys.argv[1:5]
W = json.load(open(EQ, encoding='utf-8'))
DICE = {'1': '1d1', '2': '1d2', '3': '1d3', '4': '1d4', '5': '1d6', '6': '1d8', '7': '1d10', '8': '1d12', '9': '2d4', '10': '2d6', '11': '2d8', '12': '2d10', '13': '3d6'}
BOOKS = {'PH': "Player's Handbook", 'CWar': 'Complete Warrior', 'CAdv': 'Complete Adventurer', 'RoS': 'Races of Stone', 'Frost': 'Frostburn',
         'Und': 'Underdark', 'RotW': 'Races of the Wild', 'Storm': 'Stormwrack', 'Eb': 'Eberron Campaign Setting', 'BoED': 'Book of Exalted Deeds',
         'RoE': 'Races of Eberron', 'MM4': 'Monster Manual IV', 'MM3': 'Monster Manual III', 'Sand': 'Sandstorm', 'HotA': 'Heroes of Horror?', 'RedHand': 'Red Hand of Doom'}
def key(s):
    s = str(s or '').lower().replace('’', "'")
    s = re.sub(r'\(.*?\)|\[.*?\]', '', s)
    parts = [p.strip() for p in s.split(',')]
    if len(parts) == 2: s = parts[1] + ' ' + parts[0]
    return re.sub(r'[^a-z0-9]', '', s)
def keyset(n):
    a = re.sub(r'[^a-z0-9]', '', re.sub(r'\(.*?\)|\[.*?\]', '', str(n).lower()))
    return {key(n), a}
wb = {}
with open(CSVP, encoding='utf-8', errors='replace') as f:
    for r in csv.DictReader(f):
        n = r['Select A Weapon'].strip()
        if n and not n.startswith('Select') and not n.startswith('-'):
            for k in keyset(n): wb.setdefault(k, r)
jf = {}
for e in json.load(open(JFDB, encoding='utf-8')):
    if e.get('type') == 'Weapon':
        for k in keyset(e['name']) | {kk for a in e.get('aliases') or [] for kk in keyset(a)}: jf[k] = e['id']
def crit_of(s):
    m = re.match(r'^(\d+)(?:-20)?\s*/\s*x(\d)', s or '')
    return (int(m.group(1)), int(m.group(2))) if m else None
def types(s): return ''.join(sorted(set(re.findall(r'[BPS]', s or ''))))
res = collections.defaultdict(list)
for w in W:
    srcs = [s for s in w['srcs'] if not re.match(r'^(DR|DU)\d', s.strip())]
    book = [s for s in srcs if re.sub(r'\s*p\s?\d.*', '', s).strip() in BOOKS]
    ks = keyset(w['name'])
    inJF = next((jf[k] for k in ks if k in jf), None)
    h = next((wb[k] for k in ks if k in wb), None)
    rec = {'name': w['name'], 'srcs': w['srcs'], 'book': book, 'inJF': inJF, 'section': w['section'], 'ck': {k: w.get(k) for k in ('size', 'dmg', 'crit', 'range', 'type', 'cost', 'weight', 'misc')}}
    if inJF: res['alreadyInJF'].append(rec); continue
    if not book: res['magazineOnly'].append(rec); continue
    if not h: res['indexOnly'].append(rec); continue
    rec['wb'] = {k: h.get(k) for k in ('Cat', 'Size', 'Dmg1(M)', 'Dmg2(M)', 'Threat', 'Crit1', 'Crit2', 'Range', 'Wgt', 'Type', 'Reach', 'Special')}
    diffs = []
    d1 = DICE.get(h['Dmg1(M)']); d2 = DICE.get(h['Dmg2(M)']) if h['Dmg2(M)'] else None
    ckd = (w.get('dmg') or '').replace('§', '').strip()
    ckd_parts = ckd.split('/')
    if d1 != ckd_parts[0]: diffs.append(f'dmg ck={ckd} wb={d1}/{d2}')
    if d2 and (len(ckd_parts) < 2 or ckd_parts[1] != d2): diffs.append(f'dmg2 ck={ckd} wb={d2}')
    c = crit_of(w.get('crit'))
    if not c or c[0] != int(h['Threat'] or 20) or c[1] != int(h['Crit1'] or 2): diffs.append(f"crit ck={w.get('crit')} wb={h['Threat']}/x{h['Crit1']}")
    if types(w.get('type')) != types(h['Type'].replace('&', ' ')): diffs.append(f"type ck={w.get('type')} wb={h['Type']}")
    ckr = re.match(r'(\d+)', w.get('range') or '')
    wbr = int(float(h['Range'])) if re.match(r'^[\d.]+$', h['Range'] or '') else 0
    if (int(ckr.group(1)) if ckr else 0) != wbr: diffs.append(f"range ck={w.get('range')} wb={h['Range']}")
    ckw = re.match(r'(\d*\.?\d+)', (w.get('weight') or '').replace('½', '0.5').replace('00.5', '0.5'))
    try:
        if ckw and abs(float(ckw.group(1)) - float(h['Wgt'] or 0)) > 0.01: diffs.append(f"wgt ck={w.get('weight')} wb={h['Wgt']}")
    except ValueError: diffs.append(f"wgt ck={w.get('weight')} wb={h['Wgt']}")
    rec['diffs'] = diffs
    res['agree' if not diffs else 'disagree'].append(rec)
wbOnly = set()
for k, r in wb.items():
    pass
print({k: len(v) for k, v in res.items()})
for r in res['disagree']: print('DIS', r['name'], r['book'], r['diffs'])
print('INDEX ONLY:', [(r['name'], r['book']) for r in res['indexOnly']])
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
