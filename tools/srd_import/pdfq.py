"""PDF query helper.
  search: pdfq.py search <pdf> <regex> [ctx=200] [max=10]
  pages:  pdfq.py pages <pdf> <start> <end>          (1-based PDF page index)
  info:   pdfq.py info <pdf>                          (page count + text-layer check)
"""
import sys, re
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
mode, path = sys.argv[1], sys.argv[2]
doc = pymupdf.open(path)
if mode == 'info':
    sample = [len(doc[i].get_text()) for i in range(0, len(doc), max(1, len(doc) // 10))]
    print('pages', len(doc), 'textchars per sample page', sample)
elif mode == 'pages':
    a, b = int(sys.argv[3]), int(sys.argv[4])
    for i in range(a - 1, min(b, len(doc))):
        print(f'===== PDF PAGE {i + 1} =====')
        print(doc[i].get_text())
elif mode == 'search':
    rx = re.compile(sys.argv[3], re.I)
    ctx = int(sys.argv[4]) if len(sys.argv) > 4 else 200
    mx = int(sys.argv[5]) if len(sys.argv) > 5 else 10
    n = 0
    for i, pg in enumerate(doc):
        t = pg.get_text()
        for m in rx.finditer(t):
            s = t[max(0, m.start() - ctx): m.end() + ctx].replace('\n', ' ')
            print(f'[p{i + 1}] ...{s}...')
            n += 1
            if n >= mx: sys.exit()
