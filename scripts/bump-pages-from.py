"""Bump all PAGE comments and footer page numbers from a given start onwards.
Usage: python scripts/bump-pages-from.py <start_num> <delta>
  e.g. python scripts/bump-pages-from.py 6 1   # bump 6,7,8,... by +1
"""
import re
import sys
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / "index.html"

start_num = int(sys.argv[1])
delta = int(sys.argv[2])

content = PATH.read_text(encoding="utf-8")

page_re = re.compile(r"<!-- ═+\n     PAGE (\d+) — (.+?)\n═+ -->\n")
markers = list(page_re.finditer(content))

bc_re = re.compile(r"<!-- ═+\n     BACK COVER\n═+ -->")
bc_match = bc_re.search(content)
bc_start = bc_match.start()

pages = []
for i, m in enumerate(markers):
    s = m.start()
    e = markers[i + 1].start() if i + 1 < len(markers) else bc_start
    pages.append({"num": int(m.group(1)), "topic": m.group(2).strip(), "block": content[s:e]})

footer_re = re.compile(
    r"(<span>St\. Gregorios Malankara Orthodox Church</span>\s*\n\s*<span>)\d+(</span>\s*\n\s*<span>Golden Jubilee 1976–2026</span>)"
)

# Bump from highest down to avoid renumbering collisions in the regex (not strictly needed since each block is independent)
for p in pages:
    if p["num"] >= start_num:
        new_num = p["num"] + delta
        b = p["block"]
        b = re.sub(r"(<!-- ═+\n     )PAGE \d+( — )", rf"\1PAGE {new_num}\2", b)
        b = footer_re.sub(rf"\g<1>{new_num}\2", b)
        p["block"] = b
        print(f"  {p['num']:>2} -> {new_num:>2}  {p['topic']}")
    else:
        print(f"  {p['num']:>2}        {p['topic']} (unchanged)")

head = content[: markers[0].start()]
tail = content[bc_start:]
PATH.write_text(head + "".join(p["block"] for p in pages) + tail, encoding="utf-8")
print(f"Done. Bumped pages >= {start_num} by {delta:+d}.")
