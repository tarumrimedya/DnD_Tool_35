"""P1 (rest): add book page numbers to JF feats whose `source` has none.

A page is accepted only when two independent sources agree on book + page:
the builder workbook Feats sheet (column AW book code + AS page) and the
crystalkeep 3.5 Feats Index (2007). Usage:
  p1_feat_pages.py <source_extracted.json> <featidx.json> <database dir> [--apply]
"""
import sys, re, json, os, collections
sys.stdout.reconfigure(encoding='utf-8')
SRC, IDX, DB = sys.argv[1:4]
APPLY = '--apply' in sys.argv
# workbook code -> (crystalkeep code, full title, SRD-licensed?)
BOOKS = {'PH': ('PH', "PHB", True), 'DMG': ('DMG', 'DMG', True), 'MM': ('MM', 'Monster Manual', True), 'EL': ('ELH', 'Epic Level Handbook', True),
         'PH2': ('PH2', "Player's Handbook II", False), 'CW': ('CWar', 'Complete Warrior', False), 'CAd': ('CAdv', 'Complete Adventurer', False),
         'CAr': ('CArc', 'Complete Arcane', False), 'CD': ('CDiv', 'Complete Divine', False), 'CS': ('CSco', 'Complete Scoundrel', False),
         'PGtF': ('PGF', "Player's Guide to Faerun", False), 'ECS': ('Eb', 'Eberron Campaign Setting', False), 'RoS': ('RoS', 'Races of Stone', False),
         'RE': ('RoE', 'Races of Eberron', False), 'BE': ('BoED', 'Book of Exalted Deeds', False), 'LM': ('LM', 'Libris Mortis', False),
         'RoD': ('RoD', 'Races of Destiny', False), 'MH': ('Mini', 'Miniatures Handbook', False), 'RotW': ('RotW', 'Races of the Wild', False),
         'PGtE': ('PGE', "Player's Guide to Eberron", False), 'SW': ('Storm', 'Stormwrack', False), 'Dr': ('Dcn', 'Draconomicon', False),
         'MM3': ('MM3', 'Monster Manual III', False), 'Sh': ('Sharn', 'Sharn: City of Towers', False), 'XPH': ('XPH', 'Expanded Psionics Handbook', True),
         'ToB': ('ToB', 'Tome of Battle', False), 'UA': ('UA', 'Unearthed Arcana', False)}
key = lambda n: re.sub(r'[^a-z0-9]', '', re.sub(r'\(.*?\)', '', str(n).lower().replace('’', "'")))
STOP = {'and', 'or', 'the', 'a', 'of', 'to', 'in', 'with', 'feat', 'ranks', 'rank', 'level', 'ability', 'score'}
def ptoks(s):
    s = str(s or '').lower().replace('base attack bonus', 'bab').replace('caster level', 'cl')
    s = re.sub(r'\b(strength|str)\b', 'str', s); s = re.sub(r'\b(dexterity)\b', 'dex', s); s = re.sub(r'\b(constitution)\b', 'con', s)
    s = re.sub(r'\b(intelligence)\b', 'int', s); s = re.sub(r'\b(wisdom)\b', 'wis', s); s = re.sub(r'\b(charisma)\b', 'cha', s)
    s = re.sub(r'(\d+)(st|nd|rd|th)\b', r'\1', s)
    return {t for t in re.findall(r'[a-z]+|\d+', s) if t not in STOP}
def psim(a, b):
    A, B = ptoks(a), ptoks(b)
    if not A and not B: return 1.0
    if not A or not B: return 0.0
    nums_a, nums_b = {t for t in A if t.isdigit()}, {t for t in B if t.isdigit()}
    if nums_a != nums_b: return 0.0  # different numeric thresholds = different feat
    return len(A & B) / len(A | B)
wb = collections.defaultdict(list)
for f in json.load(open(SRC, encoding='utf-8'))['feats']:
    if f.get('page') and str(f['page']).isdigit(): wb[key(f['name'])].append((f['src'], int(f['page']), f.get('prereq') or ''))
ck = {key(n): v for n, v in json.load(open(IDX, encoding='utf-8')).items()}
feats = json.load(open(os.path.join(DB, 'srd_feats.json'), encoding='utf-8'))
res = collections.Counter(); changes = []; unresolved = []; review = []
for e in feats:
    if e.get('type') != 'Feat' or re.search(r'\bp(?:g|age)?\.?\s?\d', str(e.get('source', '')), re.I): continue
    res['noPage'] += 1
    k = key(e['name']); agree = None
    for code, page, wbpre in wb.get(k, []):
        if code not in BOOKS: continue
        ckcode = BOOKS[code][0]
        refs = {(b, p) for b, p in (ck.get(k, {}).get('refs') or [])}
        if (ckcode, page) in refs: agree = (code, page, wbpre); break
    if not agree:
        unresolved.append((e['name'], e.get('source'), wb.get(k), (ck.get(k) or {}).get('refs'))); continue
    code, page, wbpre = agree; _, title, srd = BOOKS[code]
    cur = str(e.get('source') or '')
    sim = psim(e.get('prerequisites') or e.get('prereq') or '', wbpre)
    # Same name, different prerequisites (e.g. epic vs PHB2 Two-Weapon Rend) = a different feat: never relabel.
    # A record labelled SRD whose match is a non-SRD book is only relabelled when the prerequisites match closely.
    # An SRD-labelled record matched in an SRD source book (PHB/DMG/MM/XPH/ELH) is that same feat: wording may differ.
    srd_to_srd = srd and cur.upper().startswith('SRD')
    if not srd_to_srd and (sim < 0.6 or (cur.upper().startswith('SRD') and sim < 0.85)):
        review.append((e['id'], cur, f'{title} p.{page}', round(sim, 2), e.get('prerequisites') or e.get('prereq'), wbpre)); continue
    new = f'SRD / {title} p.{page}' if (srd and cur.upper().startswith('SRD')) else f'{title} p.{page}'
    changes.append((e['id'], cur, new)); res['resolved'] += 1
    if APPLY: e['source'] = new
print(dict(res), '| review (not applied):', len(review), '| no second source:', len(unresolved))
for c in changes: print('  +', c)
for r in review: print('  ~', r)
if APPLY:
    with open(os.path.join(DB, 'srd_feats.json'), 'w', encoding='utf-8', newline='') as f: f.write(json.dumps(feats, indent=2, ensure_ascii=False) + '\n')
    print('applied', len(changes))
