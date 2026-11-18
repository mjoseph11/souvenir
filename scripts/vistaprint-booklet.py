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
import io

import fitz
import numpy as np
from PIL import Image

TRIM_W, TRIM_H = 8.5, 11.0
BLEED = 0.12
PT = 72

ap = argparse.ArgumentParser()
ap.add_argument("--inner", required=True, help="PDF of the inner pages, already at bleed size")
ap.add_argument("--front", default="images/cover-pilgrimage.jpg")
ap.add_argument("--back", default="images/back-cover-jubilee.jpg")
ap.add_argument("--out", required=True)
ap.add_argument("--spine", type=float, default=0.06,
                help="spine width in inches — take this from Vistaprint's template")
# Title down the spine, like the 2009 Consecration souvenir (Mathew, 17 Nov).
ap.add_argument("--spine-text",
                default="St. Gregorios Malankara Orthodox Church  ◆  Golden Jubilee Souvenir  ◆  1976 – 2026",
                help='text down the spine; "" for none')
ap.add_argument("--spine-font", default="fonts/EBGaramond-SemiBold.ttf")
a = ap.parse_args()

page_w, page_h = (TRIM_W + 2 * BLEED) * PT, (TRIM_H + 2 * BLEED) * PT
spread_w = (TRIM_W * 2 + a.spine + 2 * BLEED) * PT

out = fitz.open()

def with_bleed(path, spine_side):
    """The cover laid exactly on its 8.5 x 11 trim box, centred, never stretched:
    the bleed is the cover's own edge, mirrored outward, on the three sides
    that are cut. The spine side gets none, so the cover meets the spine."""
    im = Image.open(path).convert("RGB")
    dpi = im.width / TRIM_W
    b = round(BLEED * dpi)
    left, right = (b, 0) if spine_side == "right" else (0, b)
    arr = np.pad(np.asarray(im), ((b, b), (left, right), (0, 0)), mode="reflect")
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, "JPEG", quality=95, dpi=(dpi, dpi))
    return buf.getvalue()


# ── spread 1: outside cover ──
s1 = out.new_page(width=spread_w, height=page_h)
# back cover: its trim box is the left half, after the outer bleed
s1.insert_image(fitz.Rect(0, 0, (TRIM_W + BLEED) * PT, page_h),
                stream=with_bleed(a.back, "right"), keep_proportion=False)
# front cover: its trim box starts after the spine
s1.insert_image(fitz.Rect((TRIM_W + a.spine + BLEED) * PT, 0, spread_w, page_h),
                stream=with_bleed(a.front, "left"), keep_proportion=False)
# spine: carry the cover's cream across it so a misplaced fold shows no white
s1.draw_rect(fitz.Rect((TRIM_W + BLEED) * PT, 0, (TRIM_W + a.spine + BLEED) * PT, page_h),
             color=None, fill=(251 / 255, 242 / 255, 226 / 255))  # the covers' own edge cream

# Spine title: reads top to bottom (the US convention — legible with the book
# lying face up). Printers keep spine text 1/16in clear of each fold, so the type
# is sized to the spine; under 0.25in there is no room and it is left off.
SPINE_SAFE = 0.0625
MAROON, GOLD = (0.42, 0, 0), (0.79, 0.64, 0.15)
if a.spine_text and a.spine < 0.25:
    print(f"  spine {a.spine}in is under 0.25in: no spine text")
elif a.spine_text:
    font = fitz.Font(fontfile=a.spine_font)
    x0, x1 = (TRIM_W + BLEED) * PT, (TRIM_W + a.spine + BLEED) * PT
    size = min(14, (a.spine - 2 * SPINE_SAFE) * PT * 0.62)
    gap = 0.75 * PT  # clear of the head and tail trim
    length = page_h - 2 * (BLEED * PT + gap)
    while font.text_length(a.spine_text, size) > length and size > 6:
        size -= 0.25
    parts = a.spine_text.split("◆")
    words, marks = fitz.TextWriter(s1.rect), fitz.TextWriter(s1.rect)
    # Lay the line out horizontally, centred on the spine's midpoint, then turn it
    # 90 degrees clockwise about that point so it runs down the spine.
    cx, cy = (x0 + x1) / 2, page_h / 2
    total = font.text_length(a.spine_text, size)
    x = cx - total / 2
    base_y = cy + font.ascender * size * 0.36  # cap height centred across the spine
    for i, part in enumerate(parts):
        words.append((x, base_y), part, font=font, fontsize=size)
        x += font.text_length(part, size)
        if i < len(parts) - 1:
            w = font.text_length("◆", size)
            marks.append((x + w * 0.15, base_y - size * 0.05), "◆", font=font, fontsize=size * 0.7)
            x += w
    turn = (fitz.Point(cx, cy), fitz.Matrix(-90))
    words.write_text(s1, color=MAROON, morph=turn)
    marks.write_text(s1, color=GOLD, morph=turn)
    print(f"  spine text {size:.1f}pt")

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
