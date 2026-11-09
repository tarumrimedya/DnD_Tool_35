"""SRD import P2: build Canonical V2 splatbook weapon/armor records.

Weapons: crystalkeep 3.5 Equipment Index (2007) x builder workbook WeaponInfo.csv, kept only when both agree on
damage/critical/type/range/weight (cross-checked); 5 disputed weapons were settled from the books.
Armor: transcribed from the book tables (Sandstorm T4-2, Stormwrack T5-4, Races of Eberron ch.8, Races of Stone T7-2).
"""
import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
JOIN, JFDB, OUT = sys.argv[1:4]
J = json.load(open(JOIN, encoding='utf-8'))
DICE = {'3': '1d3', '4': '1d4', '5': '1d6', '6': '1d8', '7': '1d10', '8': '1d12', '9': '2d4', '10': '2d6', '11': '2d8', '12': '2d10'}
BOOKS = {'PH': "Player's Handbook", 'CWar': 'Complete Warrior', 'CAdv': 'Complete Adventurer', 'RoS': 'Races of Stone', 'Frost': 'Frostburn',
         'RotW': 'Races of the Wild', 'Storm': 'Stormwrack', 'Eb': 'Eberron Campaign Setting', 'RoE': 'Races of Eberron',
         'MM4': 'Monster Manual IV', 'MM3': 'Monster Manual III', 'Sand': 'Sandstorm'}
EXCLUDE = {'Spiked Armor', 'Razored Armor', 'Maquahuitl', 'Nekode', 'Steel Fins', 'Pincer Staff'}  # armor spikes (Lego), TBD data, FR Underdark 3.0
TYPEW = {'P': 'Piercing', 'S': 'Slashing', 'B': 'Bludgeoning'}

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower().replace("'", '').replace('’', '')).strip('-')
def natural(n):
    p = [x.strip() for x in n.split(',')]
    return f'{p[1]} {p[0]}' if len(p) == 2 else n
def title(n): return ' '.join(w if w.isupper() else w[:1].upper() + w[1:] for w in n.split(' '))
def dtype(txt):
    t = (txt or '').replace('&', ' and ').replace('/', ' or ')
    letters = re.findall(r'\b([BPS])\b', t)
    words = [TYPEW[x] for x in dict.fromkeys(letters)]
    if len(words) < 2: return words[0] if words else 'Untyped'
    return ' & '.join(words) if ' and ' in t else '/'.join(words)
def money(c):
    m = re.match(r'([\d,]+(?:\.\d+)?)\s*(gp|sp|cp)', (c or '').replace('½', '.5'))
    if not m: return None
    v = float(m.group(1).replace(',', '')); v = v / 10 if m.group(2) == 'sp' else (v / 100 if m.group(2) == 'cp' else v)
    return int(v) if v == int(v) else v
def src_str(book):
    out = []
    for b in book:
        m = re.match(r'(\w+)\s*p\s?(\d+)', b)
        if m and m.group(1) in BOOKS: out.append(f'{BOOKS[m.group(1)]} p.{m.group(2)}')
    return ' / '.join(dict.fromkeys(out))
def part(dice, typ, src='Base'): return {'dice': dice, 'bonus': 0, 'type': typ, 'multiplyOnCrit': True, 'onCritOnly': False, 'source': src}

