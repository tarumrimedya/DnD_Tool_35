"""SRD import P4: base and prestige class chassis from the builder workbook Class_Info sheet.

A chassis is HD, skill points, BAB, good saves, class skills, max level and requirements. Level-by-level
class features are not in the workbook (its ability rows are not tied to a class or level), so records
carry contentLevel "stub" and features {}.

Kept:
  - classes not already in database/srd_classes_races.json;
  - prestige classes only when the crystalkeep Prestige Class index lists the same class from the same book
    and agrees on HD, skill points, BAB and good saves (verification "cross-checked"; page and max level
    come from the index). Disagreements are written to p4_conflicts.json for a book check;
  - base classes (always 20 levels; racial paragons 3, UA p.26): "cross-checked" when the Base Class index
    agrees, else "unverified".
Excluded: Wizards online content, Dragon Magazine, custom/placeholder rows, NPC classes, and prestige classes
that the index does not list (no second source for their numbers or max level). Those are counted in
p4_report.json.

Output: p4_splat.json (3.5 WotC), p4_legacy.json (3.0 books and licensed 3.5 books; opt-in chunk).
Usage: p4_classes.py <source_extracted.json> <clsidx.json> <database dir> <out dir>
"""
import sys, re, json, os, collections
sys.stdout.reconfigure(encoding='utf-8')
SRC, IDX, DB, OUT = sys.argv[1:5]
R = json.load(open(SRC, encoding='utf-8'))
IX = json.load(open(IDX, encoding='utf-8'))
JF = [c for c in json.load(open(os.path.join(DB, 'srd_classes_races.json'), encoding='utf-8')) if c.get('type') == 'Class']

SECTION_PREFIX = r'^(NPC Only Prestige Classes|Undead Prestige Classes|Racial Paragon Classes|Alternate Base Classes|Prestige Classes|Base Classes|Base Class|NPC Classes)\s*'
TITLE_FIX = {'DMG': "Dungeon Master's Guide", 'DragonLance Campaign Setting': 'Dragonlance Campaign Setting', 'Complete Psionics': 'Complete Psionic',
             'Players Companion': "Player's Companion", 'Players Guide to Faerun': "Player's Guide to Faerun", 'Players Handbook II': "Player's Handbook II",
             'Ravenloft Players Handbook': "Ravenloft Player's Handbook", "Van Richten's Arsenal Vol. 1.": "Van Richten's Arsenal Vol. 1"}
EXCLUDE_TITLES = {'Wizards Online Content', 'Dragon Magazine Compendium', 'Custom Class', 'Lycanthrope HD'}
LEGACY_30 = {'Oriental Adventures', 'Races of Faerun', 'Underdark', 'Book of Vile Darkness', 'Magic of Faerun', 'Faiths and Pantheons',
             'Manual of the Planes', 'Silver Marches', 'Sword and Fist', 'Fiend Folio'}
LICENSED = {'Age of Mortals', 'Bestiary of Krynn', 'Champions of Darkness', 'Heroes of Light', "Player's Companion",
            "Ravenloft Player's Handbook", "Van Richten's Arsenal Vol. 1"}
# crystalkeep index book codes -> titles used above
IDX_BOOK = {'CWar': 'Complete Warrior', 'CAdv': 'Complete Adventurer', 'PGF': "Player's Guide to Faerun", 'CDiv': 'Complete Divine',
            'BoED': 'Book of Exalted Deeds', 'CArc': 'Complete Arcane', 'DMG': "Dungeon Master's Guide", 'RoS': 'Races of Stone',
            'Eb': 'Eberron Campaign Setting', 'EB': 'Eberron Campaign Setting', 'Und': 'Underdark', 'RotW': 'Races of the Wild',
            'RoE': 'Races of Eberron', 'RoD': 'Races of Destiny', 'Sharn': 'Sharn: City of Towers', 'MoE': 'Magic of Eberron',
            'PH2': "Player's Handbook II", 'Mini': 'Miniatures Handbook'}
