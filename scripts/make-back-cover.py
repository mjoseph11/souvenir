"""make-back-cover.py — the back cover with the jubilee "50" seal in place of
the parish seal (Mathew, 13 Oct 2026: "I want use a newer logo").

Starts from Ajo's back cover (images/back-cover-pilgrimage.jpg, 2550x3300),
paints the old seal out with the paper colour around it, and lays the jubilee
seal in the same spot, a little larger so it covers the old one's edge.

  python scripts/make-back-cover.py  ->  images/back-cover-jubilee.jpg
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = "images/back-cover-pilgrimage.jpg"
LOGO = "images/Logos/JubileeLogo1_Maroon_ver1.png"
OUT = "images/back-cover-jubilee.jpg"

CX, CY = 1274, 600        # old seal centre is (1274, 612); the new seal sits 12px higher
ERASE_R = 488             # old seal radius 449, plus its cross and shadow
SIZE = 930                # jubilee seal width on the page (its ribbon hangs lower than the old seal)

page = Image.open(SRC).convert("RGB")

# paper behind the old seal: the median colour of a ring just outside it
a = np.array(page).astype(float)
yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
rr = np.hypot(xx - CX, yy - CY)
ring = (rr > ERASE_R + 30) & (rr < ERASE_R + 70) & (yy > 60)
paper = tuple(int(v) for v in np.median(a[ring], axis=0))

mask = Image.new("L", page.size, 0)
ImageDraw.Draw(mask).ellipse((CX - ERASE_R, CY - ERASE_R - 20, CX + ERASE_R, CY + ERASE_R), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(14))
page = Image.composite(Image.new("RGB", page.size, paper), page, mask)

logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getbbox()).resize((SIZE, SIZE), Image.LANCZOS)
x, y = CX - SIZE // 2, CY - SIZE // 2

# soft drop shadow, as the old seal had
shadow = Image.new("RGBA", page.size, (0, 0, 0, 0))
alpha = logo.split()[3].point(lambda v: v * 0.35)
shadow.paste((70, 35, 0, 255), (x + 6, y + 14), alpha)
shadow = shadow.filter(ImageFilter.GaussianBlur(14))
out = Image.alpha_composite(page.convert("RGBA"), shadow)
out.alpha_composite(logo, (x, y))

out.convert("RGB").save(OUT, quality=95, dpi=(300, 300))
print(OUT, out.size, "paper", paper)
