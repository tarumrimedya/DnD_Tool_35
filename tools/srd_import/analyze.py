"""builder workbook v7.4.0.1 vs Joyful-Fermi database gap analysis."""
import sys, json, os, re, csv, collections
sys.stdout.reconfigure(encoding='utf-8')
WB, DB, FDB, CSVD, OUT = sys.argv[1:6]
C = collections.Counter

def load(n): return json.load(open(os.path.join(WB, n + '.json'), encoding='utf-8'))
def key(s):
    s = str(s or '').lower().replace('’', "'")
    s = re.sub(r'\[.*?\]|\(.*?\)', '', s)
    if ',' in s:  # "Axe, Throwing" -> "throwing axe"
        a, b = s.split(',', 1); s2 = b.strip() + ' ' + a.strip()
    else: s2 = s
    return re.sub(r'[^a-z0-9]', '', s2)
def keys(s):
    s0 = str(s or '').lower(); base = re.sub(r'[^a-z0-9]', '', re.sub(r'\[.*?\]|\(.*?\)', '', s0))
    return {key(s), base}
def clean(t):
    t = str(t or '').replace('×', '•').replace('', '•').strip()
    return re.sub(r'^:\s*', '', t)
BAD = {'0', '#N/A', '#VALUE!', '#REF!', ''}

R = {}
# ---------------- FEATS ----------------
feats = []; book = cat = None
for r in load('Feats'):
    if r['_r'] < 9: continue
    d = r.get('D')
    if not d: continue
    if r.get('AW') and r['AW'] not in BAD:
        feats.append({'name': d.strip(), 'prereq': clean(r.get('E', '')), 'summary': clean(r.get('F', '')),
                      'bonusFeatClasses': [x for x in r.get('H', '').split(',') if x and r.get('H') not in BAD],
                      'page': r.get('AS'), 'cite': r.get('AT'), 'src': r['AW'], 'section': cat, 'book': book,
                      'typeCode': r.get('AY'), 'row': r['_r']})
    else:
        if d.lower().endswith('feats') or 'feat' in d.lower(): cat = d.strip()
        else: book = d.strip()
R['feats'] = feats
# ---------------- FLAWS / TRAITS / TRICKS ----------------
flaws = [{'name': r['C'].strip(), 'src': (r.get('G', '') + ' ' + r.get('H', '')).strip(), 'summary': clean(r.get('I'))}
         for r in load('Flaws') if r['_r'] >= 5 and r.get('C') and r.get('I')]
traits = [{'name': r['C'].strip(), 'src': (r.get('I', '') + ' ' + r.get('J', '')).strip(), 'summary': clean(r.get('L'))}
          for r in load('Traits') if r['_r'] >= 4 and r.get('C') and r.get('L')]
tricks = [{'name': r['C'].strip(), 'prereq': r.get('D', ''), 'summary': clean(r.get('E')), 'category': r.get('F'), 'page': r.get('M')}
          for r in load('Skill_Tricks') if r['_r'] >= 5 and r.get('C') and r.get('E')]
R['flaws'], R['traits'], R['tricks'] = flaws, traits, tricks
# ---------------- CLASSES ----------------
classes = []; section = None
prog = lambda v: {'1': 'high', '0.75': 'medium', '0.5': 'low'}.get(v, v)
save = lambda v: {'0.5': 'high', '0.34': 'low'}.get(v, v)
ci = load('Class_Info'); hdr = next(r for r in ci if r['_r'] == 2)
skillcols = {k: v for k, v in hdr.items() if k != '_r' and re.match(r'^(A[I-Z]|B[A-Z]|C[A-Z]|D[A-J])$', k)}
for r in ci:
    if r['_r'] < 5: continue
    b = r.get('B', '')
    if b.startswith('–') or b.startswith('-'): section = b.strip('–- '); continue
    if not r.get('C') or not r.get('L'): continue
    classes.append({'name': b.strip(), 'abbr': r['C'], 'tla': r.get('D'), 'section': section, 'hd': r.get('L'), 'skillPts': r.get('K'),
                    'bab': prog(r.get('V')), 'fort': save(r.get('W')), 'ref': save(r.get('X')), 'will': save(r.get('Y')),
                    'src': r.get('DK'), 'lgStatus': r.get('DL'), 'prereq': clean(r.get('EC', '')),
                    'classSkills': [skillcols[k] for k in skillcols if r.get(k) == '2'],
                    'weaponProfs': r.get('U', '')})
