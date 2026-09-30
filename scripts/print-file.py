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
    page = out.new_page(width=PAGE_W, height=PAGE_H)
    page.show_pdf_page(fitz.Rect(0, 0, PAGE_W, PAGE_H), src, p.number)

out.save(out_path, deflate=True, garbage=4)
out.close()

# ── report ──
chk = fitz.open(out_path)
print(f"{chk.page_count} pages -> {out_path}")
print(f"page size: {chk[0].rect.width/72:.3f} x {chk[0].rect.height/72:.3f} in "
      f"(target {PAGE_W/72:.2f} x {PAGE_H/72:.2f})")

# Safety is measured from the trim line, which sits BLEED in from the sheet edge.
lo = (BLEED + SAFETY) * 72
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
