"""SRD import P3: splatbook feats from the builder workbook Feats sheet.

Output (all lazy chunks, nothing loads at page open):
  srd_feats_splat.json   3.5 WotC feats (heroic tier)  + existing traits / skill tricks
  srd_feats_epic.json    3.5 WotC epic-tier feats
  srd_feats_legacy.json  3.0 books and licensed non-WotC 3.5 books (opt-in filter only)

Excluded: Dragon Magazine, "DNT TBD" placeholders, "-See ...-" pointers, section/book header rows,
"x2/x3" repeat rows. Benefit text = the workbook's one-line summary (contentLevel "summary").
verification: "cross-checked" when the 3.5 feat index lists the same book + page, else "unverified".
Usage: p3_feats.py <source_extracted.json> <featidx.json> <database dir> <out dir>
"""
import sys, re, json, os, collections
sys.stdout.reconfigure(encoding='utf-8')
SRC, IDX, DB, OUT = sys.argv[1:5]
R = json.load(open(SRC, encoding='utf-8'))
BOOK = {  # code: (title, edition, feat-index code)
 'PH': ("Player's Handbook", '3.5', 'PH'), 'PH2': ("Player's Handbook II", '3.5', 'PH2'), 'DMG': ("Dungeon Master's Guide", '3.5', 'DMG'),
 'MM': ('Monster Manual', '3.5', 'MM'), 'MM4': ('Monster Manual IV', '3.5', 'MM4'), 'XPH': ('Expanded Psionics Handbook', '3.5', 'XPH'),
 'CW': ('Complete Warrior', '3.5', 'CWar'), 'CAd': ('Complete Adventurer', '3.5', 'CAdv'), 'CAr': ('Complete Arcane', '3.5', 'CArc'),
 'CD': ('Complete Divine', '3.5', 'CDiv'), 'CM': ('Complete Mage', '3.5', 'CM'), 'CS': ('Complete Scoundrel', '3.5', 'CSco'),
 'CC': ('Complete Champion', '3.5', 'CC'), 'CP': ('Complete Psionic', '3.5', 'CP'), 'ToB': ('Tome of Battle', '3.5', 'ToB'),
 'TM': ('Tome of Magic', '3.5', 'ToM'), 'MoI': ('Magic of Incarnum', '3.5', 'MoI'), 'RoS': ('Races of Stone', '3.5', 'RoS'),
 'RoD': ('Races of Destiny', '3.5', 'RoD'), 'RotW': ('Races of the Wild', '3.5', 'RotW'), 'RotD': ('Races of the Dragon', '3.5', 'RotD'),
 'RE': ('Races of Eberron', '3.5', 'RoE'), 'ECS': ('Eberron Campaign Setting', '3.5', 'Eb'), 'PGtE': ("Player's Guide to Eberron", '3.5', 'PGE'),
 'MoE': ('Magic of Eberron', '3.5', 'MoE'), 'SoS': ('Secrets of Sarlona', '3.5', 'SoS'), 'SoX': ("Secrets of Xen'drik", '3.5', 'SoX'),
 'Sh': ('Sharn: City of Towers', '3.5', 'Sharn'), 'PGtF': ("Player's Guide to Faerun", '3.5', 'PGF'), 'ChR': ('Champions of Ruin', '3.5', 'ChR'),
 'ChV': ('Champions of Valor', '3.5', 'ChV'), 'CoS': ('City of Splendors: Waterdeep', '3.5', 'CoS'), 'Dr': ('Draconomicon', '3.5', 'Dcn'),
 'DrM': ('Dragon Magic', '3.5', 'DrM'), 'LM': ('Libris Mortis', '3.5', 'LM'), 'LoM': ('Lords of Madness', '3.5', 'LoM'),
 'FCII': ('Fiendish Codex II', '3.5', 'FC2'), 'HH': ('Heroes of Horror', '3.5', 'HoH'), 'HB': ('Heroes of Battle', '3.5', 'HoB'),
 'FB': ('Frostburn', '3.5', 'Frost'), 'Sand': ('Sandstorm', '3.5', 'Sand'), 'SW': ('Stormwrack', '3.5', 'Storm'), 'PlH': ('Planar Handbook', '3.5', 'PlH'),
 'MH': ('Miniatures Handbook', '3.5', 'Mini'), 'Ci': ('Cityscape', '3.5', 'Ci'), 'Ds': ('Dungeonscape', '3.5', 'Ds'), 'DLCS': ('Dragonlance Campaign Setting', '3.5', 'DLCS'),
 'BE': ('Book of Exalted Deeds', '3.5', 'BoED'),
 # 3.0 books
 'OA': ('Oriental Adventures', '3.0', 'OA'), 'RoF': ('Races of Faerun', '3.0', 'RoF'), 'BV': ('Book of Vile Darkness', '3.0', 'BoVD'),
 'UD': ('Underdark', '3.0', 'Und'), 'Mag': ('Magic of Faerun', '3.0', 'MoF'), 'SV': ('Savage Species', '3.0', 'SS'), 'EL': ('Epic Level Handbook', '3.0', 'ELH'),
 # licensed non-WotC 3.5 books
 'AoM': ('Age of Mortals', '3.5-licensed', 'AoM'), 'CoD': ('Champions of Darkness', '3.5-licensed', 'CoD'), 'HoL': ('Heroes of Light', '3.5-licensed', 'HoL'),
 'RVL': ('Ravenloft', '3.5-licensed', 'RVL'), 'VRA1': ("Van Richten's Arsenal", '3.5-licensed', 'VRA1'), 'PC': ("Player's Companion", '3.5-licensed', 'PC'),
}
SKIP_BOOKS = {'Dmag', 'DMag'}  # Dragon Magazine: not verifiable from the library
key = lambda n: re.sub(r'[^a-z0-9]', '', re.sub(r'\(.*?\)', '', str(n).lower().replace('’', "'")))
fkey = lambda n: re.sub(r'[^a-z0-9]', '', str(n).lower().replace('’', "'"))  # keeps "(medium)" etc.
SRD_BOOKS = {'PH', 'DMG', 'MM', 'XPH', 'EL'}
# Reviewed by hand: same feat as the JF record (wording/errata differences or epic feats reprinted
# in CW/CAr/CAd epic sections), not a namesake. Prerequisite conflicts to check against the books:
# Somatic Weaponry (4 vs 5 ranks), Master Staff (15 vs 30 ranks), Oversized Two-Weapon Fighting (Str vs Dex).
SAME_FEAT = {fk for fk in map(lambda n: re.sub(r'[^a-z0-9]', '', n.lower()), [
    'Shield Specialization', 'Practiced Spellcaster', 'Oversized Two-Weapon Fighting', 'Somatic Weaponry', 'Enhance Spell',
    'Epic Spell Penetration', 'Master Staff', 'Epic Dodge', 'Group Inspiration', 'Epic Weapon Focus', 'Epic Spell Focus', 'Epic Skill Focus'])}
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace("'", '').replace('’', '')).strip('-')
STOP = {'and', 'or', 'the', 'a', 'of', 'to', 'in', 'with', 'feat', 'ranks', 'rank', 'level', 'ability', 'score'}
WORDNUM = {'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6'}
def ptoks(s):
    s = str(s or '').lower().replace('base attack bonus', 'bab').replace('caster level', 'cl')
    s = re.sub(r'\b(one|two|three|four|five|six)\b', lambda m: WORDNUM[m.group(1)], s)
    s = re.sub(r'(\d+)(st|nd|rd|th)\b', r'\1', s)
    return {t for t in re.findall(r'[a-z]+|\d+', s) if t not in STOP}
