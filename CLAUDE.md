# SGMOC Golden Jubilee Souvenir — Claude Instructions

## Project Overview
This repo contains the Golden Jubilee souvenir for **St. Gregorios Malankara Orthodox Church (SGMOC)**,
Bensalem, PA. It is a single HTML file (`index.html`) designed to be printed as a PDF or viewed online.

**Live site:** https://mjoseph11.github.io/souvenir/
**GitHub repo:** https://github.com/mjoseph11/souvenir
**Issues tracker:** https://github.com/mjoseph11/souvenir/issues

---

## Repository Structure

```
/
├── index.html                  # Main souvenir (all pages)
├── CLAUDE.md                   # This file
├── .nojekyll                   # Skips Jekyll — keeps Pages deployment fast
├── .gitignore                  # Excludes .claude/ folder
├── images/
│   ├── jubilee-logo.png        # Original jubilee logo (superseded — no longer used in index.html)
│   ├── official-logo.png       # Original SGMOC seal (superseded — no longer used in index.html)
│   ├── jubilee-logo-gold.png   # Gold jubilee logo variant (available, not currently used)
│   ├── catholicos.jpg          # H.H. Baselios Marthoma Mathews III
│   ├── metropolitan.jpg        # His Grace Zachariah Mar Nicholovos
│   ├── vicar.jpg               # Rev. Fr. Shibu Venad Mathai
│   ├── mathai-cor-episcopa.jpg # V. Rev. K. Mathai Cor Episcopa (In Memoriam)
│   ├── st-gregorios.webp       # St. Geevarghese Gregorios of Parumala
│   ├── logo.jpg                # Original Logo 3 from contest (superseded)
│   ├── church-header.png       # SGMOC website header banner (unused, kept for reference)
│   ├── committee/              # Executive committee member photos (18 files)
│   └── Logos/                  # High-res transparent logos from Google Drive
│       ├── JubileeLogo1_Maroon_ver1.png   # ✅ ACTIVE — cover + back cover
│       ├── JubileeLogo1_Maroon_ver2.png   # Alt maroon version (lighter, available for comparison)
│       ├── SGMOC_Official_logo_Gold.png   # ✅ ACTIVE — all page headers (CSS background-image)
│       └── ...                            # Other variants (blue, white, etc.)
├── compare.html                # Logo comparison page — ver1 vs ver2 side by side (dev tool)
└── scripts/
    ├── rebuild-committee.js    # Node script: rebuilds committee page HTML
    ├── rebuild-ministries.js   # Node script: rebuilds all ministry pages HTML
    └── create-feedback-form.gs # Google Apps Script: creates feedback Google Form
```

---

## Souvenir Page Structure (15 pages + back cover)