R['classes'] = classes
variants = []; vcls = None
for r in load('Variants'):
    if r['_r'] < 4 or not r.get('C'): continue
    if not r.get('D') and not r.get('E'): vcls = r['C'].strip(); continue
    variants.append({'name': r['C'].strip(), 'class': vcls, 'prereq': r.get('D', ''), 'src': r.get('E', '')})
R['variants'] = variants
ca = load('Class_Abilities')
abil_heads = [r['A'] for r in ca if r.get('A', '').startswith('×') and re.match(r'^×\s*[^:]{2,60}:', r['A'])]
R['classAbilityHeads'] = len(abil_heads); R['classAbilityRows'] = len([r for r in ca if r.get('A')])
# ---------------- DOMAINS / DEITIES ----------------
domains = []
for r in load('Domains'):
    a = r.get('A')
    if not a or not r.get('C'): continue
    domains.append({'name': a.replace('xx-', '').replace('-xx', '').strip(), 'power': r.get('B', ''),
                    'spells': [r.get(c, '') for c in 'CDEFGHIJK']})
R['domains'] = domains
deities = [{'name': r['A'].strip(), 'alignment': r.get('B'), 'domains': r.get('I', ''), 'weapon': r.get('J')}
           for r in load('Deities') if r['_r'] >= 5 and r.get('A') and r.get('B') and r['A'] != 'Select A Deity']
R['deities'] = deities
# ---------------- MANEUVERS ----------------
mans = []; disc = None
for r in load('Maneuvers_Stances'):
    if r['_r'] < 6 or not r.get('D'): continue
    if not r.get('I'): disc = r['D'].strip(); continue
    mans.append({'name': r['D'].strip(), 'discipline': disc, 'level': r.get('I'), 'type': r.get('K'), 'page': r.get('AJ'), 'summary': clean(r.get('AK'))})
R['maneuvers'] = mans
# ---------------- GEAR ----------------
weapons = []
with open(os.path.join(CSVD, 'WeaponInfo.csv'), encoding='utf-8', errors='replace') as f:
    for row in csv.DictReader(f):
        n = row.get('Select A Weapon', '').strip()
        if n and not n.startswith('Select') and not n.startswith('-'): weapons.append(row)
R['weapons'] = weapons
armor = [{'name': r['H'].strip(), 'src': r.get('I'), 'material': r.get('J'), 'type': r.get('K'), 'ac': r.get('M'), 'maxDex': r.get('N'),
          'acp': r.get('O'), 'asf': r.get('P'), 'weight': r.get('Q')} for r in load('Armor')
         if r['_r'] >= 5 and r.get('H') and r.get('I') and r['I'] not in ('0', '1', 'Ref.', 'Armor Selected', 'Shield Selected')
         and not r['H'].startswith('–') and r.get('K')]
R['armor'] = armor
me = load('Magic_Equipment'); slotcols = ['U', 'Z', 'AE', 'AJ', 'AO', 'AT', 'AY', 'BD', 'BI', 'BN', 'BS']
slotnames = {c: next(r for r in me if r['_r'] == 1).get(c) for c in slotcols}
magic = []
for r in me:
    if r['_r'] < 3: continue
    for c in slotcols:
        v = r.get(c)
        if v and v != '(none)' and not v.startswith('--') and not v.startswith('Select'):
            magic.append({'name': v.strip(), 'slot': slotnames[c].replace(' Table', '')})
R['magicItems'] = magic
# ---------------- RACES / TEMPLATES / CREATURES ----------------
iface = load('Interfaces')
races = []
for r in iface:
    e = r.get('E')
    if e and r['_r'] > 3 and not e.startswith('Select') and 'Custom' not in e:
        m = re.match(r'^(.*?)\s*\[(.*?)\]\s*$', e)
        races.append({'name': (m.group(1) if m else e).strip(), 'src': m.group(2) if m else ''})
R['races'] = races
tmpl = [r['A'].strip() for r in load('Template_Info') if r['_r'] >= 4 and r.get('A') and r['A'] not in ('Acquired Templates', 'Inherited Template')]
tmpl = [t for t in tmpl if t not in ('Template*', 'Custom Template') and not t.startswith('Select')]
R['templates'] = tmpl
crt = [{'name': r['A'].strip(), 'type': r.get('D'), 'src': r.get('BM'), 'fam': r.get('BH'), 'comp': r.get('BI')}
       for r in load('Creature_Info') if r['_r'] >= 7 and r.get('A') and r.get('C')]
R['creatures'] = crt
with open(os.path.join(CSVD, 'CreatureInfo.csv'), encoding='utf-8', errors='replace') as f:
    R['creatureCsv'] = [row for row in csv.DictReader(f) if row.get('Race') and not row['Race'].startswith('Select')]
