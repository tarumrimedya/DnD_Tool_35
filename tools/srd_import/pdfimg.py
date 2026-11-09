"""Render PDF pages to PNG: pdfimg.py <pdf> <outdir> <page> [page...] [--zoom=1.6] [--clip=x0,y0,x1,y1 (fractions)]"""
import sys, os
import pymupdf
pdf, out = sys.argv[1], sys.argv[2]
zoom = 1.6; clip = None; pages = []
for a in sys.argv[3:]:
    if a.startswith('--zoom='): zoom = float(a[7:])
    elif a.startswith('--clip='): clip = [float(x) for x in a[7:].split(',')]
    else: pages.append(int(a))
os.makedirs(out, exist_ok=True)
doc = pymupdf.open(pdf)
for p in pages:
    pg = doc[p - 1]; r = pg.rect
    c = pymupdf.Rect(r.x0 + r.width * clip[0], r.y0 + r.height * clip[1], r.x0 + r.width * clip[2], r.y0 + r.height * clip[3]) if clip else None
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=c)
    fn = os.path.join(out, f'{os.path.splitext(os.path.basename(pdf))[0][:20].replace(" ", "_")}_p{p}.png')
    pix.save(fn); print(fn)
