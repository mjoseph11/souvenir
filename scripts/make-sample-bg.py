"""make-sample-bg.py — the page background, taken from Manoj's ChatGPT sample.

Mathew asked (14 Oct 2026) for every inner page to follow Manoj's sample of
the Joys / Kuruvilla P. Kurian page (images/backgrounds/source/manoj-sample.png):
a maroon header band with leaves, a straight maroon footer band, gold rules
under both, and light leaf sprays top-left and bottom-right on cream paper.

The sample is a finished page, so everything that belongs to the page's
content is lifted out and the paper or band filled back in from around it:
the photo, headline, text, the title and seal in the header, the footer text.
The page's own title, seal and footer are laid back on top in CSS.

The sample is only 1102 x 1427 (~130 dpi), so the result is enlarged to
300 dpi. Leaves and paper are soft enough to survive that; text would not,
which is one more reason none is kept from it.

Writes two images, each with 0.12in bleed already on every side
(8.74 x 11.24in at 300 dpi), so the print build lines up exactly:
  images/backgrounds/page-sample.jpg      leaves, for every inner page
  images/backgrounds/page-sample-ad.jpg   bands only, plain paper (sponsor ads)
  images/backgrounds/page-sample-memorial.jpg  charcoal bands (in-memoriam pages)

  python scripts/make-sample-bg.py
"""
import numpy as np
from PIL import Image, ImageFilter

SRC = "images/backgrounds/source/manoj-sample.png"
OUT = "images/backgrounds/page-sample.jpg"
OUT_AD = "images/backgrounds/page-sample-ad.jpg"
OUT_MEM = "images/backgrounds/page-sample-memorial.jpg"
DPI, BLEED = 300, 0.12

im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float64)
H, W, _ = im.shape
lum = im.mean(axis=2)
r, g, b = im[..., 0], im[..., 1], im[..., 2]

# Bands, in sample pixels (measured): header band to the gold rule at ~100,
# footer gold rule from ~1338.
HEAD_END, FOOT_START = 106, 1336


def box_blur(a, rad):
    """Separable box blur via cumulative sums, edges clamped."""
    for axis in (0, 1):
        n = a.shape[axis]
        pad = [(0, 0)] * a.ndim
        pad[axis] = (rad + 1, rad)
        c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis)
        hi = np.take(c, np.arange(2 * rad + 1, 2 * rad + 1 + n), axis=axis)
        lo = np.take(c, np.arange(0, n), axis=axis)
        a = (hi - lo) / (2 * rad + 1)
    return a


def fill(region, hole, source=None):
    """Fill hole pixels from the pixels around them, finest scale first.
    source limits which pixels may be borrowed (e.g. paper only, not leaves)."""
    keep = (~hole if source is None else (~hole & source)).astype(np.float64)
    out = region.copy()
    done = ~hole
    for rad in (3, 8, 20, 50, 120, 300, 600):
        w = box_blur(box_blur(keep, rad), rad)
        est = np.stack([box_blur(box_blur(region[..., k] * keep, rad), rad) for k in range(3)], -1)
        ok = (w > (0.25 if rad < 600 else 1e-9)) & ~done
        out[ok] = est[ok] / w[ok, None]
        done |= ok
    return out


def dilate(m, n):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * n + 1))) > 0


def rect(y0, y1, x0, x1):
    m = np.zeros((H, W), bool)
    m[y0:y1, x0:x1] = True
    return m


# ── body: photo, headline, text ──
hole = rect(112, 852, 236, 866)                                  # photo, frame and its shadow
ink = (lum < 200) | ((r - b) > 75)                               # dark text, gold rule/diamond
hole |= rect(836, 962, 176, 922)                                  # headline
hole |= rect(962, 1304, 74, 944)                                  # two text columns + signature
hole |= dilate(rect(962, 1304, 944, 966) & ink, 4)                # their right edge, where leaves start
body = slice(HEAD_END, FOOT_START)
clean = im.copy()
# borrow only from clear paper: light and low in colour, so leaves never smear in
sat = im.max(axis=2) - im.min(axis=2)
paperlike = (lum > 222) & (sat < 45) & ~dilate(~((lum > 222) & (sat < 45)), 4)
clean[body] = fill(im[body], hole[body], paperlike[body])

# ── header: title, its rule and diamond, and the seal ──
gold = (r > 150) & (g > 90)
hh = rect(4, HEAD_END - 8, 352, 752)                               # title, its rule and diamond
maroon = (r < 175) & (g < 85) & (b < 85)                        # band only, never its gold rule
clean[:HEAD_END] = fill(im[:HEAD_END], hh[:HEAD_END], maroon[:HEAD_END])
# The seal sits on leaves at the right end of the band. Lay the left end of the
# band in, mirrored, so the right corner has leaves again; the seam fades over
# 40px so no edge shows.
SW, SEAM = 140, 40
patch = im[:HEAD_END - 8, :SW][:, ::-1]
a = np.clip(np.arange(SW) / SEAM, 0, 1)[None, :, None]
clean[:HEAD_END - 8, W - SW:] = clean[:HEAD_END - 8, W - SW:] * (1 - a) + patch * a

# ── footer: the three pieces of text and the short gold rules ──
F0, F1 = FOOT_START + 18, H - 6
fh = rect(F0, F1, 28, 386) | rect(F0, F1, 392, 712) | rect(F0, F1, 806, 1064)
clean[FOOT_START:] = fill(im[FOOT_START:], fh[FOOT_START:], maroon[FOOT_START:])

# ── a plain-paper version for ads: bands kept, body one even tone ──
paper = np.median(im[300:700, 860:900].reshape(-1, 3), axis=0)   # clear paper, right margin
ad = clean.copy()
ad[HEAD_END:FOOT_START + 2] = paper


def save(a, path):
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    tw, th = round(8.5 * DPI), round(11 * DPI)
    img = img.resize((tw, th), Image.LANCZOS)
    b = round(BLEED * DPI)
    full = np.pad(np.asarray(img), ((b, b), (b, b), (0, 0)), mode="reflect")
    Image.fromarray(full).save(path, quality=93, dpi=(DPI, DPI))
    print(path, full.shape[1], "x", full.shape[0])


# In-memoriam pages have always had charcoal bands in place of maroon.
mem = clean.copy()
for rows in (slice(0, HEAD_END - 7), slice(FOOT_START + 12, H)):
    grey = mem[rows].mean(axis=2, keepdims=True)
    mem[rows] = np.repeat(grey * 0.62 + 18, 3, axis=2)

save(clean, OUT)
save(ad, OUT_AD)
save(mem, OUT_MEM)
