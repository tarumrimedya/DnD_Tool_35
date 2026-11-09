"""Parse the crystalkeep 3.5 class indexes (Prestige + Base) into per-class chassis rows.

Prestige index: a table, Name (blurb) (Book pN) | Minimum Requirements | Class Features (HD, Skill Points,
Attack, Good Save, Weap, Armor, Class Lvls) | Skills | 1st/2nd level features. Plain text extraction
interleaves the columns, so rows are rebuilt from word positions: every "HD:" word starts a row, the name
cell is the left column and the chassis is the column under "HD:".
Base index: "Name (Book pN) ... Class Features Alignment: ... Combat: <Class> Good Save: ... Hit-Die: dX ...
Skill Points: N" (base classes always have 20 levels).
Usage: p4_classidx.py <Prestige index.pdf> <Base index.pdf> <out.json>
"""
import sys, re, json
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
prc_pdf, base_pdf, out = sys.argv[1:4]
ATTACK = {'fighter': 'high', 'ftr': 'high', 'barbarian': 'high', 'paladin': 'high', 'ranger': 'high', 'warrior': 'high',
          'rogue': 'medium', 'cleric': 'medium', 'monk': 'medium', 'bard': 'medium', 'druid': 'medium', 'expert': 'medium',
          'wizard': 'low', 'sorcerer': 'low', 'psion': 'low', 'adept': 'low', 'commoner': 'low'}
saves_of = lambda s: [k for k in ('fort', 'ref', 'will') if k in s.lower()]
rows = []

doc = pymupdf.open(prc_pdf)
for pno in range(len(doc)):
    ws = doc[pno].get_text('words')
    anchors = sorted([w for w in ws if w[4] == 'HD:'], key=lambda w: w[1])
    for i, a in enumerate(anchors):
        x0, y0 = a[0], a[1] - 3
        y1 = anchors[i + 1][1] - 3 if i + 1 < len(anchors) else 760
        cell = lambda lo, hi: ' '.join(w[4] for w in sorted([w for w in ws if y0 <= w[1] < y1 and lo <= w[0] < hi], key=lambda w: (round(w[1]), w[0])))
        name_cell = cell(0, x0 - 110).replace('’', "'")
        feat_cell = cell(x0 - 5, x0 + 60)
        cite = re.findall(r"\(([A-Za-z0-9&]+)\s*p\.?\s*(\d+)\)", name_cell)
        name = re.split(r'\s*\(', name_cell, 1)[0].strip()
        m = re.search(r"HD:\s*d(\d+).*?Skill Points:\s*(\d+).*?Attack:\s*([A-Za-z]+).*?Good Saves?:\s*(.*?)\s*Weap:.*?Class Lvls:\s*(\d+)", feat_cell)
        if not m or not name:
            continue
        rows.append({'kind': 'prestige', 'name': re.sub(r'-\s+', '-', name), 'book': cite[0][0] if cite else None,
                     'page': int(cite[0][1]) if cite else None, 'hd': int(m.group(1)), 'skillPts': int(m.group(2)),
                     'attackAs': m.group(3), 'bab': ATTACK.get(m.group(3).lower()), 'goodSaves': saves_of(m.group(4)),
                     'maxLevel': int(m.group(5))})

doc = pymupdf.open(base_pdf)
flat = re.sub(r'\s+', ' ', ' '.join(doc[i].get_text() for i in range(len(doc))).replace('’', "'"))
start = flat.find('New Base Classes', flat.find('New Base Classes') + 20)  # skip the contents page
for m in re.finditer(r"([A-Z][A-Za-z'\-]+(?: [A-Z][A-Za-z'\-]+)*) \(([A-Za-z0-9&]+) p(\d+)\)(.{0,400}?)Class Features Alignment:[^C]{0,120}?"
                     r"Combat: ([A-Za-z]+) Good Saves?: (.*?) Hit-Die: d(\d+).{0,200}?Skill Points: (\d+)", flat[start:]):
    nm = m.group(1).replace('New Base Classes ', '').split()
    half = len(nm) // 2
    if len(nm) % 2 == 0 and nm[:half] == nm[half:]:  # "Favored Soul Favored Soul" (contents line + entry title)
        nm = nm[half:]
    rows.append({'kind': 'base', 'name': ' '.join(nm), 'book': m.group(2), 'page': int(m.group(3)), 'hd': int(m.group(7)),
                 'skillPts': int(m.group(8)), 'attackAs': m.group(5), 'bab': ATTACK.get(m.group(5).lower()),
                 'goodSaves': saves_of(m.group(6)), 'maxLevel': 20})
json.dump(rows, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(sum(r['kind'] == 'prestige' for r in rows), 'prestige;', sum(r['kind'] == 'base' for r in rows), 'base;',
      sum(1 for r in rows if not r['book']), 'without cite;', sum(1 for r in rows if not r['bab']), 'unknown attack')