# ---------------- MISC ----------------
R['buffs'] = [r['A'] for r in load('Buffs') if r.get('A') and r['_r'] > 2 and not re.match(r'^\d|Buff', r['A'])]
R['classBuffs'] = [r['L'] for r in load('Buffs') if r.get('L') and r['_r'] > 1 and r.get('M') is not None]
R['condPenalties'] = [r['V'] for r in load('Buffs') if r.get('V') and r['_r'] > 1]
R['marshalAuras'] = [r.get(c) for r in load('Marshal_Auras') if r['_r'] >= 4 for c in 'BE' if r.get(c)]
R['vestiges'] = [r['Q'] for r in load('Binder_Vestiges') if r['_r'] >= 8 and r.get('Q')]
R['soulmelds'] = [r['A'] for r in load('SoulmeldsInfo') if r['_r'] >= 7 and r.get('A') and not r['A'].startswith('Select') and not r['A'].startswith('You do not')]
R['grafts'] = [r['C'] for r in load('Grafts') if r['_r'] >= 5 and r.get('C') and r.get('G') and r['G'] not in BAD]
R['casterClasses'] = [r['A'] for r in load('Spell_Info') if r['_r'] >= 4 and r.get('A') and r.get('G')]
srcs = {}
for r in load('Sources'):
    for nc, ac in (('C', 'H'), ('J', 'O'), ('Q', 'V')):
        if r.get(nc) and r.get(ac, '').startswith('('): srcs[r[ac].strip('()')] = r[nc]
R['sources'] = srcs

# ================= JOYFUL-FERMI =================
jf = []
for fn in os.listdir(DB):
    if not fn.endswith('.json') or fn in ('srd_index.json', 'lego_patterns.json', 'srd_companions.json'): continue
    d = json.load(open(os.path.join(DB, fn), encoding='utf-8'))
    for e in (d if isinstance(d, list) else []): e['_file'] = fn; jf.append(e)
comp = json.load(open(os.path.join(DB, 'srd_companions.json'), encoding='utf-8'))
types = C((e['_file'], e.get('type'), e.get('category') if e.get('type') in ('Class', 'Feat') else '') for e in jf)
def kset(pred):
    s = {}
    for e in jf:
        if pred(e):
            for k in keys(e.get('name')) | {kk for a in (e.get('aliases') or []) for kk in keys(a)}: s.setdefault(k, e)
    return s
J = {
 'feat': kset(lambda e: e['_file'] == 'srd_feats.json'),
 'class': kset(lambda e: e.get('type') == 'Class'),
 'race': kset(lambda e: e.get('type') == 'Race'),
 'spell': kset(lambda e: e['_file'] == 'srd_spells.json'),
 'man': kset(lambda e: e['_file'] == 'srd_maneuvers.json'),
 'dom': kset(lambda e: e['_file'] == 'srd_domains.json'),
 'wpn': kset(lambda e: e['_file'] == 'srd_equipment.json' and e.get('type') == 'Weapon'),
 'arm': kset(lambda e: e['_file'] == 'srd_equipment.json' and e.get('type') in ('Armor', 'Shield')),
 'item': kset(lambda e: e['_file'] in ('mic_compendium.json', 'srd_equipment.json')),
 'mon': kset(lambda e: e['_file'] == 'srd_monsters.json'),
 'tmpl': kset(lambda e: e['_file'] == 'srd_templates.json'),
 'rule': kset(lambda e: e['_file'] == 'srd_combat_rules.json'),
 'any': kset(lambda e: True),
}
def hit(name, *cats):
    for c in cats:
        for k in keys(name):
            if k in J[c]: return J[c][k]
    return None

# ================= FOUNDRY DND DB =================
def nedb(n):
    out = []
    p = os.path.join(FDB, n)
    if not os.path.exists(p): return out
    for line in open(p, encoding='utf-8', errors='replace'):
        line = line.strip()
        if line:
            try: out.append(json.loads(line))
            except Exception: pass
    return out
F = {n: nedb(n + '.db') for n in ['feats', 'spells', 'magic-items', 'classes', 'class-abilities', 'enhancements', 'commonbuffs',
                                  'conditions', 'racialfeatures', 'templates', 'weapons-and-ammo', 'armors-and-shields', 'materials', 'powers']}
FK = {n: {k for e in v for k in keys(e.get('name'))} for n, v in F.items()}
def fhit(name, n): return bool(keys(name) & FK[n])