def make_weapon(w):
    name = title(natural(w['name']))
    cat = {'S': 'Simple', 'M': 'Martial', 'E': 'Exotic'}[w['cat']]
    hand, rng, flags, tags = w['hand'], w['range'], dict(w.get('flags') or {}), set(w.get('tags') or [])
    typ = w['type']; dice = w['dmg']; cr, cm = w['crit']
    modes = []
    def mode(mid, label, h, scope, strm, rf, d=dice, t=typ, crr=cr, cmm=cm, prof=cat, src='Base', ri=None):
        m = {'id': mid, 'label': label, 'handedness': h, 'proficiency': prof, 'combatScope': scope, 'strMult': strm}
        if ri: m['rangeIncrement'] = ri
        m.update({'critRange': crr, 'critMult': cmm, 'damageParts': [part(d, t, src)], 'modifiers': [], 'ruleFlags': dict(rf)})
        return m
    rf = {}
    if hand == 'light': rf.update(isLight=True, finessable=True)
    if hand == '2h' or w.get('twoHandedRanged'): rf['twoHanded'] = True
    for k in ('reach', 'trip', 'disarm', 'nonlethal', 'brace', 'finessable', 'thrown', 'grapple'):
        if flags.get(k): rf[k] = True
    if w.get('double'):
        rf['doubleWeapon'] = True
        d2, t2, c2r, c2m = w['double']
        modes = [mode('primary-head', 'Primary Head (TWF)', '1h', 'melee', 1, rf),
                 mode('offhand-head', 'Off-Hand Head (TWF)', 'light', 'melee', 0.5, {'isLight': True, 'doubleWeaponOffHand': True}, d=d2, t=t2, crr=c2r, cmm=c2m, src='Off-Hand Head'),
                 mode('2h-single', 'Single Head (Two-Handed)', '2h', 'melee', 1.5, rf)]
    elif w.get('handAndHalf'):
        modes = [mode('1h-exotic', 'One-Handed (Exotic)', '1h', 'melee', 1, rf, prof='Exotic'),
                 mode('2h-martial', 'Two-Handed (Martial)', '2h', 'melee', 1.5, dict(rf, twoHanded=True), prof='Martial')]
    elif hand == 'ranged':
        modes = [mode('ranged', 'Ranged', 'ranged', 'ranged', 1 if rf.get('thrown') else 0, rf, ri=rng)]
    else:
        lbl = {'light': ('melee-light', 'Melee (Light)'), '1h': ('melee-1h', 'One-Handed'), '2h': ('melee-2h', 'Two-Handed')}[hand]
        modes = [mode(lbl[0], lbl[1], hand, 'melee', 1.5 if hand == '2h' else 1, rf)]
        if hand == '1h': modes.append(mode('melee-2h', 'Two-Handed', '2h', 'melee', 1.5, dict(rf, twoHanded=True)))
        if rng:
            rf['thrown'] = True
            for m in modes: m['ruleFlags']['thrown'] = True
            modes.append(mode('thrown', f'Thrown ({rng} ft.)', hand, 'ranged', 1, rf, ri=rng))
    tags |= {cat.lower(), {'light': 'light', '1h': '1h', '2h': '2h', 'ranged': 'ranged'}[hand]}
    tags |= {k for k, v in rf.items() if v and k in ('reach', 'trip', 'disarm', 'nonlethal', 'brace', 'finessable', 'thrown', 'doubleWeapon', 'twoHanded', 'isLight')}
    tags.add(typ.lower())
    handTxt = {'light': 'light melee', '1h': 'one-handed melee', '2h': 'two-handed melee', 'ranged': 'ranged'}[hand]
    critTxt = f"{cr}–20/×{cm}" if cr < 20 else f"×{cm}"
    dmgTxt = f"{dice}/{w['double'][0]}" if w.get('double') else dice
    short = f"{cat} {handTxt} weapon ({dmgTxt} {typ.lower()}, {critTxt}{f', {rng} ft. range increment' if rng else ''})."
    if w.get('handAndHalf'): short += ' Exotic in one hand; can be wielded two-handed as a martial weapon.'
    if w.get('double'): short += f" Double weapon: second head {w['double'][0]} {w['double'][1].lower()}, {(str(w['double'][2]) + '–20/') if w['double'][2] < 20 else ''}×{w['double'][3]}."
    if rf.get('reach'): short += ' Reach weapon.'
    if w.get('note'): short += ' ' + w['note']
    rec = {
        'id': w.get('id') or 'wpn-' + slug(name), 'schemaVersion': 2, 'name': name, 'type': 'Weapon', 'category': cat,
        'handedness': hand, 'slot': 'Two-Hand' if rf.get('twoHanded') else 'Main Hand', 'source': w['source'],
        'cost': w['cost'], 'weight': w['weight'], 'critRange': cr, 'critMult': cm, 'rangeIncrement': rng or 0,
        'shortDescription': short, 'description': f'<p>{short}</p>', 'benefit': short,
        'tags': sorted(tags), 'modifiers': [], 'damageParts': [part(dice, typ)], 'modes': modes, 'ruleFlags': rf,
        'weaponType': f"{cat} {'Ranged' if hand == 'ranged' else {'light': 'Light', '1h': 'One-Handed', '2h': 'Two-Handed'}[hand]}",
        'damage': dice, 'dmgType': typ, 'isLight': hand == 'light', 'combatModifiers': [],
        'aliases': [w['name']] if w['name'] != name else [],
        'tier': 'heroic', 'contentLevel': 'summary', 'verification': w['verification'],
        'provenance': w['provenance']
    }
    if rng: rec['range'] = rng
    if rf.get('finessable'): rec['finessable'] = True
    return rec