def psim(a, b):
    A, B = ptoks(a), ptoks(b)
    if not A and not B: return 1.0
    if not A or not B: return 0.0
    if {t for t in A if t.isdigit()} != {t for t in B if t.isdigit()}: return 0.0
    return len(A & B) / len(A | B)
TITLES = {t.lower() for t, _, _ in BOOK.values()} | {'dungeonscape', 'magic of incarnum'}
def is_junk(f):
    n, txt = f['name'].strip(), f['prereq'] + ' ' + f['summary']
    return (not n or n.startswith('--') or re.search(r'\sx\d$', n) or n.endswith(' Feats') or n.lower() in TITLES
            or 'DNT TBD' in txt or re.search(r'-See [^-]+-', txt) or not f['summary'])
tla = {}
for c in R['classes']:
    for k in (c.get('abbr'), c.get('tla')):
        if k: tla[k.strip()] = c['name']
idx = {key(n): {(b, p) for b, p in v['refs']} for n, v in json.load(open(IDX, encoding='utf-8')).items()}

existing = {}
existing_ids = set()
for fn in os.listdir(DB):
    if not fn.endswith('.json') or fn in ('srd_index.json', 'lego_patterns.json', 'srd_companions.json'): continue
    d = json.load(open(os.path.join(DB, fn), encoding='utf-8'))
    for e in d if isinstance(d, list) else []:
        if isinstance(e, dict) and e.get('id'):
            existing_ids.add(e['id'])
            if fn in ('srd_feats.json',) and e.get('type') in ('Feat', 'Flaw'):
                existing[fkey(e['name'])] = e
                # JF picker placeholders such as "Weapon Focus (No Weapon Selected)" also answer to the bare name
                if re.search(r'\((no |not set|none|all\b)', e['name'], re.I): existing.setdefault(key(e['name']), e)