| Page | Content | Status |
|------|---------|--------|
| Cover (p1) | Jubilee logo (3.2in), Golden Jubilee title, psalm verse, sgmoc.org | ✅ |
| p2 | Message — H.H. Baselios Marthoma Mathews III (Catholicos) | Placeholder text |
| p3 | Message — His Grace Zachariah Mar Nicholovos (Metropolitan) | Placeholder text |
| p4 | Message — Rev. Fr. Shibu Venad Mathai (Vicar) | Placeholder text |
| p5 | **In Memoriam** — V. Rev. Kaleeckal Mathai Cor Episcopos (founding vicar, d. Oct 12 2023) | ✅ Needs family verification (#18) |
| p6 | History — stat callouts + narrative + visual gold timeline | ✅ Needs verification (#18) |
| p7 | Executive Committee 2026 (Vicar + 4 exec + 6 board + 10 committee) | ✅ Photos embedded |
| p8 | Sunday School | Leadership ✅ (Principal/Dean/Registrar), photos + expansion needed (#5) |
| p9 | MGOCSM / Youth League | Leadership ✅ from website, needs 2026 verification (#13) |
| p10 | Logos Ministry (new young adult ministry) | VP/Sec/Treasurer TBD (#14) |
| p11 | GROW — God Renewing Orthodox Women | Leader ✅, Sec/Treasurer TBD (#15) |
| p12 | Marth Mariam Vanitha Samajam | Leadership ✅, needs verification (#16) |
| p13 | Good Samaritan Mission | Coordinator TBD (#17) |
| p14 | Advertisements (sponsor pages) | Placeholder — deferred (#6) |
| p15 | Family Greetings | Placeholder |
| Back | Back cover — jubilee logo, address, service times | ✅ |

---

## Key People & Titles

| Person | Title | Page |
|--------|-------|------|
| Baselios Marthoma Mathews III | His Holiness, Catholicos of the East & Malankara Metropolitan | p2 |
| Zachariah Mar Nicholovos | His Grace, Metropolitan, Northeast American Diocese | p3 |
| Rev. Fr. Shibu Venad Mathai | Vicar, SGMOC | p4 |
| V. Rev. Kaleeckal Mathai Cor Episcopos | Founding Vicar (1976–2011), fell asleep Oct 12 2023 | p5 |
| Dr. Sherrin Kurien | Principal, Sunday School | p8 |
| Dr. Renny Thomas | Dean, Sunday School | p8 |
| Dr. Ajeesh Cherian | Registrar, Sunday School | p8 |
| Joanna Maret | Vice President, MGOCSM | p9 |
| Sruthy Mammen | Secretary, MGOCSM | p9 |
| Joshua Phillip | Joint Secretary, MGOCSM | p9 |
| Angela Babu | Treasurer, MGOCSM | p9 |
| Soumia Varghese | Ministry Leader, GROW | p11 |
| Reny Biju | Secretary, MMS | p12 |
| Christeena Poovathoor | Joint Secretary, MMS | p12 |
| Mercy Varkey | Treasurer, MMS | p12 |
| Annamma Samuel | Central Committee Member, MMS | p12 |

---

## Executive Committee 2026 (Page 7)

**Vicar:** Rev. Fr. Shibu Venad Mathai

| Role | Name |
|------|------|
| Secretary | Mathew Kurian |
| Joint Secretary | Santosh Ninan |
| Treasurer | Reji Ninan |
| Joint Treasurer | Manoj Chacko |

**Board:** Jessy Mathai, Joseph Abraham, Lee K. George, Raju Varghese, Thomas Joseph, Yohannan Mathai

**Committee:** Ajo Maret, Alex Thankachan, Arun Philip, Biju Mani, Nithin Maret, Paul J. Maret, Shainey Jacob, Suchin Thompson, Sumod Abraham, Thomas Paul

---

## Open Issues (as of 2026-04-10)

| # | Title | Blocker |
|---|-------|---------|
| #5 | Ministries: expand to 1–4 pages each | Sunday School needs 2+ pages; all ministries need photos & content |
| #6 | Sponsorship layout | Deferred — revisit closer to print |
| #13 | MGOCSM leadership — verify 2026 | Need confirmation from ministry |
| #14 | Logos Ministry — VP, Secretary, Treasurer | Need names from Vicar |
| #15 | GROW — Secretary, Treasurer | Need names |
| #16 | MMS — verify all names | Need confirmation |
| #17 | Good Samaritan — Coordinator name | Need name |
| #18 | In Memoriam + History — verify accuracy | Needs someone who knew V. Rev. K. Mathai |
| #19 | Jubilee logo — finalize ver1 vs ver2 | Manoj to decide; ver1 currently live, ver2 available |

**Recently closed:** #20 (gold transparent header seal — done)

---

## Issue Management — IMPORTANT

**Do NOT close issues prematurely.** An issue is only truly closed when:
- All named action items in the issue body are completed
- Not just the "easy" part — the full scope

Past example of premature closure: #5 (Ministries) was closed after creating 1-page shells,
but Manoj's feedback explicitly asked for 1–4 pages per ministry with Sunday School getting more.
Issue was reopened after review.

When in doubt, leave open with a comment explaining what remains.

---

## Design

- **Theme:** Maroon (`#6B0000`) and Gold (`#C9A227`)
- **Page size:** US Letter (8.5 × 11 in)
- **Font:** Georgia (serif)
- **To export PDF:** Open `index.html` in Chrome → Ctrl+P → Save as PDF → Margins: None, Background graphics: ON
- **Page headers:** Gold transparent SGMOC seal (`images/Logos/SGMOC_Official_logo_Gold.png`) via CSS `background-image` on all inner page headers
- **In Memoriam page:** Uses dark (`#2a2a2a`) header/footer to distinguish from regular pages

---

## Workflow

1. Edit `index.html` locally or via GitHub web editor
2. Commit and push → GitHub Pages auto-deploys in ~30 seconds (`.nojekyll` skips Jekyll)
3. Track all pending content via https://github.com/mjoseph11/souvenir/issues
4. Use scripts in `/scripts/` for rebuilding complex sections (run from project root with `node scripts/rebuild-xxx.js`)

## Feedback Collection
Google Form created via `scripts/create-feedback-form.gs`.
Run once in Google Apps Script (script.google.com) to generate shareable form link.

---

## Church Info

- **Full name:** St. Gregorios Malankara Orthodox Church
- **Address:** 4136 Hulmeville Road, Bensalem, PA 19020
- **Website:** www.sgmoc.org
- **Diocese:** Northeast American Diocese, Malankara Orthodox Syrian Church
- **Patron Saint:** St. Geevarghese Gregorios of Parumala
- **Sunday Services:** Matins 8:30 AM · Holy Qurbana 9:30 AM · Sunday School 12:30 PM
- **Jubilee years:** 1976–2026
- **Original name (1976–1984):** St. Thomas Orthodox Church
- **Previous location:** 7721–31 Torresdale Avenue, Philadelphia, PA 19136 (1995–2008)

---

## Parish History Summary

| Year | Event |
|------|-------|
| 1976 | Founded as St. Thomas Orthodox Church by V. Rev. K. Mathai Cor Episcopos — first liturgy at St. Savior Cathedral Chapel, Philadelphia |
| 1984 | Renamed St. Gregorios Malankara Orthodox Church |
| 1995 | Moved to own building — 7721 Torresdale Ave, Philadelphia |
| 2008 | Relocated to 4136 Hulmeville Rd, Bensalem (Christmas Day) |
| 2009 | Consecrated by H.G. Mathews Mar Barnabas (May 2009) |
| 2011 | Rev. Fr. Shibu Venad Mathai appointed Vicar (June 2011) |
| 2016 | Good Samaritan Mission established |
| 2023 | V. Rev. K. Mathai Cor Episcopos fell asleep — October 12, 2023 |
| 2026 | Golden Jubilee |
