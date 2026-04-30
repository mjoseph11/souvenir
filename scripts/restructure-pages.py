"""One-shot restructuring:
  - Move Charter Families to position 7 (after History)
  - Delete Family Greetings page entirely
  - Renumber all PAGE comments and footer spans accordingly
Run from the souvenir project root: python scripts/restructure-pages.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / "index.html"

content = PATH.read_text(encoding="utf-8")

# Find all PAGE markers
page_re = re.compile(r"<!-- ═+\n     PAGE (\d+) — (.+?)\n═+ -->\n")
markers = list(page_re.finditer(content))
assert markers, "no page markers found"

# Find BACK COVER marker (end of page region)
bc_re = re.compile(r"<!-- ═+\n     BACK COVER\n═+ -->")
bc_match = bc_re.search(content)
assert bc_match, "no back cover marker"
bc_start = bc_match.start()

head = content[: markers[0].start()]
tail = content[bc_start:]

# Slice page blocks
pages = []
for i, m in enumerate(markers):
    start = m.start()
    end = markers[i + 1].start() if i + 1 < len(markers) else bc_start
    pages.append({
        "old_num": int(m.group(1)),
        "topic": m.group(2).strip(),
        "block": content[start:end],
    })

print(f"Parsed {len(pages)} pages:")
for p in pages:
    print(f"  {p['old_num']:>2}  {p['topic']}")


def find(prefix):
    for p in pages:
        if p["topic"].startswith(prefix):
            return p
    raise ValueError(f"missing topic: {prefix}")


# Desired final order — Family Greetings removed, Charter Families moved to position 7
target = [
    find("COVER"),
    find("MESSAGE: CATHOLICOS"),
    find("MESSAGE: METROPOLITAN"),
    find("MESSAGE: VICAR"),
    find("IN MEMORIAM"),
    find("HISTORY"),
    find("CHARTER FAMILIES"),
    find("COMMUNITY OUTREACH"),
    find("EXECUTIVE COMMITTEE"),
    find("SUNDAY SCHOOL"),
    find("MGOCSM"),
    find("LOGOS MINISTRY"),
    find("GROW"),
    find("MARTH MARIAM"),
    find("GOOD SAMARITAN"),
    find("ST. JOSEPH"),
    find("PLATINUM SPONSOR"),
    find("GOLD SPONSOR"),
    find("MEMBER PAGE: MATHEWKUTTY KURIAN"),
]

deleted = [p for p in pages if p not in target]
print()
print(f"Deleting {len(deleted)} page(s):")
for p in deleted:
    print(f"  {p['old_num']:>2}  {p['topic']}")
print()
print(f"New order ({len(target)} pages):")
for new_num, p in enumerate(target, start=1):
    print(f"  was {p['old_num']:>2} -> now {new_num:>2}  {p['topic']}")

# Renumber each page block
footer_re = re.compile(
    r"(<span>St\. Gregorios Malankara Orthodox Church</span>\s*\n\s*<span>)\d+(</span>\s*\n\s*<span>Golden Jubilee 1976–2026</span>)"
)
for new_num, p in enumerate(target, start=1):
    block = p["block"]
    block = re.sub(
        r"(<!-- ═+\n     )PAGE \d+( — )",
        rf"\1PAGE {new_num}\2",
        block,
    )
    block = footer_re.sub(rf"\g<1>{new_num}\2", block)
    p["block_new"] = block

# Stitch together
output = head + "".join(p["block_new"] for p in target) + tail

PATH.write_text(output, encoding="utf-8")
print()
print(f"Wrote {PATH}")
