"""Parse crystalkeep 3.5 Equipment Index text (pdfq dump) into weapon/armor rows; join with builder workbook WeaponInfo.csv."""
import sys, re, json, csv, collections
sys.stdout.reconfigure(encoding='utf-8')
TXT, CSVP, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
L = [l.rstrip() for l in open(TXT, encoding='utf-8-sig')]
# page tracking + section tracking
rows = []; page = 0; section = None; part = None
SECTIONS = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields', 'Unarmed Melee Weapons', 'Simple Melee Weapons', 'Martial Melee Weapons',
            'Exotic Melee Weapons', 'Unusual Melee Weapons', 'Polearms', 'Simple Ranged Weapons', 'Martial Ranged Weapons', 'Exotic Ranged Weapons',
            'Ammunition', 'Simple Melee & Ranged Weapons', 'Martial Melee & Ranged Weapons', 'Exotic Melee & Ranged Weapons', 'Improvised Weapons',
            'Gunpowder Weapons', 'Options for Melee Weapons', 'Options for Ranged Weapons', 'Options', 'Weapons Errata']
clean = [l.strip() for l in L]
isSrc = lambda s: s.startswith('(') and re.search(r'p\s?\d', s)
i = 0; entries = []
while i < len(clean):
    s = clean[i]
    m = re.match(r'===== PDF PAGE (\d+)', s)
    if m: page = int(m.group(1)); i += 1; continue
    if s in SECTIONS: section = s; i += 1; continue
    if s and not isSrc(s) and i + 1 < len(clean) and isSrc(clean[i + 1]):
        name = s; j = i + 1; srcs = []
        while j < len(clean) and isSrc(clean[j]):
            srcs += re.findall(r'\(([^()]*?p\s?\d+[^()]*)\)', clean[j]); j += 1
        vals = []
        while j < len(clean) and not (clean[j] and not isSrc(clean[j]) and j + 1 < len(clean) and isSrc(clean[j + 1])) \
                and not clean[j].startswith('=====') and clean[j] not in SECTIONS:
            if clean[j]: vals.append(clean[j])
            j += 1
        entries.append({'name': name, 'srcs': srcs, 'vals': vals, 'section': section, 'page': page})
        i = j; continue
    i += 1

def parse_weapon(e):
    v = e['vals']; o = {}
    k = 0
    if v and re.match(r'^(\d?(Light|Hand|1Hand|2Hand)|—|-)$', v[0]): o['size'] = v[0]; k = 1
    def take(rx):
        nonlocal k
        if k < len(v) and re.match(rx, v[k]): k += 1; return v[k - 1]
        return None
    o['dmg'] = take(r'^(\d+d\d+|—|\d+|\d+d\d+/\d+d\d+|special)')
    # double weapons split over two lines: "1d6 &" + "1d4"; strip nonlethal/footnote markers
    if o['dmg'] and o['dmg'].rstrip().endswith(('&', '/')) and k < len(v) and re.match(r'^\d+d\d+', v[k]):
        o['dmg'] = o['dmg'].rstrip(' &/') + '/' + v[k]; k += 1
    if o['dmg']: o['dmg'] = re.sub(r'[§†*]', '', o['dmg']).replace(' & ', '/').strip()
    o['crit'] = take(r'^\d.*x\d|^—')
    o['range'] = take(r'^(\d+’|—|\d+\')')
    o['type'] = take(r'^[BPS](\b| |$)|^[BPS] (or|and|&) [BPS]|^[BPS]/[BPS]|^—')
    o['cost'] = take(r'.*\b(gp|sp|cp)\b|^—')
    o['weight'] = take(r'.*\blbs?\b|^—|^\d')
    o['misc'] = ' '.join(v[k:])[:200]
    return o

W = [dict(e, **parse_weapon(e)) for e in entries if e['page'] >= 9 and e['page'] <= 29 and e['section'] and 'Weapon' in e['section'] or (e['section'] == 'Polearms')]
codes = collections.Counter(re.sub(r'\s*p\s?\d.*', '', s).strip() for e in W for s in e['srcs'])
print('weapon entries', len(W)); print('source codes', codes.most_common())
json.dump(W, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(W[:3], ensure_ascii=False)[:1500])