SKILL = {'appraise': 'appraise', 'autohypnosis': 'autohypnosis', 'balance': 'balance', 'bluff': 'bluff', 'climb': 'climb',
         'concentration': 'concentration', 'decipher script': 'decipher_script', 'diplomacy': 'diplomacy', 'disable device': 'disable_device',
         'disguise': 'disguise', 'escape artist': 'escape_artist', 'forgery': 'forgery', 'gather information': 'gather_information',
         'handle animal': 'handle_animal', 'heal': 'heal', 'hide': 'hide', 'intimidate': 'intimidate', 'jump': 'jump',
         'knowledge (arcana)': 'k_arcana', 'knowledge (arch & eng)': 'k_arch', 'knowledge (architecture and engineering)': 'k_arch',
         'knowledge (dungeoneering)': 'k_dungeon', 'knowledge (geography)': 'k_geo', 'knowledge (history)': 'k_history',
         'knowledge (local)': 'k_local', 'knowledge (nature)': 'k_nature', 'knowledge (nobility)': 'k_nobility',
         'knowledge (nobility and royalty)': 'k_nobility', 'knowledge (religion)': 'k_religion', 'knowledge (the planes)': 'k_planes',
         'listen': 'listen', 'martial lore': 'martial_lore', 'move silently': 'move_silently', 'open lock': 'open_lock', 'perform': 'perform',
         'profession': 'profession', 'ride': 'ride', 'search': 'search', 'sense motive': 'sense_motive', 'sleight of hand': 'sleight_of_hand',
         'spellcraft': 'spellcraft', 'spot': 'spot', 'survival': 'survival', 'swim': 'swim', 'tumble': 'tumble', 'use magic device': 'umd',
         'use rope': 'use_rope'}
ALL_K = ['k_arcana', 'k_arch', 'k_dungeon', 'k_geo', 'k_history', 'k_local', 'k_nature', 'k_nobility', 'k_religion', 'k_planes']
ALIGN = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE']
BAB_RATE = {'high': 1, 'medium': 0.75, 'low': 0.5}
# Workbook vs index conflicts settled from the class table in the book (the workbook value was right in each);
# page and max level come from the same table.
BOOK_SETTLED = {
    'Evangelist': {'cite': 'Complete Divine Table 2-10 (BAB +0/+1/+2/+3/+3, d6, 6 skill points)'},
    'Rainbow Servant': {'cite': 'Complete Divine p.54 (2 + Int skill points)'},
    'Void Disciple': {'cite': 'Complete Divine p.72 (2 + Int skill points; 13 levels)'},
    'Moonspeaker': {'cite': 'Races of Eberron Table 7-3 (Fort and Will +2 at 1st; 12 levels)'},
    'Reforged': {'cite': 'Races of Eberron Table 7-7 (BAB +0/+1/+2, good Will)'},
}

key = lambda n: re.sub(r'[^a-z0-9]', '', re.sub(r'\(.*?\)', '', str(n).lower().replace('’', "'")))
tkey = lambda t: re.sub(r'[^a-z0-9]', '', str(t).lower())
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', str(s).lower().replace("'", '').replace('’', '')).strip('-')


def book_title(c):
    sec = c.get('section') or ''
    t = re.sub(SECTION_PREFIX, '', sec).strip()
    if not t:
        t = {'PH': "Player's Handbook", 'DMG': "Dungeon Master's Guide"}.get(c.get('src'), R['sources'].get(c.get('src') or '', ''))
    return TITLE_FIX.get(t, t)


def class_skills(names):
    out = []
    for n in names:
        low = n.lower().strip()
        if low.startswith('craft'): ks = ['craft_alchemy', 'craft_armor', 'craft_weapon']
        elif low.startswith('knowledge skills'): ks = ALL_K
        elif low.startswith('profession'): ks = ['profession']
        elif low.startswith('perform'): ks = ['perform']
        elif low.startswith('knowledge ()') or low.startswith('speak language'): ks = []
        else: ks = [SKILL[low]] if low in SKILL else []
        for k in ks:
            if k not in out: out.append(k)
    return out


def alignment_codes(text):
    t = text.lower()
    m = re.search(r'any\s+non-?\s*(lawful|chaotic|good|evil|neutral)', t)
    if m:
        bad = {'lawful': lambda a: a[0] == 'L', 'chaotic': lambda a: a[0] == 'C', 'good': lambda a: a[1:] == 'G',
               'evil': lambda a: a[1:] == 'E', 'neutral': lambda a: a == 'TN' or a[0] == 'N' or a[1:] == 'N'}[m.group(1)]
        return [a for a in ALIGN if not bad(a)]
    m = re.search(r'any\s+(lawful|chaotic|good|evil|neutral)', t)
    if m:
        ok = {'lawful': lambda a: a[0] == 'L', 'chaotic': lambda a: a[0] == 'C', 'good': lambda a: a[1:] == 'G',
              'evil': lambda a: a[1:] == 'E', 'neutral': lambda a: a == 'TN' or a[0] == 'N' or a[1:] == 'N'}[m.group(1)]
        return [a for a in ALIGN if ok(a)]
    names = {'lawful good': 'LG', 'neutral good': 'NG', 'chaotic good': 'CG', 'lawful neutral': 'LN', 'true neutral': 'TN',
             'chaotic neutral': 'CN', 'lawful evil': 'LE', 'neutral evil': 'NE', 'chaotic evil': 'CE'}
    found = [v for k, v in names.items() if k in t]
    if found and re.search(r'other than|\bnot\b|except', t):
        return [a for a in ALIGN if a not in found]
    return found or None


