"""Collect "(Book pN)" references for class names from the crystalkeep 3.5 class indexes (Base + Prestige).
Usage: classidx_pages.py <Base.pdf> <Prestige.pdf> <classes_races.json> <out.json>
"""
import sys, re, json, collections
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
base, prc, cls_path, out = sys.argv[1:5]
text = ''
for p in (base, prc):
    d = pymupdf.open(p)
    text += ' '.join(d[i].get_text() for i in range(len(d))) + ' '
flat = re.sub(r'\s+', ' ', text.replace('’', "'"))
classes = [e for e in json.load(open(cls_path, encoding='utf-8')) if e.get('type') == 'Class']
res = {}
for e in classes:
    nm = re.sub(r'\s*\(.*?\)', '', e['name']).strip()
    hits = collections.Counter()
    for m in re.finditer(re.escape(nm) + r"\s*\(\s*([A-Za-z0-9&]+)\s*p\s?(\d+)\s*\)", flat, re.I):
        if not re.match(r'^(DR|DU)\d', m.group(1)): hits[(m.group(1), int(m.group(2)))] += 1
    res[e['id']] = {'name': nm, 'source': e.get('source'), 'refs': [[b, p, c] for (b, p), c in hits.most_common(4)]}
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in res.items():
    if not re.search(r'p\.?\s?\d', str(v['source'] or '')): print(k, '|', v['source'], '|', v['refs'])