for fn in ('srd_feats_splat.json', 'srd_feats_epic.json', 'srd_feats_legacy.json'):
    p = os.path.join(DB, fn)
    if os.path.exists(p):
        existing_ids -= {e['id'] for e in json.load(open(p, encoding='utf-8')) if e.get('type') == 'Feat'}

merged = collections.OrderedDict(); stats = collections.Counter()
for f in R['feats']:
    if f['src'] in SKIP_BOOKS: stats['dragonMagazine'] += 1; continue
    if is_junk(f): stats['junk'] += 1; continue
    if f['src'] not in BOOK: stats['unknownBook:' + f['src']] += 1; continue
    k = fkey(f['name'])
    jf = existing.get(k) or (existing.get(key(f['name'])) if '(' not in f['name'] else None)
    if jf:
        jpre = (jf.get('prerequisites') or jf.get('prereq') or '').strip()
        wpre = re.sub(r'\s*\((?:not|non) verified\)', '', f['prereq'] or '').strip()
        # Same feat unless both sides state prerequisites, they clearly differ, and the book is not an SRD source book.
        same = k in SAME_FEAT or f['src'] in SRD_BOOKS or not jpre or jpre.lower() in ('none', '-') or not wpre or psim(jpre, wpre) >= 0.6
        if same: stats['alreadyInJF'] += 1; continue
    mk = (k, f['src'])
    sec = re.sub(r'\s*Feats?$', '', f['section'] or 'General').strip() or 'General'
    if mk in merged:
        merged[mk]['types'].add(sec); continue
    merged[mk] = dict(f=f, types={sec}, collidesWithJF=bool(jf))

recs = {'splat': [], 'epic': [], 'legacy': []}; used = set(existing_ids)
for (k, code), m in merged.items():
    f = m['f']; title, edition, ckcode = BOOK[code]
    types = sorted({t for part in m['types'] for t in re.split(r'\s*&\s*', part)})
    cat = 'Epic' if 'Epic' in types else ('General' if 'General' in types else types[0])
    tier = 'epic' if 'Epic' in types else 'heroic'
    base = 'feat-' + slug(f['name'])
    fid = base if base not in used else f'{base}-{slug(code)}'
    n = 2
    while fid in used: fid = f'{base}-{slug(code)}-{n}'; n += 1
    used.add(fid)
    page = int(f['page']) if str(f.get('page') or '').isdigit() else None
    pre = re.sub(r'\s*\((?:not|non) verified\)', '', f['prereq'] or '').strip(' ,;') or ''
    ben = re.sub(r'\s+', ' ', f['summary']).strip().replace('×', '•')
    ben = ben[0].upper() + ben[1:] if ben else ben
    bonus = [tla[t.strip()] for t in f['bonusFeatClasses'] if t.strip() in tla]
    xc = page is not None and (ckcode, page) in idx.get(k, set())
    rec = {'id': fid, 'schemaVersion': 2, 'name': f['name'].strip(), 'type': 'Feat', 'category': cat, 'featTypes': types,
           'scope': 'All', 'slot': 'None', 'source': f'{title} p.{page}' if page else title,
           'isFighterBonusFeat': ('Ftr' in [t.strip() for t in f['bonusFeatClasses']]) and tier == 'heroic',
           'bonusFeatFor': bonus, 'prerequisites': pre or 'None', 'prereq': pre or 'None',
           'benefit': ben,  # pickers/detail panels fall back to benefit; no duplicated description fields (chunk size)
           'tags': ['feat'] + [t.lower() for t in types], 'modifiers': [], 'damageParts': [], 'modes': [], 'ruleFlags': {},
           'levelBand': tier, 'edition': edition, 'contentLevel': 'summary', 'verification': 'cross-checked' if xc else 'unverified',
           'provenance': {'origin': 'builder-workbook-7.4.0.1', 'sheet': 'Feats', 'row': f['row']}}
    if tier == 'epic' and 'Ftr' in [t.strip() for t in f['bonusFeatClasses']]: rec['fighterBonusFeatTier'] = 'epic'
    if m['collidesWithJF']: rec['aliases'] = [f"{rec['name']} ({title})"]
    bucket = 'legacy' if edition != '3.5' else ('epic' if tier == 'epic' else 'splat')
    recs[bucket].append(rec); stats[bucket] += 1
    if xc: stats['crossChecked'] += 1
    if m['collidesWithJF']: stats['sameNameDifferentFeat'] += 1
os.makedirs(OUT, exist_ok=True)
for b, arr in recs.items():
    json.dump(arr, open(os.path.join(OUT, f'p3_{b}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(dict(stats))
print('legacy editions:', collections.Counter(r['edition'] for r in recs['legacy']))
print('sample:', json.dumps(recs['splat'][0], ensure_ascii=False)[:700])
print('collisions:', [(r['id'], r['source']) for b in recs.values() for r in b if r.get('aliases')][:20])