# ================= REPORT =================
S = {}
def gap(label, items, getname, cats, fdb=None):
    have = [i for i in items if hit(getname(i), *cats)]
    new = [i for i in items if not hit(getname(i), *cats)]
    newF = [i for i in new if fdb and fhit(getname(i), fdb)]
    S[label] = {'wb': len(items), 'inJF': len(have), 'netNew': len(new), 'netNewWithFoundryText': len(newF) if fdb else None,
                'sampleNew': [getname(i) for i in new[:12]]}
    return have, new

fh, fn_ = gap('Feats', feats, lambda i: i['name'], ['feat'], 'feats')
gap('Flaws', flaws, lambda i: i['name'], ['feat'], 'feats')
gap('Traits', traits, lambda i: i['name'], ['feat'], 'feats')
gap('Skill Tricks', tricks, lambda i: i['name'], ['feat', 'any'], 'feats')
base = [c for c in classes if c['section'] is None or 'prestige' not in (c['section'] or '').lower()]
prc = [c for c in classes if c not in base]
gap('Base Classes', base, lambda i: i['name'], ['class'], 'classes')
gap('Prestige Classes', prc, lambda i: i['name'], ['class'], 'classes')
gap('Class Variants / ACFs', variants, lambda i: i['name'], ['any'], 'class-abilities')
gap('Domains', domains, lambda i: i['name'], ['dom'])
gap('Maneuvers & Stances', mans, lambda i: i['name'], ['man'])
gap('Weapons (WeaponInfo.csv)', weapons, lambda i: i['Select A Weapon'], ['wpn', 'item'], 'weapons-and-ammo')
gap('Armor & Shields', armor, lambda i: i['name'], ['arm', 'item'], 'armors-and-shields')
gap('Magic Equipment (slot tables)', magic, lambda i: i['name'], ['item'], 'magic-items')
gap('Races / Creatures (Interfaces)', races, lambda i: i['name'], ['race', 'mon'], 'racialfeatures')
gap('Templates', tmpl, lambda i: i, ['tmpl'], 'templates')
gap('Companion/Familiar Creatures', crt, lambda i: i['name'], ['mon'])
gap('Buff Spells (Buffs)', R['buffs'], lambda i: i, ['spell', 'rule'], 'commonbuffs')
gap('Conditional Penalties', R['condPenalties'], lambda i: i, ['rule', 'spell'], 'conditions')
gap('Marshal Auras', R['marshalAuras'], lambda i: i, ['any'])
gap('Binder Vestiges', R['vestiges'], lambda i: i, ['any'])
gap('Soulmelds', R['soulmelds'], lambda i: i, ['any'])
gap('Grafts', R['grafts'], lambda i: i, ['any'], 'magic-items')
dspells = sorted({s.split(',')[0].strip() for d in domains for s in d['spells'] if s and s not in BAD})
gap('Domain-referenced Spells', dspells, lambda i: i, ['spell'], 'spells')
gap('Deities', deities, lambda i: i['name'], ['any'])

# feats by source
fsrc = C(f['src'] for f in feats); fsec = C(f['section'] for f in feats)
fnew_src = C(f['src'] for f in fn_)
# enrichment on matched feats
enr = C()
for f in fh:
    e = hit(f['name'], 'feat')
    src = str(e.get('source', ''))
    if not re.search(r'p\.?\s*\d|\d{2,3}', src): enr['sourcePageMissing'] += 1
    if not e.get('prereqStruct') and f['prereq'] and f['prereq'].lower() != 'none': enr['prereqStructMissing'] += 1
    if f['prereq'] and not (e.get('prereq') or e.get('prerequisites')): enr['prereqTextMissing'] += 1
    wbFtr = 'Ftr' in f['bonusFeatClasses']
    if wbFtr != bool(e.get('isFighterBonusFeat')): enr['fighterFlagMismatch'] += 1; enr.setdefault('_ftrSamples', [])
    if f['bonusFeatClasses']: enr['hasBonusFeatClassTags'] += 1
ftr_mis = [f['name'] + (' (WB=Ftr)' if 'Ftr' in f['bonusFeatClasses'] else ' (JF=Ftr)') for f in fh
           if ('Ftr' in f['bonusFeatClasses']) != bool(hit(f['name'], 'feat').get('isFighterBonusFeat'))][:25]