# ---------- agreed weapons (cross-checked) ----------
weapons = {}; seen = set()
for r in J['agree']:
    if r['name'] in EXCLUDE or r['name'] in seen: continue
    if not any(re.match(r'(\w+)', b).group(1) in BOOKS for b in r['book']): continue
    seen.add(r['name']); h, ck = r['wb'], r['ck']
    misc = ck.get('misc') or ''
    size = ck.get('size') or '—'
    hand = {'0Light': 'light', '1Hand': '1h', '2Hand': '2h'}.get(size) or {'L': 'light', 'O': '1h', 'T': '2h', 'R': 'ranged'}.get(h['Size'])
    if r['section'] and 'Ranged Weapons' in r['section'] and 'Melee' not in r['section']: hand = 'ranged'
    rng = int(float(h['Range'])) if re.match(r'^[\d.]+$', h['Range'] or '') else 0
    dmg2 = DICE.get(h['Dmg2(M)']) if h['Dmg2(M)'] else None
    flags = {'reach': bool(re.search(r'Reach', misc)) or h.get('Reach') == 'TRUE', 'trip': 'Trip' in misc, 'disarm': 'Disarm' in misc,
             'nonlethal': bool(re.search(r'Subdual|nonlethal', misc, re.I)), 'brace': bool(re.search(r'vs\.? Charge', misc, re.I)),
             'finessable': 'Finesse' in misc, 'grapple': 'Grapple' in misc, 'thrown': hand == 'ranged' and (h.get('Special') == 'T' or 'Melee & Ranged' in (r['section'] or ''))}
    nm = r['name']
    twoHandedRanged = hand == 'ranged' and bool(re.search(r'bow|crossbow|blowgun', nm, re.I)) and 'Hand' not in nm
    if 'Hand-and-a-Half' in misc: hand = '1h'  # exotic one-handed / martial two-handed (like the bastard sword)
    weapons[nm] = dict(name=nm, cat=h['Cat'], hand=hand, range=rng, dmg=DICE[h['Dmg1(M)']], crit=(int(h['Threat'] or 20), int(h['Crit1'] or 2)),
                       type=dtype(ck.get('type') or h['Type']), cost=money(ck.get('cost')), weight=float(h['Wgt']) if '.' in h['Wgt'] else int(h['Wgt']),
                       source=src_str(r['book']), flags=flags, handAndHalf='Hand-and-a-Half' in misc, twoHandedRanged=twoHandedRanged,
                       double=(dmg2, dtype(ck.get('type') or h['Type']), int(h['Threat'] or 20), int(h['Crit2'] or h['Crit1'] or 2)) if dmg2 else None,
                       verification='cross-checked',
                       provenance={'origin': 'builder-workbook-7.4.0.1', 'file': 'data/WeaponInfo.csv', 'crossCheck': 'crystalkeep D&D 3.5 Equipment Index (2007-10-01)'})

# Thrown / two-handed facts not encoded in either table (Frostburn & Races of the Wild weapon descriptions)
for nm in ('Glot', 'Harpoon', 'Skiprock'):
    if nm in weapons: weapons[nm]['flags']['thrown'] = True
if 'Icechucker' in weapons: weapons['Icechucker']['twoHandedRanged'] = True  # fired like a heavy crossbow

# ---------- disputed weapons settled from the books ----------
book = lambda src, page: {'origin': 'rulebook', 'book': src, 'page': page, 'hint': 'builder-workbook-7.4.0.1 + crystalkeep index (conflicting)'}
weapons['Sugliin'] = dict(name='Sugliin', cat='E', hand='2h', range=0, dmg='2d8', crit=(20, 2), type='Piercing & Slashing', cost=35, weight=20,
                          source='Frostburn p.76', flags={}, verification='verified', provenance=book('Frostburn', 76))
weapons['Razor Skipdisk'] = dict(name='Razor Skipdisk', cat='E', hand='ranged', range=10, dmg='1d6', crit=(18, 2), type='Slashing', cost=15, weight=2,
                                 source='Frostburn p.76', flags={'thrown': True}, verification='verified', provenance=book('Frostburn', 76))
