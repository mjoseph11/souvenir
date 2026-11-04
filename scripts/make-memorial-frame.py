"""make-memorial-frame.py — the memorial panel frame, from Manoj's artwork.

Manoj sent the frame on 4 Nov 2026 (WhatsApp, 1600 x 533, cream version kept as
images/backgrounds/source/memorial-frame-manoj.jpg): a gold double rule with
scrolled corners, pale leaves at the left, a white lily with gold and green
sprays at the bottom right.

It is 3:1; the memorial panel in his Joys sample is about 2.3:1 (2.4 here: as far as the blank paper allows once the margin outside the rule is cut off). Stretching it
would squash the lily, so instead two blank stretches of paper between the
leaves are cut narrower (x 242-495 and 760-983 are plain paper and rules),
with a short cross-fade at each seam so the paper's grain does not show a line.

Writes images/backgrounds/memorial-frame.jpg. Enlarged 2x so the browser and
the PDF never upsample it themselves; at 7.3in wide it is ~170 dpi of real
detail, which the soft watercolour carries.

Usage: python scripts/make-memorial-frame.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'images/backgrounds/source/memorial-frame-manoj.jpg'
OUT = ROOT / 'images/backgrounds/memorial-frame.jpg'
RATIO = 2.4
# (start, end) of the blank strips, and how much of each to cut
STRIPS = [(242, 495), (760, 983)]
FADE = 12
# the outer gold rule; the paper outside it is cut off so the panel ends at the frame
CROP = (21, 27, 1579, 507)  # left, top, right, bottom in the source


def cut(img, x0, x1, fade):
    """Drop columns x0..x1, cross-fading `fade` columns across the seam.
    The fade overlaps the two sides, so the result is (x1 - x0) + fade narrower."""
    left, right = img[:, :x0], img[:, x1:]
    w = np.linspace(0, 1, fade)[None, :, None]
    seam = left[:, -fade:] * (1 - w) + right[:, :fade] * w
    return np.concatenate([left[:, :-fade], seam, right[:, fade:]], axis=1)


img = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
h, w, _ = img.shape
l, t, r, b = CROP
remove = (r - l) - round((b - t) * RATIO)
room = [s1 - s0 - 2 * FADE for s0, s1 in STRIPS]
assert 0 < remove <= sum(room), (remove, room)
# share the cut between the strips by their size; cut the later one first so
# the earlier one's coordinates still hold
shares = [round(remove * r / sum(room)) for r in room]
shares[-1] = remove - sum(shares[:-1])
for (s0, s1), n in reversed(list(zip(STRIPS, shares))):
    mid = (s0 + s1) // 2
    n -= FADE  # the cross-fade itself takes FADE columns
    img = cut(img, mid - n // 2, mid - n // 2 + n, FADE)

img = img[t:b, l:img.shape[1] - (w - r)]
out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS)
out.save(OUT, quality=92)
print(f'{OUT.relative_to(ROOT)}: {out.width} x {out.height} ({out.width / out.height:.2f}:1)')
