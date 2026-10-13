"""make-frame-bg.py — the four-corner leaf background for Manoj's 11 Oct page frame.

His ChatGPT mock-ups put leaf sprays in all four corners. Our 3000px artwork
(page-leaves-plain.jpg) only has them top-left and bottom-right, so the
missing two are mirrored across and laid in with "darker", which keeps the
cream paper untouched and only adds leaf where the copy has leaf.

  python scripts/make-frame-bg.py  ->  images/backgrounds/page-leaves-frame.jpg
"""
from PIL import Image, ImageChops, ImageFilter, ImageOps

SRC = "images/backgrounds/page-leaves-plain.jpg"
OUT = "images/backgrounds/page-leaves-frame.jpg"

bg = Image.open(SRC).convert("RGB")
W, H = bg.size

# a soft-edged mask so the mirrored corner fades out instead of leaving a seam
def corner_mask(w, h, corner):
    m = Image.new("L", (w, h), 0)
    px = m.load()
    for y in range(h):
        for x in range(w):
            dx = x / w if corner.endswith("l") else 1 - x / w
            dy = y / h if corner.startswith("t") else 1 - y / h
            d = (dx * dx + dy * dy) ** 0.5
            px[x, y] = int(255 * max(0.0, min(1.0, (1.0 - d) / 0.35)))
    return m

def lay(dst, patch, box, corner):
    w, h = patch.size
    region = dst.crop(box)
    dark = ImageChops.darker(region, patch)
    small = corner_mask(w // 10, h // 10, corner).resize((w, h)).filter(ImageFilter.GaussianBlur(20))
    dst.paste(Image.composite(dark, region, small), box)

cw, ch = int(W * 0.5), int(H * 0.36)
# top-left spray -> top-right
tl = bg.crop((0, 0, cw, ch))
lay(bg, ImageOps.mirror(tl), (W - cw, 0, W, ch), "tr")
# bottom-right spray -> bottom-left
br = bg.crop((W - cw, H - ch, W, H))
lay(bg, ImageOps.mirror(br), (0, H - ch, cw, H), "bl")

bg.save(OUT, quality=92)
print(OUT, bg.size)