def requirement(line):
    s = re.sub(r'\s*\(not verified\)\.?', '', line).strip().rstrip('.').strip()
    if not s:
        return None
    low = s.lower()
    # "or greater / or higher / or better" is not an alternative
    alt = ' or ' in re.sub(r'\s+or\s+(greater|higher|better|more)\b', '', low)
    m = re.search(r'(?:base attack bonus|\bbab)(?: of)?(?: at least)?:?\s*\+?(\d+)', low)
    if m and not alt:
        return {'text': f'Base Attack Bonus: +{m.group(1)}', 'key': 'bab', 'min': int(m.group(1))}
    m = re.match(r'^(\d+) ranks in (.+)$', s, re.I) or re.match(r'^(.+?):?\s+(\d+) ranks?$', s, re.I)
    if m and not alt and 'any ' not in low:
        n, sk = (m.group(1), m.group(2)) if m.group(1).isdigit() else (m.group(2), m.group(1))
        sk_key = re.sub(r'\s+', ' ', re.sub(r'(\w)\(', r'\1 (', sk.lower().strip()))
        k = SKILL.get(sk_key) or ('perform' if sk_key.startswith('perform') else None) or ('profession' if sk_key.startswith('profession') else None)
        if k:
            return {'text': f'Skill: {sk.strip()} {n} ranks', 'key': 'skill', 'skill': k, 'ranks': int(n)}
    m = re.match(r'^(?:race:\s*|must be (?:an?\s+)?)([A-Z][A-Za-z\- ]+?)$', s, re.I)
    if m and not alt and 'alignment' not in low and len(m.group(1).split()) <= 3 and not re.search(r'\b(able|member|accepted|of|in|at|male|female)\b', m.group(1).lower()):
        return {'text': f'Race: {m.group(1).strip()}', 'key': 'race', 'val': m.group(1).strip()}
    if ('alignment' in low or re.match(r'^any\s+non-?\s*(lawful|chaotic|good|evil|neutral)$|^any\s+(lawful|chaotic|good|evil|neutral)$', low)) and not alt:
        codes = alignment_codes(low)
        if codes:
            return {'text': f'Alignment: {s}', 'key': 'alignment', 'allowed': codes}
    m = re.match(r'^(.+?)\s+feat$', s, re.I)
    if m and not alt and 'any ' not in low and ',' not in m.group(1):
        return {'text': f'Feat: {m.group(1).strip()}', 'key': 'feat', 'name': m.group(1).strip()}
    return {'text': f'Special: {s}', 'key': 'special'}


def requirement_lines(text):
    # Alternatives span lines ("BAB +6 OR" / "Any skill 9 ranks"): keep each OR chain together as one line.
    # Bullets ("•") start items; a newline inside a bullet is only a wrapped line.
    parts = re.split(r'•', text) if '•' in (text or '') else re.split(r'\n', text or '')
    lines = [re.sub(r'\s+', ' ', l).strip(' \t') for l in parts if l.strip(' \t\n')]
    out = []
    for l in lines:
        if out and (re.search(r'\bor$', out[-1], re.I) or re.match(r'^or\b', l, re.I)):
            out[-1] = f'{out[-1]} {l}'
        else:
            out.append(l)
    return out


jf_keys = {key(c['name']) for c in JF} | {key(a) for c in JF for a in (c.get('aliases') or [])}
jf_ids = {c['id'] for c in JF}
idx_by_key = collections.defaultdict(list)
for r in IX:
    idx_by_key[key(r['name'])].append(r)

