"""vistaprint-booklet.py — assemble a perfect-bound print file to Vistaprint's spec.

From their "Perfect-Bound Booklets Print File Instructions" (Manoj, 2026-09-30):

  * 2 double-page cover spreads first, then single inner pages in reading order
  * every file carries 4 cover pages; unprinted inside covers still go in, blank
  * 8.5 x 11 trimmed -> 8.74 x 11.24 with 0.12in bleed
  * important content 0.2in inside the trim line

The outside spread reads back-cover | spine | front-cover, because once the
sheet is wrapped round the block the right-hand half lands on the front.

SPINE WIDTH IS A GUESS UNTIL THE TEMPLATE SAYS OTHERWISE. It depends on the
final page count and the paper, and Vistaprint generate it in the template you
download for your exact specs. Pass --spine to match it.

  python scripts/vistaprint-booklet.py --inner build/inner.pdf --out build/vp.pdf --spine 0.06
"""
import argparse

import fitz

TRIM_W, TRIM_H = 8.5, 11.0
BLEED = 0.12
PT = 72

ap = argparse.ArgumentParser()
ap.add_argument("--inner", required=True, help="PDF of the inner pages, already at bleed size")
ap.add_argument("--front", default="images/cover-pilgrimage.jpg")
ap.add_argument("--back", default="images/back-cover-pilgrimage.jpg")
ap.add_argument("--out", required=True)
ap.add_argument("--spine", type=float, default=0.06,
                help="spine width in inches — take this from Vistaprint's template")
a = ap.parse_args()

page_w, page_h = (TRIM_W + 2 * BLEED) * PT, (TRIM_H + 2 * BLEED) * PT
spread_w = (TRIM_W * 2 + a.spine + 2 * BLEED) * PT

out = fitz.open()

# ── spread 1: outside cover ──
s1 = out.new_page(width=spread_w, height=page_h)
# back cover fills the left half plus the left and outer bleed
s1.insert_image(fitz.Rect(0, 0, (TRIM_W + BLEED) * PT, page_h), filename=a.back)
# front cover fills the right half plus the right bleed
s1.insert_image(fitz.Rect((TRIM_W + a.spine + BLEED) * PT, 0, spread_w, page_h), filename=a.front)
# spine: carry the cover's cream across it so a misplaced fold shows no white
s1.draw_rect(fitz.Rect((TRIM_W + BLEED) * PT, 0, (TRIM_W + a.spine + BLEED) * PT, page_h),
             color=None, fill=(0.992, 0.973, 0.933))

# ── spread 2: inside cover, left blank as the instructions allow ──
s2 = out.new_page(width=spread_w, height=page_h)
s2.draw_rect(s2.rect, color=None, fill=(1, 1, 1))

# ── inner pages, single, in reading order ──
inner = fitz.open(a.inner)
for p in inner:
    pg = out.new_page(width=page_w, height=page_h)
    pg.show_pdf_page(fitz.Rect(0, 0, page_w, page_h), inner, p.number)

out.save(a.out, deflate=True, garbage=4)
print(f"{a.out}")
print(f"  2 cover spreads  {spread_w/PT:.3f} x {page_h/PT:.3f} in   (spine {a.spine}in)")
print(f"  {inner.page_count} inner pages    {page_w/PT:.3f} x {page_h/PT:.3f} in")
print(f"  {out.page_count} sheets in the file")