# classes enrichment
cenr = C(); cmis = []
for c in classes:
    e = hit(c['name'], 'class')
    if not e: continue
    cenr['matched'] += 1
    nb = lambda v: {'med': 'medium', 'good': 'high', 'poor': 'low', 'full': 'high', 'average': 'medium', 'avg': 'medium'}.get(str(v).lower(), str(v).lower())
    e = dict(e); e['hitDie'] = str(e.get('hitDie', '')).lstrip('d'); e['babProgression'] = nb(e.get('babProgression')) if e.get('babProgression') else None
    e['savingThrows'] = {k: nb(v) for k, v in (e.get('savingThrows') or {}).items()}
    if e.get('hitDie') and str(e['hitDie']) != str(c['hd']): cenr['hdMismatch'] += 1; cmis.append(f"{c['name']}: HD JF={e['hitDie']} WB={c['hd']}")
    if e.get('babProgression') and e['babProgression'] != c['bab']: cenr['babMismatch'] += 1; cmis.append(f"{c['name']}: BAB JF={e['babProgression']} WB={c['bab']}")
    sv = e.get('savingThrows') or {}
    for s in ('fort', 'ref', 'will'):
        if sv.get(s) and sv[s] != c[s]: cenr['saveMismatch'] += 1; cmis.append(f"{c['name']}: {s} JF={sv[s]} WB={c[s]}")
    if e.get('skillPointsPerLevel') and str(e['skillPointsPerLevel']) != str(c['skillPts']): cenr['skillPtsMismatch'] += 1; cmis.append(f"{c['name']}: SP JF={e['skillPointsPerLevel']} WB={c['skillPts']}")
    if not e.get('classSkills'): cenr['classSkillsMissing'] += 1
    if not re.search(r'\d', str(e.get('source', ''))): cenr['sourcePageMissing'] += 1
    if e.get('category') == 'Prestige' and not (e.get('prereqStruct') or e.get('prerequisites') or e.get('prereq')): cenr['prcPrereqMissing'] += 1
mm = C(); mmis = []
for m in mans:
    e = hit(m['name'], 'man')
    if e:
        if str(e.get('level')) != str(m['level']): mm['levelMismatch'] += 1; mmis.append(f"{m['name']}: L JF={e.get('level')} WB={m['level']}")
        if m['discipline'] and e.get('discipline') and key(e['discipline']) != key(m['discipline']): mm['discMismatch'] += 1; mmis.append(f"{m['name']}: {e.get('discipline')} vs {m['discipline']}")
dom_spell_missing = [s for s in dspells if not hit(s, 'spell')]

fk = C(key(f['name']) for f in feats)
res = {'featUnique': len(fk), 'featDupNames': [k for k, v in fk.items() if v > 1][:30], 'featDupCount': sum(1 for v in fk.values() if v > 1),
       'featNetNewUnique': len({key(f['name']) for f in fn_}),
       'jfOddFeatNames': [e['name'] for e in jf if e['_file'] == 'srd_feats.json' and re.search(r'^--|--$|\(|\[', e['name'])][:20],
       'summary': S, 'featsBySource': fsrc.most_common(), 'featsNetNewBySource': fnew_src.most_common(), 'featsBySection': fsec.most_common(),
       'featEnrichment': {k: v for k, v in enr.items() if not k.startswith('_')}, 'fighterFlagMismatchSamples': ftr_mis,
       'classEnrichment': dict(cenr), 'classMismatchSamples': cmis[:40], 'maneuverMismatch': dict(mm), 'maneuverMismatchSamples': mmis[:20],
       'classesBySection': C(c['section'] for c in classes).most_common(), 'classesBySource': C(c['src'] for c in classes).most_common(),
       'classAbilityHeads': R['classAbilityHeads'], 'classAbilityRows': R['classAbilityRows'],
       'variantsBySource': C(v['src'] for v in variants).most_common(), 'racesBySource': C(r['src'] for r in races).most_common(),
       'armorBySource': C(a['src'] for a in armor).most_common(), 'weaponsBySource': C(w.get('Source') for w in weapons).most_common(),
       'magicBySlot': C(m['slot'] for m in magic).most_common(), 'tricksByCat': C(t['category'] for t in tricks).most_common(),
       'domainSpellsMissing': dom_spell_missing, 'sources': srcs, 'jfTypeCounts': [[*k, v] for k, v in types.most_common()],
       'foundryCounts': {n: len(v) for n, v in F.items()}, 'casterClasses': len(R['casterClasses']),
       'creatureCsvRows': len(R['creatureCsv']), 'creatureCsvByCat': C(r.get('Category') for r in R['creatureCsv']).most_common(),
       'deityCount': len(deities), 'mojibakeFeats': sum(1 for f in feats if re.search(r'[-]|â€|Ã', f['summary'] + f['prereq']))}
os.makedirs(OUT, exist_ok=True)
json.dump(res, open(os.path.join(OUT, 'gap_report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(R, open(os.path.join(OUT, 'source_extracted.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(json.dumps(res, ensure_ascii=False, indent=1)[:60000])