weapons['Scorpion Chain, Drow'] = dict(name='Scorpion Chain, Drow', cat='E', hand='2h', range=0, dmg='1d6', crit=(19, 2), type='Slashing', cost=25, weight=12,
                                       source='Races of Eberron p.172', flags={'reach': True}, verification='verified', provenance=book('Races of Eberron', 172))
weapons['Foot Spike'] = dict(name='Foot Spike', cat='E', hand='light', range=0, dmg='1d4', crit=(20, 3), type='Piercing', cost=8, weight=1,
                             source='Races of the Wild p.165', flags={}, verification='verified', provenance=book('Races of the Wild', 165))
weapons['Lynxpaw'] = dict(name='Lynxpaw', cat='E', hand='2h', range=0, dmg='1d6', crit=(18, 2), type='Piercing', cost=30, weight=4,
                          source='Races of the Wild p.165', flags={}, double=('1d4', 'Slashing', 20, 3), verification='verified', provenance=book('Races of the Wild', 165))

# ---------- armor transcribed from the book tables ----------
A = []
def armor(name, cat, src, page, cost, ac, mdex, acp, asf, s30, s20, wgt, exotic=False, shield=False, note=''):
    A.append(dict(name=name, cat=cat, src=src, page=page, cost=cost, ac=ac, maxDex=mdex, acp=acp, asf=asf, s30=s30, s20=s20, wgt=wgt, exotic=exotic, shield=shield, note=note))
armor('Feather Cloak', 'Light', 'Sandstorm', 99, 1000, 2, 6, 0, 10, '30 ft.', '20 ft.', 3)
armor('Silk Swathes', 'Light', 'Sandstorm', 99, 400, 1, 8, 0, 5, '30 ft.', '20 ft.', 6)
armor('Hide Shield', 'Shield', 'Sandstorm', 99, 50, 3, 4, -3, 30, None, None, 30, shield=True)
armor('Cord Armor', 'Light', 'Stormwrack', 106, 15, 2, 5, -1, 15, '30 ft.', '20 ft.', 15)
armor('Sharkskin Armor', 'Light', 'Stormwrack', 106, 85, 3, 6, -1, 10, '30 ft.', '20 ft.', 15, note='Shark teeth along the forearms, shoulders, and legs count as armor spikes; +6 circumstance bonus on Escape Artist checks against rope or similar easily cut bindings.')
armor('Shell Armor', 'Medium', 'Stormwrack', 106, 25, 3, 3, -2, 20, '20 ft.', '15 ft.', 20)
armor('Chitin Armor (Stormwrack)', 'Medium', 'Stormwrack', 106, 75, 4, 4, -3, 30, '20 ft.', '15 ft.', 20)
armor('Living Coral Armor', 'Medium', 'Stormwrack', 106, 16000, 6, 3, -4, 20, '20 ft.', '15 ft.', 30, note='Living coral armor; additional coral benefits can be grown into it for 500 gp each (see Stormwrack).')
armor('Chitin Armor (Races of Eberron)', 'Light', 'Races of Eberron', 171, 20, 2, 7, -1, 5, '30 ft.', '20 ft.', 10)
armor('Scorpion Breastplate', 'Medium', 'Races of Eberron', 171, 300, 4, 4, -3, 20, '20 ft.', '15 ft.', 20)
armor('Stone Plate', 'Heavy', 'Races of Stone', 158, 750, 6, 1, -7, 30, '20 ft.', '15 ft.', 35)
armor('Heavy Plate', 'Heavy', 'Races of Stone', 158, 2000, 9, 0, -8, 45, '20 ft.', '15 ft.', 100)
armor('Steel Tower Shield', 'Shield', 'Races of Stone', 158, 75, 4, 2, -10, 50, None, None, 100, shield=True)
armor('Gnome Twist Cloth', 'Light', 'Races of Stone', 158, 150, 1, None, 0, 5, '30 ft.', '20 ft.', 5, exotic=True)
armor('Mammoth Leather', 'Light', 'Races of Stone', 158, 45, 4, 4, -4, 20, '30 ft.', '20 ft.', 30, exotic=True)
armor('Interlocking Scale', 'Medium', 'Races of Stone', 158, 250, 4, 2, -6, 30, '20 ft.', '15 ft.', 30, exotic=True)
armor("Tumbler's Breastplate", 'Medium', 'Races of Stone', 158, 450, 5, 4, -4, 25, '20 ft.', '15 ft.', 30, exotic=True)
armor('Interlocking Plate', 'Heavy', 'Races of Stone', 158, 1750, 8, 0, -8, 40, '20 ft.', '15 ft.', 50, exotic=True)
armor('Battle Plate', 'Heavy', 'Races of Stone', 158, 2500, 9, 1, -7, 50, '20 ft.', '15 ft.', 125, exotic=True)
armor('Mountain Plate', 'Heavy', 'Races of Stone', 158, 3250, 10, 0, -9, 60, '15 ft.', '10 ft.', 225, exotic=True)
armor('Gnome Battle Cloak', 'Shield', 'Races of Stone', 158, 5, 1, None, 0, 0, None, None, 1, exotic=True, shield=True)
armor('Extreme Wooden Shield', 'Shield', 'Races of Stone', 158, 10, 3, None, -4, 15, None, None, 15, exotic=True, shield=True)
armor('Extreme Steel Shield', 'Shield', 'Races of Stone', 158, 30, 3, None, -4, 15, None, None, 25, exotic=True, shield=True)
armor('Gauntlet Shield', 'Shield', 'Races of Stone', 158, 50, 2, None, -2, 35, None, None, 20, exotic=True, shield=True)
armor("Rider's Shield", 'Shield', 'Races of Stone', 158, 75, 2, None, -2, 15, None, None, 15, exotic=True, shield=True)

