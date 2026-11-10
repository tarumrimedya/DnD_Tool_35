"""Stream-parse builder workbook xlsm into per-sheet JSON row dumps (col letter -> value)."""
import sys, zipfile, json, re, os
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
z = zipfile.ZipFile(src)

strings = []
with z.open('xl/sharedStrings.xml') as f:
    for ev, el in ET.iterparse(f):
        if el.tag == NS + 'si':
            strings.append(''.join(t.text or '' for t in el.iter(NS + 't')))
            el.clear()

wb = ET.fromstring(z.read('xl/workbook.xml'))
rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
rmap = {r.get('Id'): r.get('Target') for r in rels}
sheets = []
for s in wb.iter(NS + 'sheet'):
    tgt = rmap[s.get(RNS + 'id')]
    tgt = tgt.lstrip('/')
    if not tgt.startswith('xl/'): tgt = 'xl/' + tgt
    sheets.append((s.get('name'), s.get(RNS + 'id'), tgt))

only = set(sys.argv[3:])
index = []
for name, rid, path in sheets:
    fn = re.sub(r'[^A-Za-z0-9]+', '_', name)
    rows = []
    if only and fn not in only and '*' not in only:
        index.append({'name': name, 'rid': rid, 'path': path}); continue
    with z.open(path) as f:
        for ev, el in ET.iterparse(f):
            if el.tag == NS + 'row':
                r = {'_r': int(el.get('r'))}
                for c in el.iter(NS + 'c'):
                    ref = c.get('r'); col = re.match(r'[A-Z]+', ref).group(0)
                    t = c.get('t'); v = c.find(NS + 'v')
                    if t == 's' and v is not None: val = strings[int(v.text)]
                    elif t == 'inlineStr':
                        val = ''.join(x.text or '' for x in c.iter(NS + 't'))
                    elif v is not None: val = v.text
                    else: continue
                    if val not in (None, ''): r[col] = val
                if len(r) > 1: rows.append(r)
                el.clear()
    json.dump(rows, open(os.path.join(out, fn + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    index.append({'name': name, 'rid': rid, 'path': path, 'rows': len(rows), 'file': fn + '.json'})
json.dump(index, open(os.path.join(out, '_index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for i in index: print(i)
