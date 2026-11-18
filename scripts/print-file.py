"""print-file.py — finish a bleed PDF so it matches the printer's spec exactly,
and report whether anything strays into the trim-safety margin.

Chrome lays the page out from CSS and rounds, so a sheet that should be
8.74 x 11.24 comes out 8.737 x 11.237. Vistaprint's preflight compares against
the template, so the box is squared up here rather than left a hair small.

Also measures the two things their instructions call out: 0.12in of bleed on
every side, and 0.2in of safety inside the trim line.

  python scripts/print-file.py build/in.pdf build/out.pdf
"""
import sys

import fitz

TRIM_W, TRIM_H = 8.5, 11.0
BLEED = 0.12
SAFETY = 0.2

PAGE_W = (TRIM_W + 2 * BLEED) * 72   # 629.28 pt
PAGE_H = (TRIM_H + 2 * BLEED) * 72   # 809.28 pt

src_path, out_path = sys.argv[1], sys.argv[2]
src = fitz.open(src_path)
out = fitz.open()

for p in src:
    # The two cover spreads (back | spine | front) are double width: keep their
    # own width, which vistaprint-booklet.py already set exactly from the spine.
    # Squaring them to one page squeezed the whole cover into 8.74in (18 Nov v3/v4).
    w = p.rect.width if p.rect.width > 1.5 * PAGE_W else PAGE_W
    page = out.new_page(width=w, height=PAGE_H)
    page.show_pdf_page(fitz.Rect(0, 0, w, PAGE_H), src, p.number, keep_proportion=False)

out.save(out_path, deflate=True, garbage=4)
out.close()

# ── report ──
chk = fitz.open(out_path)
print(f"{chk.page_count} pages -> {out_path}")
sizes = sorted({(round(p.rect.width / 72, 3), round(p.rect.height / 72, 3)) for p in chk}, reverse=True)
print("page sizes: " + ", ".join(f"{w:.3f} x {h:.3f} in ({sum(1 for p in chk if round(p.rect.width/72,3)==w)})" for w, h in sizes)
      + f"   (inner target {PAGE_W/72:.2f} x {PAGE_H/72:.2f})")

# Safety is measured from the trim line, which sits BLEED in from the sheet edge.
lo = (BLEED + SAFETY) * 72
# Measure glyph heights from the font size, not the font's declared ascender:
# static EB Garamond declares a tall one, which flagged unmoved titles (18 Nov).
fitz.TOOLS.set_small_glyph_heights(True)
worst = []
for p in chk:
    W, H = p.rect.width, p.rect.height
    for b in p.get_text("blocks"):
        x0, y0, x1, y1 = b[:4]
        m = min(x0 - lo, y0 - lo, (W - lo) - x1, (H - lo) - y1)
        if m < 0:
            worst.append((p.number + 1, round(m / 72, 3), (b[4] or "")[:34].replace("\n", " ")))

if worst:
    print(f"\n{len(worst)} text blocks inside the 0.2in safety line:")
    for pg, over, txt in sorted(worst, key=lambda r: r[1])[:12]:
        print(f"   p{pg}  {abs(over):.3f}in over   {txt!r}")
else:
    print("\nsafety: all text clears the 0.2in line")
chk.close()