def make_armor(a):
    isS = a['shield']
    tgt = 'ac.shield' if isS else 'ac.armor'
    pid = ('shd-' if isS else 'arm-') + slug(a['name'])
    cat = 'Shield' if isS else a['cat']
    statTxt = f"+{a['ac']} {'shield' if isS else 'armor'} bonus, max Dex {('+' + str(a['maxDex'])) if a['maxDex'] is not None else '—'}, armor check penalty {a['acp']}, arcane spell failure {a['asf']}%"
    short = f"{'Exotic ' if a['exotic'] else ''}{'shield' if isS else a['cat'].lower() + ' armor'} ({statTxt})." + (f" {a['note']}" if a['note'] else '')
    short = short[0].upper() + short[1:]
    tags = ['shield' if isS else 'armor', cat.lower()] + (['exotic'] if a['exotic'] else [])
    rec = {'id': pid, 'schemaVersion': 2, 'name': a['name'], 'type': 'Shield' if isS else 'Armor', 'category': cat,
           'slot': 'Off-Hand/Shield' if isS else 'Armor', 'source': f"{a['src']} p.{a['page']}", 'cost': a['cost'], 'weight': a['wgt'],
           'maxDex': a['maxDex'], 'checkPenalty': a['acp'], 'spellFailure': a['asf']}
    if not isS: rec.update(speed30=a['s30'], speed20=a['s20'])
    rec.update({'shortDescription': short, 'description': f'<p>{short}</p>', 'benefit': short, 'tags': tags,
                'modifiers': [{'target': tgt, 'value': a['ac'], 'formula': str(a['ac']), 'type': 'shield' if isS else 'armor', 'condition': None}],
                'damageParts': [], 'modes': [], 'ruleFlags': {'exoticArmor': True} if a['exotic'] else {}, 'combatModifiers': [],
                'tier': 'heroic', 'contentLevel': 'summary', 'verification': 'verified',
                'provenance': {'origin': 'rulebook', 'book': a['src'], 'page': a['page']}})
    return rec

jf_ids = {e['id'] for e in json.load(open(JFDB, encoding='utf-8'))}
recs = [make_weapon(w) for w in weapons.values()] + [make_armor(a) for a in A]
ids = [r['id'] for r in recs]
dup = {i for i in ids if ids.count(i) > 1}; clash = set(ids) & jf_ids
assert not dup, dup
assert not clash, clash
json.dump(recs, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(len([r for r in recs if r['type'] == 'Weapon']), 'weapons,', len([r for r in recs if r['type'] != 'Weapon']), 'armor/shields')
for r in recs[:3] + recs[-2:]: print(json.dumps({k: r[k] for k in ('id', 'name', 'category', 'source', 'shortDescription')}, ensure_ascii=False))
