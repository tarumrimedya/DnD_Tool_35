"""Find the printed start page of class entries in text-layer rulebook PDFs.
A class starts on the first page whose text has the class name as an upper-case heading line
and "Hit Die" on that page or the next one. The printed page number is read from the page text.
Usage: class_pages_from_book.py <book.pdf> "Class A" "Class B" ...
"""
import sys, re
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')
doc = pymupdf.open(sys.argv[1])
texts = [doc[i].get_text() for i in range(len(doc))]
def printed(i):
    for t in (texts[i][:80], texts[i][-80:]):
        m = re.search(r'(?m)^\s*(\d{1,3})\s*$', t)
        if m: return int(m.group(1))
    return None
for name in sys.argv[2:]:
    up = name.upper()
    found = None
    for i, t in enumerate(texts):
        lines = [l.strip() for l in t.splitlines()]
        if any(l == up or l.replace('’', "'") == up for l in lines):
            nxt = t + (texts[i + 1] if i + 1 < len(texts) else '')
            if 'Hit Die' in nxt:
                found = (i + 1, printed(i)); break
    print(f'{name}: pdfPage={found[0] if found else None} printed={found[1] if found else None}')
