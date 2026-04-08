# SGMOC Golden Jubilee Souvenir — Claude Instructions

## Project Overview
This repo contains the Golden Jubilee souvenir for **St. Gregorios Malankara Orthodox Church (SGMOC)**,
Bensalem, PA. It is a single-page HTML file (`index.html`) designed to be printed as a PDF or viewed online.

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
├── images/
│   ├── logo.jpg                # SGMOC Logo 3 (Golden Jubilee logo)
│   ├── catholicos.jpg          # H.H. Baselios Marthoma Mathews III
│   ├── metropolitan.jpg        # His Grace Zachariah Mar Nicholovos
│   ├── vicar.jpg               # Rev. Fr. Shibu Venad Mathai
│   ├── st-gregorios.webp       # St. Geevarghese Gregorios of Parumala (back cover)
│   ├── church-header.png       # SGMOC website header (unused, kept for reference)
│   └── committee/              # Executive committee member photos (18 files)
└── scripts/
    ├── rebuild-committee.js    # Node script: rebuilds committee page HTML
    ├── rebuild-ministries.js   # Node script: rebuilds all ministry pages HTML
    └── create-feedback-form.gs # Google Apps Script: creates feedback Google Form
```

---

## Souvenir Page Structure

| Page | Content | Status |
|------|---------|--------|
| Cover (p1) | Logo, church name, Golden Jubilee 1976–2026, psalm verse, sgmoc.org | ✅ |
| p2 | Message — H.H. Baselios Marthoma Mathews III (Catholicos) | Placeholder text |
| p3 | Message — His Grace Zachariah Mar Nicholovos (Metropolitan) | Placeholder text |
| p4 | Message — Rev. Fr. Shibu Venad Mathai (Vicar) | Placeholder text |
| p5 | History & Milestones | Placeholder dates |
| p6 | Executive Committee 2026 (Vicar + 4 exec + 6 board + 10 committee) | ✅ Photos embedded |
| p7 | Sunday School | Leadership ✅, photos needed |
| p8 | MGOCSM / Youth League | Leadership ✅, photos needed |
| p9 | Logos Ministry (new young adult ministry) | VP/Sec/Treasurer TBD |
| p10 | GROW — God Renewing Orthodox Women | Sec/Treasurer TBD |
| p11 | Marth Mariam Vanitha Samajam | Leadership ✅, photos needed |
| p12 | Good Samaritan Mission | Coordinator TBD |
| p13 | Advertisements (sponsor pages) | Placeholder |
| p14 | Family Greetings | Placeholder |
| Back | Back cover — St. Gregorios image, address, service times | ✅ |

---

## Key People & Titles

| Person | Title | Page |
|--------|-------|------|
| Baselios Marthoma Mathews III | His Holiness, Catholicos of the East & Malankara Metropolitan | p2 |
| Zachariah Mar Nicholovos | His Grace, Metropolitan, Northeast American Diocese | p3 |
| Rev. Fr. Shibu Venad Mathai | Vicar, SGMOC | p4 |
| Dr. Sherrin Kurien | Principal, Sunday School | p7 |
| Dr. Renny Thomas | Dean, Sunday School | p7 |
| Dr. Ajeesh Cherian | Registrar, Sunday School | p7 |
| Soumia Varghese | GROW Ministry Leader | p10 |

---

## Design

- **Theme:** Maroon (`#6B0000`) and Gold (`#C9A227`)
- **Page size:** US Letter (8.5 × 11 in)
- **Font:** Georgia (serif)
- **To export PDF:** Open `index.html` in Chrome → Ctrl+P → Save as PDF → Margins: None, Background graphics: ON

---

## Workflow

1. Edit `index.html` locally or via GitHub web editor
2. Commit and push → GitHub Pages auto-deploys in ~30 seconds
3. Open issues at https://github.com/mjoseph11/souvenir/issues to track pending content
4. Reference scripts in `/scripts/` for rebuilding complex sections

## Feedback Collection
Google Form created via `scripts/create-feedback-form.gs`.
Run once in Google Apps Script (script.google.com) to generate the form.

---

## Church Info

- **Full name:** St. Gregorios Malankara Orthodox Church
- **Address:** 4136 Hulmeville Road, Bensalem, PA 19020
- **Website:** www.sgmoc.org
- **Diocese:** Northeast American Diocese, Malankara Orthodox Syrian Church
- **Patron Saint:** St. Geevarghese Gregorios of Parumala
- **Sunday Services:** Matins 8:30 AM · Holy Qurbana 9:30 AM · Sunday School 12:30 PM
- **Jubilee years:** 1976–2026