stat = collections.Counter(); out = {'splat': [], 'legacy': []}; conflicts = []; skipped = collections.defaultdict(list); used_ids = set()
for c in R['classes']:
    name = (c.get('name') or '').strip()
    title = book_title(c)
    sec = c.get('section') or ''
    if not name or name.startswith('<') or name == 'N/A' or title in EXCLUDE_TITLES or sec.startswith('NPC'):
        stat['excluded'] += 1; skipped['excluded'].append(f'{name} ({title})'); continue
    if key(name) in jf_keys:
        stat['already in JF'] += 1; continue
    is_prc = 'Prestige' in sec
    is_paragon = sec.startswith('Racial Paragon')
    hd, sp, bab = int(c.get('hd') or 0), int(c.get('skillPts') or 0), c.get('bab')
    good = [s for s in ('fort', 'ref', 'will') if c.get(s) == 'high']
    same_book = [r for r in idx_by_key.get(key(name), []) if tkey(IDX_BOOK.get(r['book'], '')) == tkey(title)]
    agree = [r for r in same_book if r['hd'] == hd and r['skillPts'] == sp and r['bab'] == bab and set(r['goodSaves']) == set(good)]
    if is_prc and not same_book:
        stat['prestige without index entry'] += 1; skipped['prestige without index entry'].append(f'{name} ({title})'); continue
    settled = BOOK_SETTLED.get(name) if same_book and not agree else None
    if settled:
        agree = [dict(same_book[0], hd=hd, skillPts=sp, bab=bab, goodSaves=good)]
        stat['conflict settled from the book'] += 1
    if same_book and not agree:
        stat['conflict'] += 1
        conflicts.append({'name': name, 'book': title, 'workbook': {'hd': hd, 'skillPts': sp, 'bab': bab, 'goodSaves': good},
                          'index': [{k: r[k] for k in ('book', 'page', 'hd', 'skillPts', 'bab', 'goodSaves', 'maxLevel')} for r in same_book]})
        continue
    ix = agree[0] if agree else None
    edition = '3.0' if title in LEGACY_30 else ('3.5-licensed' if title in LICENSED else '3.5')
    max_level = ix['maxLevel'] if ix else (3 if is_paragon else 20)
    rid = 'cls-' + slug(name)
    if rid in jf_ids or rid in used_ids:
        rid = f'{rid}-{slug(title)}'
    used_ids.add(rid)
    reqs = [q for q in (requirement(l) for l in requirement_lines(c.get('prereq'))) if q]
    page = ix['page'] if ix else None
    rec = {
        'id': rid, 'schemaVersion': 2, 'name': name, 'type': 'Class',
        'category': 'Prestige' if is_prc else 'Base', 'isPrestige': is_prc,
        'source': f'{title} p.{page}' if page else title,
        'role': 'Prestige Class' if is_prc else ('Racial Paragon Class' if is_paragon else 'Base Class'),
        'hd': hd, 'hitDie': f'd{hd}', 'maxLevel': max_level,
        'bab': BAB_RATE[bab], 'babProgression': bab,
        'fort': 'good' if 'fort' in good else 'poor', 'ref': 'good' if 'ref' in good else 'poor', 'will': 'good' if 'will' in good else 'poor',
        'savingThrows': {s: ('high' if s in good else 'low') for s in ('fort', 'ref', 'will')},
        'skills': sp, 'skillPointsPerLevel': sp, 'classSkills': class_skills(c.get('classSkills') or []),
        'bonusFeatLevels': [], 'bonusFeatContract': None, 'bonusFeatContracts': None,
        'prerequisites': reqs, 'features': {},
        'description': '', 'shortDescription': '', 'tags': ['class', 'prestige' if is_prc else 'base'],
        'modifiers': [], 'damageParts': [], 'modes': [], 'ruleFlags': {},
        'edition': edition, 'contentLevel': 'stub', 'verification': 'verified' if settled else ('cross-checked' if ix else 'unverified'),
        'provenance': {'origin': 'builder-workbook-7.4.0.1', 'sheet': 'Class_Info', 'index': 'crystalkeep-3.5-class-index' if ix else None,
                       **({'book': settled['cite']} if settled else {})},
    }
    out['legacy' if edition != '3.5' else 'splat'].append(rec)
    stat['kept ' + ('prestige' if is_prc else 'base')] += 1
    stat['verification ' + rec['verification']] += 1

# Characters store classes by name (levelProgression[].className), so a name must be unique. When a 3.5 WotC class
# and a 3.0 / licensed class share a name (Samurai, Exemplar), the 3.5 one keeps the plain name and id; the other
# becomes "Name (Book Title)".
by_name = collections.defaultdict(list)
for recs in out.values():
    for r in recs: by_name[key(r['name'])].append(r)
for group in by_name.values():
    if len(group) < 2: continue
    keep = next((r for r in group if r['edition'] == '3.5'), None)
    assert keep and sum(r['edition'] == '3.5' for r in group) == 1, [r['name'] for r in group]
    keep['id'] = 'cls-' + slug(keep['name'])
    for r in group:
        if r is keep: continue
        title = re.sub(r' p\.\d+$', '', r['source'])
        r['name'] = f"{r['name']} ({title})"
        r['id'] = 'cls-' + slug(r['name'])
        stat['renamed for a name clash'] += 1

os.makedirs(OUT, exist_ok=True)
for b, recs in out.items():
    json.dump(sorted(recs, key=lambda r: r['name']), open(os.path.join(OUT, f'p4_{b}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(conflicts, open(os.path.join(OUT, 'p4_conflicts.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'stats': stat, 'skipped': skipped}, open(os.path.join(OUT, 'p4_report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(dict(stat), {b: len(v) for b, v in out.items()})
