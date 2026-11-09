"""Parse the crystalkeep D&D 3.5 Feats Index (2007-10-01) body into {name: [(book, page), ...], types}.

Entries look like:  Quick Reconnoiter [General, Scout] (CAdv p112) (CAdv p10)+
Usage: featidx_parse.py <DnD3.5Index-Feats.pdf> <out.json>
"""
import sys, re, json, collections
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
doc = pymupdf.open(sys.argv[1])
text = '\n'.join(doc[i].get_text() for i in range(9, len(doc)))
text = text.replace('’', "'")
# join wrapped lines so an entry header is on one line
flat = re.sub(r'\s*\n\s*', ' ', text)
rx = re.compile(r"([A-Z][A-Za-z'’,\-/ ()]+?)\s*\[([A-Za-z ,/\-]+)\]\s*((?:\(\s*[A-Za-z0-9&]+\s*p\s?\d+\s*\)\s*\+?\s*)+)")
out = collections.defaultdict(lambda: {'types': set(), 'refs': set()})
for m in rx.finditer(flat):
    name = re.sub(r'\s+', ' ', m.group(1)).strip()
    if len(name) > 60: continue
    for t in m.group(2).split(','): out[name]['types'].add(t.strip())
    for b, p in re.findall(r'\(\s*([A-Za-z0-9&]+)\s*p\s?(\d+)\s*\)', m.group(3)):
        out[name]['refs'].add((b, int(p)))
res = {n: {'types': sorted(v['types']), 'refs': sorted(v['refs'])} for n, v in out.items()}
json.dump(res, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('feat entries:', len(res))
print(collections.Counter(b for v in res.values() for b, _ in v['refs']).most_common(70))
