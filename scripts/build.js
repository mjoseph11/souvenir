#!/usr/bin/env node
/**
 * build.js — assembles index.html from source files. Do not edit index.html by hand.
 *
 *   src/styles.css, src/members.css  page styles
 *   src/pages/*.html                  hand-built pages (messages, history, ministries, …)
 *   data/outline.json                 section order, following Manoj's "SGMOC Content Outline"
 *   data/members.json                 member & memorial pages, rendered from the blocks below
 *   data/sponsors.json                sponsor ads, all together at the end of the book
 *
 * Page numbers, the PAGE comments and the Index pages are generated here.
 *
 * Run:  node scripts/build.js && node scripts/check-verified.js
 * Layout check (overflow, broken images):  node scripts/check-layout.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
// Headings are set large, so they get book typography: a curly apostrophe,
// and an em dash that stays on the line with the word before it.
const heading = (s) => esc(String(s ?? '').replace(/(\w)'(\w)/g, '$1\u2019$2').replace(/\s+\u2014\s*/g, '\u202f\u2014 '));
// Text fields in the JSON are plain text: paragraphs separated by a blank line.
const paragraphs = (t) =>
  (Array.isArray(t) ? t : String(t ?? '').split(/\n\s*\n/)).map((s) => s.trim()).filter(Boolean);
const lines = (t) =>
  (Array.isArray(t) ? t : String(t ?? '').split('\n')).map((s) => s.trim()).filter(Boolean);

const PAGE_NO = '@@PAGE@@';
const DARK = '#2a2a2a';
const FOOTER_NO = /(<span>St\. Gregorios Malankara Orthodox Church<\/span>\s*<span>)(?:\d+|@@PAGE@@)(<\/span>)/;
const INDEX_LINES_PER_PAGE = 84;

/* ── Page shell shared by every generated page ── */

function footer(dark) {
  return `  <div class="page-footer"${dark ? ` style="background:${DARK};"` : ''}>
    <span>St. Gregorios Malankara Orthodox Church</span>
    <span>${PAGE_NO}</span>
    <span>Golden Jubilee 1976 &ndash; 2026</span>
  </div>`;
}

function shell({ title, band, dark, body, cls, badge }) {
  const bg = dark ? ` style="background:${DARK};"` : '';
  const classes = ['page', 'inner-page', 'm-page', band ? 'has-band' : '', cls].filter(Boolean).join(' ');
  return `<div class="${classes}">
  <div class="page-header"${bg}>
    <div class="page-header-title">
      <h1${dark ? ' style="color:var(--gold2);"' : ''}>${esc(title)}</h1>
    </div>
  </div>
${band ? `  <div class="m-band"${bg}>${band}</div>\n` : ''}${badge ? `  <div class="m-badge">${esc(badge)}</div>\n` : ''}  <div class="m-content">
${body}
  </div>
${footer(dark)}
</div>
`;
}

/* ── Content blocks used by members.json ── */

function figure(p, alt) {
  const photo = typeof p === 'string' ? { src: p } : p;
  const style = photo.pos ? ` style="object-position:${esc(photo.pos)}"` : '';
  // A two-line caption is a name over dates (memorial portraits).
  const capLines = photo.caption ? lines(photo.caption) : [];
  const cap = capLines.length > 1
    ? `<figcaption><span class="cap-name">${esc(capLines[0])}</span><span class="cap-dates">${capLines.slice(1).map(esc).join('<br>')}</span></figcaption>`
    : photo.caption ? `<figcaption>${esc(photo.caption)}</figcaption>` : '';
  // "flex": share of the row's width. Set it to each photo's width/height so a
  // row of photos comes out all the same height (Beena, 20 Nov).
  const flex = photo.flex ? ` style="flex-grow:${Number(photo.flex)}"` : '';
  return `<figure class="m-fig"${flex}><img src="${esc(photo.src)}" alt="${esc(photo.alt || alt)}"${style}>${cap}</figure>`;
}

const BLOCKS = {
  heading: (b) => `<h2 class="m-heading">${esc(b.text)}</h2>`,
  subheading: (b) => `<p class="m-subheading">${esc(b.text)}</p>`,
  photos(b, ctx) {
    const figs = (b.photos || []).map((p) => figure(p, ctx.alt));
    const grow = b.grow ? ` style="flex-grow:${Number(b.grow)}"` : '';
    const plain = b.plain ? ' plain' : '';
    // "fill": crop the photo to cover its box instead of letterboxing it.
    // Only where cropping loses nobody — see the note in members.css.
    // "whole": as big as the box allows but never cropped or framed - for signed
    // documents (dignitaries' letters, Manoj 18 Nov: "maximize the size").
    const fill = b.whole ? ' fill whole plain' : b.fill ? ' fill' : '';
    // "mosaic": one wide photo across the top, then a tall photo on the left
    // with the rest stacked down the right (Manoj's James Chacko sample, 15 Nov).
    if (b.arrange === 'mosaic' && figs.length >= 3) {
      return `<div class="m-photos mosaic${plain}${fill}"${grow}><div class="m-hero">${figs[0]}</div><div class="m-row"><div class="m-mosaic-left">${figs[1]}</div><div class="m-mosaic-right">${figs.slice(2).join('')}</div></div></div>`;
    }
    if (figs.length >= 3 && b.arrange !== 'row') {
      return `<div class="m-photos hero${plain}${fill}"${grow}><div class="m-hero">${figs[0]}</div><div class="m-row">${figs.slice(1).join('')}</div></div>`;
    }
    const stack = b.arrange === 'stack' ? ' stack' : '';
    return `<div class="m-photos${stack}${plain}${fill}"${grow}>${figs.join('')}</div>`;
  },
  // Photo at the top left with the writing flowing below it and down the
  // right column. Manoj: "picture on the top left, writing maybe starts
  // below and whole right side … Like inline".
  article(b, ctx) {
    // Short pieces: one column, with a big photo on the left and the writing
    // beside it. Two narrow columns would leave the lower half of the page bare.
    const short = String(b.text ?? '').length < 1300 && ctx.soloArticle;
    const cls = ['m-article', b.span && 'span-title', short && 'wide-photo', b.size && `size-${b.size}`].filter(Boolean).join(' ');
    // "photoMax": cap the photo's height (e.g. "3.9in") when it would run into the closing line
    let fig = b.photo ? figure(b.photo, ctx.alt) : '';
    if (b.photoMax) fig = fig.replace('<img ', `<img style="max-height:${esc(b.photoMax)}" `);
    const title = b.title ? `<h2 class="m-article-title">${heading(b.title)}</h2>` : '';
    const body = paragraphs(b.text).map((p) => `<p>${esc(p)}</p>`).join('');
    const sign = b.sign ? `<p class="m-sign">&mdash; ${esc(b.sign)}</p>` : '';
    return `<div class="${cls}">${b.span ? title + fig : fig + title}${body}${sign}</div>`;
  },
  text(b) {
    const cls = ['m-text', b.cols && 'cols', b.poem && 'poem', b.lang && `lang-${b.lang}`, b.size && `size-${b.size}`, b.center && 'center', b.italic && 'italic', b.bold && 'bold', b.bare && 'bare', b.balance && 'balance']
      .filter(Boolean)
      .join(' ');
    const title = b.title ? `<p class="m-text-title">${heading(b.title)}</p>` : '';
    // "lines": keep the line breaks inside each paragraph (poems, hymns).
    // "poem": also keeps each stanza whole and each line unwrapped.
    const fmt = (p) => (b.lines ? lines(p).map(esc).join('<br>') : esc(p));
    const body = paragraphs(b.text).map((p) => `<p>${fmt(p)}</p>`).join('');
    const sign = b.sign ? `<p class="m-sign">&mdash; ${esc(b.sign)}</p>` : '';
    // "lang": e.g. "ml" for Malayalam, which sets wider than English at the same size.
    const lang = b.lang ? ` lang="${esc(b.lang)}"` : '';
    return `<div class="${cls}"${lang}>${title}${body}${sign}</div>`;
  },
  list(b) {
    const title = b.title ? `<p class="m-text-title">${heading(b.title)}</p>` : '';
    // "bare": no white panel or gold rule round it, same switch the text block has.
    const cls = ['m-text', 'center', b.bare && 'bare'].filter(Boolean).join(' ');
    return `<div class="${cls}">${title}<ul class="m-list">${lines(b.items).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
  },
  side(b, ctx) {
    const body = paragraphs(b.text).map((p) => `<p>${esc(p)}</p>`).join('');
    const grow = b.grow ? ` style="flex-grow:${Number(b.grow)}"` : '';
    // "plain": an ordinary block of writing beside the photos (not the short
    // italic caption), with "photos" stacked down a narrow column of "width".
    if (b.plain) {
      const figs = (b.photos || [b.photo]).map((ph) => figure(ph, ctx.alt)).join('');
      const w = b.width ? ` style="flex:0 0 ${esc(b.width)}"` : '';
      const title = b.title ? `<p class="m-text-title">${heading(b.title)}</p>` : '';
      return `<div class="m-side plain"${grow}><div class="m-photos stack"${w}>${figs}</div><div class="m-text bare">${title}${body}</div></div>`;
    }
    return `<div class="m-side"${grow}><div class="m-photos">${figure(b.photo, ctx.alt)}</div><div class="m-text center italic bare">${body}</div></div>`;
  },
  names: (b) => `<p class="m-names">${lines(b.text).map(esc).join('<br>')}</p>`,
  verse: (b) =>
    `<p class="m-verse${b.big ? ' big' : ''}">&ldquo;${esc(b.text)}&rdquo;${b.ref ? `<br><span>&mdash; ${esc(b.ref)}</span>` : ''}</p>`,
  memorial: (b) =>
    `<div class="m-memorial-head">${b.eyebrow === false ? '' : `<p class="m-eyebrow">${lines(b.eyebrow || 'In Loving Memory').map(esc).join('<br>')}</p>`}<h2>${lines(b.name).map(esc).join('<br>')}</h2>${
      b.dates ? `<p class="m-dates">${esc(b.dates)}</p>` : ''
    }<div class="m-rule"></div></div>`,
  eternal: (b) => `<p class="m-eternal">${lines(b.text || 'May Their Memory Be Eternal').map(esc).join('<br>')}</p>`,
  closing: () => `<p class="m-closing">Celebrating SGMOC&rsquo;s Golden Jubilee &bull; 1976&ndash;2026</p>`,
  half: (b, ctx) => `<section class="m-half${b.dark ? ' dark' : ''}${b.big ? ' big' : ''}${b.wide ? ' wide' : ''}${b.smallName ? ' small-name' : ''}${b.oneLineName ? ' one-line-name' : ''}${b.clearLily ? ' clear-lily' : ''}${b.lilies ? ' lilies' : ''}"${b.grow ? ` style="flex-grow:${Number(b.grow)}"` : ''}>\n${renderBlocks(b.blocks, ctx)}\n    </section>`,
  rule: () => `<div class="m-rule"></div>`,
};

function renderBlocks(blocks, ctx) {
  return (blocks || [])
    .map((b) => {
      const render = BLOCKS[b.type];
      if (!render) throw new Error(`${ctx.id}: unknown block type "${b.type}"`);
      return '    ' + render(b, ctx);
    })
    .join('\n');
}

/* ── Manoj's page style (STYLE=manoj) ──
   Photo-only family pages: main photo faded into the page, the rest as tilted
   prints, short phrases in script beside them, a verse at the foot. Photos are
   never cropped: every box is sized to its photo's own shape. */

// The page style is the souvenir's own style now (Manoj approved it, 18 Sept).
// STYLE=off builds the earlier look.
const STYLE = process.env.STYLE !== 'off';
// BLEED=1 builds the printer's file instead: 8.74 x 11.24 with 0.12in bleed
// on every side, per Vistaprint's perfect-bound spec. Written to a separate
// file so index.html, preview-style.html and the family proofs stay Letter.
const BLEED = process.env.BLEED === '1';
const PHRASES = STYLE ? readJSON('data/phrases.json').phrases.filter((p) => p.use !== false) : [];
const VERSES = [
  ['As for me and my house, we will serve the Lord.', 'Joshua 24:15'],
  ['Unless the Lord builds the house, the builders labor in vain.', 'Psalm 127:1'],
  ['The Lord has done great things for us, and we are filled with joy.', 'Psalm 126:3'],
  ['Give thanks to the Lord, for he is good; his love endures forever.', 'Psalm 107:1'],
  ['Children are a heritage from the Lord.', 'Psalm 127:3'],
  ['Every good and perfect gift is from above.', 'James 1:17'],
  ['Let all that you do be done in love.', '1 Corinthians 16:14'],
  ['Love one another deeply, from the heart.', '1 Peter 1:22'],
];

const hash = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};

// Width / height as displayed, honouring JPEG EXIF orientation.
const aspectCache = new Map();
function photoAspect(src) {
  if (aspectCache.has(src)) return aspectCache.get(src);
  const b = fs.readFileSync(path.join(root, src));
  let w = 1, h = 1, turn = false;
  if (b[0] === 0x89) { w = b.readUInt32BE(16); h = b.readUInt32BE(20); }
  else {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const mk = b[i + 1], len = b.readUInt16BE(i + 2);
      if (mk === 0xe1 && b.toString('ascii', i + 4, i + 8) === 'Exif') {
        const t = i + 10, le = b.toString('ascii', t, t + 2) === 'II';
        const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
        const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
        const ifd = t + u32(t + 4);
        for (let k = 0; k < u16(ifd); k++) {
          const e = ifd + 2 + k * 12;
          if (u16(e) === 0x0112) turn = u16(e + 8) >= 5;
        }
      }
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; }
      i += 2 + len;
    }
  }
  const a = turn ? h / w : w / h;
  aspectCache.set(src, a);
  return a;
}

const inch = (n) => `${n.toFixed(2)}in`;

function styledBody(m, pg) {
  const W = 7.5, H = 9.35;
  const photos = pg.blocks.filter((b) => b.type === 'photos').flatMap((b) => b.photos).map((p) => (typeof p === 'string' ? { src: p } : p));
  const mainAt = Math.min(m.mainPhoto || 0, photos.length - 1);
  const main = photos[mainAt];
  // "collage": up to six prints in two rows under the main photo
  const sides = photos.filter((_, i) => i !== mainAt).slice(0, m.collage ? 6 : 3);
  const half = Math.ceil(sides.length / 2);
  const rowsOf = sides.length > 3 ? [sides.slice(0, half), sides.slice(half)] : [sides];
  const two = rowsOf.length > 1;
  const names = pg.blocks.find((b) => b.type === 'names');
  const given = pg.blocks.find((b) => b.type === 'verse');
  const [vText, vRef] = given ? [given.text, given.ref] : VERSES[hash(m.id) % VERSES.length];

  // "phrases": false on a family — no script words beside the photo, and the
  // photo takes the room they would have used.
  const noWords = m.phrases === false;
  const h = hash(m.id);
  const p1 = PHRASES[h % PHRASES.length];
  // second phrase: a different one, and never the same script word as the first
  let j = (h + 1 + (h >>> 8) % (PHRASES.length - 1)) % PHRASES.length;
  while (PHRASES[j].script === p1.script) j = (j + 1) % PHRASES.length;
  const p2 = PHRASES[j];
  // the small capitals under it shrink too ("UNDERSTANDING" ran into the photo, 12 Nov)
  const capsFit = (l, w) => {
    const pt = Math.min(10, Math.floor(((w * 0.9) / (l.length * 0.0118)) * 10) / 10);
    return pt < 10 ? ` style="font-size:${pt}pt;letter-spacing:1px"` : '';
  };
  // the script word shrinks to fit its column ("Community" ran off the page, 12 Nov)
  const words = (p, x, y, w, size = 30) => {
    size = Math.min(size, Math.floor((w * 0.92) / (p.script.length * 0.0082)));
    return `<div class="s-words" style="left:${inch(x)};top:${inch(y)};width:${inch(w)}"><span class="s-script" style="font-size:${size}pt">${esc(p.script)}</span>${p.lines.map((l) => `<span class="s-caps"${capsFit(l, w)}>${esc(l)}</span>`).join('')}<i class="s-rule"></i></div>`;
  };
  // A photo's "caption" sits under it; "straight": true keeps a print untilted.
  const img = (p, cls, x, y, w, hgt, rot) =>
    `<figure class="${cls}" style="left:${inch(x)};top:${inch(y)};width:${inch(w)};height:${inch(hgt)}${rot ? `;transform:rotate(${rot}deg)` : ''}"><img src="${esc(p.src)}" alt="${esc(m.title)}">${p.caption ? `<figcaption class="s-cap">${esc(p.caption)}</figcaption>` : ''}</figure>`;

  // "layout": "stagger" — four photos in a staggered 2 x 2 with the verse under
  // the bottom-left one (Mikhaila Mammen's layout, 11 Nov). Slots are where her
  // mock-up puts each photo: centre x, top, and the height it may take.
  if (m.layout === 'stagger' && photos.length === 4) {
    const slots = [[2.40, 0.45, 4.45, 3.13], [5.50, 0.94, 3.66, 2.57], [2.22, 5.05, 2.39, 3.79], [5.53, 4.81, 3.44, 2.41]];
    const figs = photos.map((p, i) => {
      const k = 0.88; // the stage is shorter than her mock-up once the band and closing line are in
      // "staggerScale": grow the photos into the side margins (Manoj, 12 Nov), spreading
      // the columns out from the middle and the bottom row down to keep the gaps.
      const sc = Number(m.staggerScale) || 1, t0 = slots[0][1] * k, mid = 3.9;
      const [cx, top, hMax, wMax] = [mid + (slots[i][0] - mid) * sc, t0 + (slots[i][1] * k - t0) * sc, slots[i][2] * k * sc, slots[i][3] * sc];
      const asp = photoAspect(p.src);
      let hh = hMax, ww = hh * asp;
      if (ww > wMax) { ww = wMax; hh = ww / asp; }
      return { p, x: cx - ww / 2, y: top, w: ww, h: hh };
    });
    const bl = figs[2];
    const parts = figs.map((f) => img(f.p, 's-print', f.x, f.y, f.w, f.h, 0));
    parts.push(`<p class="m-verse s-verse" style="left:${inch(bl.x - 0.2)};right:auto;width:${inch(bl.w + 0.4)};top:${inch(bl.y + bl.h + 0.3)};bottom:auto;font-size:12pt">&ldquo;${esc(vText)}&rdquo;<br><span>&mdash; ${esc(vRef)}</span></p>`);
    parts.push(`<p class="m-closing s-close">Celebrating SGMOC&rsquo;s Golden Jubilee &bull; 1976&ndash;2026</p>`);
    return `    <div class="s-stage">\n      ${parts.join('\n      ')}\n    </div>`;
  }

  // verse + closing at the bottom, plus room for each line of names
  // "verseRoom": extra inches at the foot for a long verse
  const foot = 1.3 + (Number(m.verseRoom) || 0) + (names ? Math.max(0.5, 0.22 + 0.26 * lines(names.text).length) : 0);
  const avail = H - foot;
  const a = photoAspect(main.src);
  const out = [];
  let wm, hm, beside;

  // "photoScale": trim the main photo a little, e.g. to lift its print resolution
  const pscale = Number(m.photoScale) > 0 ? Number(m.photoScale) : 1;
  if (noWords) {                                   // no phrases: fill the width
    const maxH = (sides.length ? (two ? 3.9 : 5.6) : avail - 0.15) * pscale;
    wm = Math.min(W * pscale, maxH * a); hm = wm / a; beside = false;
  } else if (a <= (sides.length ? 1.1 : 0.73)) {  // portrait main: phrases beside it
    // Alone on the page, a photo wider than 0.73 is capped by the 4.5in width
    // before it reaches the height, leaving ~2in bare (Milton/Ajay Peter, 12 Nov),
    // so it goes to the next branch: bigger, with the phrases under it.
    const maxH = sides.length ? (two ? 3.9 : 5.1) : avail - 0.2;
    wm = Math.min(4.5, maxH * a) * pscale; hm = wm / a; beside = true;
  } else {                                          // wide main: full width, phrases elsewhere
    const maxH = sides.length ? (two ? 3.9 : 4.5) : avail - 1.9;
    wm = Math.min(W, maxH * a); hm = wm / a; beside = false;
  }

  // side prints: one row, all the same height, never wider than the room given
  let rowW = W - 0.2, sideTop = 0, sideH = 0, rows = [];
  const phrasesFlankRow = !beside && sides.length === 1;
  if (phrasesFlankRow) rowW = 3.8; // 4.1 let a tilted print clip the words (12 Nov)
  const rowGap = 0.25;
  if (sides.length) {
    const gap = 0.35;
    const maxH = (avail - hm + 0.3 - 0.25 - (sides.some((p) => p.caption) ? 0.35 : 0) - rowGap * (rowsOf.length - 1)) / rowsOf.length;
    rows = rowsOf.map((rs) => {
      const as = rs.map((p) => photoAspect(p.src));
      // "scale" on a print: that one taller than the rest (e.g. 1.25)
      const sc = rs.map((p) => Number(p.scale) > 0 ? Number(p.scale) : 1);
      const smax = Math.max(...sc);
      // "printMax": a taller cap than 3.4in for the prints (A. O. Abraham, Manoj 16 Nov: bottom picture bigger)
      const h = Math.min(maxH / smax, (Number(m.printMax) || 3.4) / smax, (rowW - gap * (as.length - 1)) / as.reduce((s, x, i) => s + x * sc[i], 0));
      const widths = as.map((x, i) => h * sc[i] * x);
      const total = widths.reduce((s, x) => s + x, 0) + gap * (as.length - 1);
      let x = (W - total) / 2;
      const items = widths.map((w, i) => { const r = { p: rs[i], x, w, h: h * sc[i], dy: (h * (smax - sc[i])) / 2 }; x += w + gap; return r; });
      return { items, H: h * smax };
    });
    sideH = rows.reduce((s, r) => s + r.H, 0) + rowGap * (rows.length - 1);
  }

  const used = hm + (sides.length ? sideH - 0.3 : beside || noWords ? 0 : 1.7);
  const top = Math.max(0.05, (avail - used) / 2);

  out.push(img(main, 's-main', (W - wm) / 2, top, wm, hm));
  const side = (W - wm) / 2 - 0.12;
  if (beside && !noWords) {
    out.push(words(p1, 0, top + hm * 0.22, side, side < 1.5 ? 26 : 32));
    out.push(words(p2, W - side, top + hm * 0.22, side, side < 1.5 ? 26 : 32));
  }
  if (sides.length) {
    sideTop = top + hm - 0.3;
    const rots = [[-3.5, 3, -2.5], [2.5, -3, 3.5]];
    let y = sideTop;
    rows.forEach((r, k) => {
      r.items.forEach((it, i) => out.push(img(it.p, 's-print', it.x, y + it.dy, it.w, it.h, it.p.straight ? 0 : rots[k][i])));
      y += r.H + rowGap;
    });
    if (phrasesFlankRow && !noWords) {
      out.push(words(p1, 0, sideTop + sideH * 0.2, 1.6, 26));
      out.push(words(p2, W - 1.6, sideTop + sideH * 0.2, 1.6, 26));
    }
  } else if (!beside && !noWords) {
    out.push(words(p1, 0.35, top + hm + 0.25, 3.2));
    out.push(words(p2, W - 3.55, top + hm + 0.25, 3.2));
  }
  if (names) out.push(`<p class="m-names s-names">${lines(names.text).map(esc).join('<br>')}</p>`);
  out.push(`<p class="m-verse big s-verse">&ldquo;${esc(vText)}&rdquo;<br><span>&mdash; ${esc(vRef)}</span></p>`);
  out.push(`<p class="m-closing s-close">Celebrating SGMOC&rsquo;s Golden Jubilee &bull; 1976&ndash;2026</p>`);
  return `    <div class="s-stage">\n      ${out.join('\n      ')}\n    </div>`;
}

/* "inMemoriam": the clergy memorial design Manoj sent on 10 Nov (Mathai Achen,
   Fr. Paul Varki, Dn. Markose Mani) — a large portrait fading into the page,
   name, dates, a role line, a short biography and "May his blessed memory be
   eternal." Fields: photo, pos (object-position), name, dates, role (" • "
   separated), text (paragraphs; **word** is set bold), motto, family. */
function inMemoriamBody(im, m) {
  const bold = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const orn = '<div class="im-orn"><span></span>&#10070;<span></span></div>';
  const role = String(im.role || '').split(/\s*•\s*/).filter(Boolean).map(esc).join(' <i>&bull;</i> ');
  return `    <div class="im-page">
      <div class="im-photo"><img src="${esc(im.photo)}" alt="${esc(im.name)}"${im.pos ? ` style="object-position:${esc(im.pos)}"` : ''}></div>
      <h2 class="im-name"${im.nameSize ? ` style="font-size:${esc(im.nameSize)}"` : ''}>${heading(im.name)}</h2>
      ${im.dates ? `<p class="im-dates">${esc(im.dates)}</p>` : ''}
      ${role ? `<p class="im-role">${role}</p>` : ''}
      ${orn}
      <div class="im-bio">${paragraphs(im.text).map((p) => `<p>${bold(p)}</p>`).join('')}</div>
      ${orn}
      <p class="im-motto">${esc(im.motto || 'May his blessed memory be eternal.')}</p>
      ${im.family ? `<p class="im-family">${esc(im.family)}</p>` : ''}
    </div>`;
}

/* "mockup": a page laid out exactly as the family's own mock-up (Ceena Mathew,
   11 Nov): the photo across the full width, a column of pictures down the
   left at "colWidth" (a share of the page width), the writing beside them in
   a plain sans font, and the closing line in bold red under the writing. */
function mockupBody(mk, m) {
  const col = Number(mk.colWidth) || 0.2375;
  const pics = (mk.column || []).map((src) => `<img src="${esc(src)}" alt="${esc(m.title)}">`).join('');
  return `    <div class="mk-page"${mk.width ? ` style="width:${esc(mk.width)}"` : ''}>
      <img class="mk-photo" src="${esc(mk.photo)}" alt="${esc(m.title)}">
      <div class="mk-row">
        <div class="mk-col" style="flex:0 0 ${(col * 100).toFixed(2)}%">${pics}</div>
        <div class="mk-text">${lines(mk.text).map((l) => `<p>${esc(l)}</p>`).join('')}${mk.closing ? `<p class="mk-close">${esc(mk.closing)}</p>` : ''}</div>
      </div>
    </div>`;
}

const PHOTO_ONLY = ['photos', 'verse', 'closing', 'names'];
// A page that is only a photo block, with no verse, names or closing line, is a
// design the family made themselves (a card, a memorial, a poster). Those stay as sent.
const isDesigned = (pg) => (pg.blocks || []).length > 0 && pg.blocks.every((b) => b.type === 'photos');
const isStyled = (pg) => STYLE && !pg.inMemoriam && !pg.mockup && !isDesigned(pg) && pg.blocks.some((b) => b.type === 'photos') && pg.blocks.every((b) => PHOTO_ONLY.includes(b.type));

/* ── Page kinds ── */

// Photos on a page, across every block on it.
const photoCount = (pg) =>
  (pg.blocks || []).reduce((n, b) => n + (b.type === 'photos' ? (b.photos || []).length
    : b.type === 'side' && b.photo ? 1 : 0), 0);

function memberPages(m) {
  if (m.partial) return [{ html: read(m.partial), label: `MEMBER PAGE: ${m.name}`, member: m }];
  return m.pages.map((pg, i) => {
    const band = [m.band ?? 'Golden Jubilee Family Sponsor', pg.band].filter(Boolean).map(esc).join(' &bull; ');
    const styled = isStyled(pg);
    const html = shell({
      title: pg.title || m.title,
      band,
      dark: pg.dark,
      // "seeAlso": another family in the book. Malayalee surnames do not carry
      // down — a son's surname is his father's given name — so relatives sit
      // far apart in an A–Z and nothing on the page says they are related.
      // The page number is filled in once every page has one.
      body: (pg.mockup ? mockupBody(pg.mockup, m) : pg.inMemoriam ? inMemoriamBody(pg.inMemoriam, m) : styled ? styledBody(m, pg)
        : renderBlocks(pg.blocks, { id: m.id, alt: m.title,
            // the big-photo inline layout only fits when nothing else shares the page
            soloArticle: !pg.blocks.some((x) => x.type === 'photos') }))
        + (i === 0 && m.seeAlso
          ? `\n    <p class="m-seealso">See also ${esc(m.seeAlsoLabel || 'family')} &middot; page @@SEEALSO:${m.seeAlso}@@</p>`
          : ''),
      // "pending": text still being reviewed by Writing/Editing — flagged louder than a proof copy.
      badge: m.pending ? 'Pending review' : m.approved ? null : 'Proof copy',
      // Corner ornament on member pages; set "ornate": false on a family to skip it.
      // "fade": "narrow" | false — for photos with someone right at the edge,
      // where the usual blend would eat them.
      // How many photos land on this page decides which border they get
      // (Manoj, 24 Sept): one or two get the mat, three or more the plain
      // rule, "so we get the real estate space".
      cls: [m.ornate === false ? '' : 'ornate', styled ? 'styled-page' : '', isDesigned(pg) ? 'designed-page' : '',
            `photos-${Math.min(photoCount(pg), 3)}`,
            m.fade === 'narrow' ? 'fade-narrow' : m.fade === false ? 'fade-none' : ''].filter(Boolean).join(' ') || undefined,
    });
    const part = m.pages.length > 1 ? ` (${i + 1} of ${m.pages.length})` : '';
    return { html, label: `MEMBER PAGE: ${m.name}${part}`, member: i === 0 ? m : null, span: i === 0 ? m.pages.length : 0 };
  });
}

// Full-page artwork with no header or footer: "fit" cover (fill, cropping) or contain
// (whole image, the rest of the page in "bg"). Used for the icons and His Holiness's kalpana.
function fullPage(f) {
  // "title": keep the page header and footer and fill the space between them
  // (8.5 x 9.5 in; Manoj sizes these at 2818 x 3060 px, i.e. 8.75 in with bleed).
  if (f.title) {
    const pos = f.pos ? `;object-position:${esc(f.pos)}` : '';
    return shell({ title: f.title, cls: f.title.length > 38 ? 'framed-art long-title' : 'framed-art', body: `    <img class="framed-img" src="${esc(f.src)}" alt="${esc(f.alt || f.title)}" style="object-fit:${esc(f.fit || 'cover')}${pos}">` });
  }
  const pos = f.pos ? `;object-position:${esc(f.pos)}` : '';
  return `<div class="page full-page"${f.bg ? ` style="background:${esc(f.bg)}"` : ''}>
  <img src="${esc(f.src)}" alt="${esc(f.alt || '')}" style="object-fit:${esc(f.fit || 'cover')}${pos}">
</div>
`;
}

function placeholderPage(item) {
  const p = item.placeholder;
  const body = `    <div class="m-placeholder">
      <p class="m-eyebrow">To be completed</p>
      <h2>${esc(p.heading || p.title)}</h2>
      ${p.pages ? `<p class="m-plan">Planned length: ${esc(p.pages)}</p>` : ''}
      ${paragraphs(p.note).map((t) => `<p>${esc(t)}</p>`).join('\n      ')}
    </div>`;
  return shell({ title: p.title, body, cls: 'm-placeholder-page' });
}

function adPage(ad) {
  // An ad promised but not yet received: a "To be completed" page holding its place,
  // so the page count and the status page are right (Manoj, 18 Nov 8:39 PM).
  // A "best compliments" ad set in type, for a sponsor with no artwork of their own
  // (Malabar Catering, Suchin 18 Nov 9:12 PM).
  if (!ad.src && ad.compliments) {
    const c = ad.compliments;
    const body = `    <div class="ad-compliments">
      <p class="adc-with">With Best Compliments</p>
      <div class="adc-rule"></div>
      <h2 class="adc-name">${esc(c.name)}</h2>
      ${c.tagline ? `<p class="adc-tag">${esc(c.tagline)}</p>` : ''}
      <div class="adc-rule"></div>
      ${lines(c.contact || '').map((l) => `<p class="adc-contact">${esc(l)}</p>`).join('\n      ')}
    </div>`;
    return { html: shell({ title: 'Golden Jubilee Sponsor', body, cls: 'm-ad' }), label: `SPONSOR AD: ${ad.name}` };
  }
  if (!ad.src) {
    const body = `    <div class="m-placeholder">
      <p class="m-eyebrow">To be completed</p>
      <h2>${esc(ad.name)}</h2>
      <p>Sponsor advertisement${ad.from ? ` &mdash; coming from ${esc(ad.from)}` : ''}.</p>
    </div>`;
    return { html: shell({ title: 'Golden Jubilee Sponsor', body, cls: 'm-ad' }), label: `SPONSOR AD: ${ad.name} (placeholder)` };
  }
  const body = renderBlocks([{ type: 'photos', plain: true, photos: [{ src: ad.src, alt: ad.name }] }], { id: ad.id, alt: ad.name });
  return { html: shell({ title: 'Golden Jubilee Sponsor', body, cls: 'm-ad' }), label: `SPONSOR AD: ${ad.name}` };
}

/* ── Assemble ── */

const outline = readJSON('data/outline.json');
const members = readJSON('data/members.json').members;
const ads = readJSON('data/sponsors.json').ads;

// "clergyOrder": clergy families open the member section in this order, then A–Z
// (Manoj, 17 Nov: "Clergy family first then rest of the members", as in past souvenirs).
const co = (m) => (Number(m.clergyOrder) > 0 ? Number(m.clergyOrder) : Infinity);
members.sort((a, b) => co(a) - co(b) || (a.sort || a.name).localeCompare(b.sort || b.name, 'en', { sensitivity: 'base' }));
const ids = new Set();
for (const m of members) {
  if (ids.has(m.id)) throw new Error(`duplicate member id ${m.id}`);
  ids.add(m.id);
}

// Member pages, A–Z. Sponsor ads all go at the end of the book (Manoj, 3 Nov),
// where data/outline.json puts its "ads" item.
// Members with "placement": "outline" appear where data/outline.json names them (e.g. Past Clergy).
const memberSection = () => members.filter((m) => !m.placement).flatMap(memberPages);

const pages = []; // { html, label, toc?, section?, member?, index? }
const contents = []; // lines for the index: { section } | { title, pageRef }

for (const section of outline.sections) {
  contents.push({ section: section.name });
  // "startOn": "even" keeps a section's spreads together (left page first) by adding
  // a blank framed page before it when the page count would put it on a right page.
  if (section.startOn === 'even' && (pages.length + 1) % 2 === 1) {
    pages.push({ html: shell({ title: '', body: '', cls: 'blank-page' }), label: `BLANK (so ${section.name} starts on a left page)` });
  }
  for (const item of section.items) {
    let added;
    if (item.file) {
      // STYLE=manoj uses src/pages/<name>-styled.html where one exists (e.g. the cover).
      const styledFile = item.file.replace(/\.html$/, '-styled.html');
      const file = STYLE && fs.existsSync(path.join(root, styledFile)) ? styledFile : item.file;
      added = [{ html: read(file), label: item.label }];
    }
    else if (item.fullpage) added = [{ html: fullPage(item.fullpage), label: item.label }];
    else if (item.placeholder) added = [{ html: placeholderPage(item), label: `PLACEHOLDER: ${item.placeholder.title}` }];
    else if (item.generated) {
      const g = item.generated;
      const body = renderBlocks(g.blocks, { id: g.title, alt: g.title });
      // "gallery": a picture page, photos edge to edge between header and footer (Manoj, 18 Nov).
      // "wide": narrower side margins, for a landscape document that should print as
      // large as the page allows (the Mayor's certificate, Manoj 18 Nov 8:16 PM).
      added = [{ html: shell({ title: g.title, band: g.band && !g.gallery ? esc(g.band) : '', body, cls: g.gallery ? 'm-gallery' : g.wide ? 'm-wide' : '' }), label: item.label || g.title.toUpperCase() }];
    } else if (item.member) {
      const m = members.find((x) => x.id === item.member);
      if (!m) throw new Error(`outline names unknown member "${item.member}"`);
      added = memberPages(m);
    } else if (item.members) added = memberSection();
    // each ad remembers its sponsor so the index can list them (Manoj, 20 Nov)
    else if (item.ads) added = ads.map((ad) => ({ ...adPage(ad), ad }));
    else if (item.index) added = [{ index: true, label: 'INDEX' }];
    else throw new Error(`outline item not understood: ${JSON.stringify(item)}`);
    if (item.toc) contents.push({ title: item.toc, ref: added[0] });
    pages.push(...added);
  }
}

// Index: contents + families A–Z. Its size is known before numbering because it's all line counts.
// the index stays A–Z even though clergy families open the member section
const skey = (m) => m.sort || m.name;
const memberRefs = pages.filter((p) => p.member).map((p, i) => [p, i])
  .sort(([a, i], [b, j]) => skey(a.member).localeCompare(skey(b.member), 'en', { sensitivity: 'base' }) || i - j)
  .map(([p]) => p);
const indexLines = [
  { heading: 'Contents' },
  ...contents,
  { heading: 'Families & Memorials' },
  // "indexSkip": a family already listed under another entry (the Mathew family,
  // Manoj 20 Nov: one line, numbered at their first page)
  ...memberRefs.filter((p) => !p.member.indexSkip).map((p) => ({ title: p.member.indexName || p.member.name, ref: p })),
];
// Ad sponsors by name (Manoj, 20 Nov: "For Ad sponsors lets names individual sponsors")
const adRefs = pages.filter((p) => p.ad);
if (adRefs.length) indexLines.push({ heading: 'Sponsors' }, ...adRefs.map((p) => ({ title: p.ad.indexName || p.ad.name, ref: p })));
const indexPageCount = Math.max(1, Math.ceil(indexLines.length / INDEX_LINES_PER_PAGE));
const indexAt = pages.findIndex((p) => p.index);
if (indexAt >= 0) {
  pages.splice(indexAt, 1, ...Array.from({ length: indexPageCount }, (_, i) => ({ index: i, label: `INDEX (${i + 1} of ${indexPageCount})` })));
}

pages.forEach((p, i) => (p.number = i + 1));

function renderIndexPage(i) {
  const chunk = indexLines.slice(i * INDEX_LINES_PER_PAGE, (i + 1) * INDEX_LINES_PER_PAGE);
  const rows = chunk
    .map((l) => {
      if (l.heading) return `<p class="m-index-heading">${esc(l.heading)}</p>`;
      if (l.section) return `<p class="m-index-section">${esc(l.section)}</p>`;
      // a family on two or more pages shows the range, e.g. 123–124 (Molsey, 17 Nov)
      const no = l.ref.span > 1 ? `${l.ref.number}–${l.ref.number + l.ref.span - 1}` : l.ref.number;
      return `<p class="m-index-row"><span>${esc(l.title)}</span><span>${no}</span></p>`;
    })
    .join('\n      ');
  const body = `    <div class="m-index">\n      ${rows}\n    </div>`;
  return shell({ title: indexPageCount > 1 ? `Index (${i + 1} of ${indexPageCount})` : 'Index', body, cls: 'm-index-page' });
}

// Where each family starts, so a seeAlso can name a real page.
const memberPageNo = new Map();
for (const p of pages) if (p.member) memberPageNo.set(p.member.id, p.number);

const bar = '═'.repeat(40);
const bodyHtml = pages
  .map((p) => {
    let html = typeof p.index === 'number' ? renderIndexPage(p.index) : p.html;
    html = html.replace(FOOTER_NO, `$1${p.number}$2`);
    html = html.replace(/@@SEEALSO:([a-z0-9-]+)@@/g, (_, id) => {
      const n = memberPageNo.get(id);
      if (!n) throw new Error(`seeAlso points at "${id}", which is not a family in the book`);
      return n;
    });
    const marker = p.label === 'BACK COVER' ? 'BACK COVER' : `PAGE ${p.number} — ${p.label}`;
    return `<!-- ${bar}\n     ${marker}\n${bar} -->\n${html}`;
  })
  .join('');

const layoutCheck = `<script>
/* Layout self-check, only when opened as index.html#layout-check (used by scripts/check-layout.js). */
// Waits for the web fonts first (regular, italic, semibold, bold): measured with fallback
// fonts, text wraps differently from the printed PDF (found 16 Nov, Mission Board pages).
if (location.hash === '#layout-check') addEventListener('load', function () {
  Promise.all(['400 13px', 'italic 400 13px', '600 13px', '700 13px', 'italic 700 13px'].map(function (f) {
    return document.fonts.load(f + ' "EB Garamond"');
  })).then(function () { return document.fonts.ready; }).then(function () { setTimeout(layoutScan, 500); });
});
function layoutScan() {
  var IN = 96, out = [];
  document.querySelectorAll('.page').forEach(function (pg, i) {
    var issues = [];
    if (pg.offsetHeight > 11 * IN + 2) issues.push('page grows to ' + (pg.offsetHeight / IN).toFixed(2) + 'in');
    var c = pg.querySelector('.m-content');
    if (c && c.scrollHeight > c.clientHeight + 2) issues.push('content overflows by ' + ((c.scrollHeight - c.clientHeight) / IN).toFixed(2) + 'in');
    var f = pg.querySelector('.page-footer'), pc = pg.querySelector('.page-content');
    if (f && pc) {
      var top = f.getBoundingClientRect().top, bottom = 0;
      pc.querySelectorAll('*').forEach(function (e) { bottom = Math.max(bottom, e.getBoundingClientRect().bottom); });
      if (bottom > top + 1) issues.push('content runs under footer by ' + ((bottom - top) / IN).toFixed(2) + 'in');
    }
    // Multi-column text that runs out of height spills into an extra column off
    // to the right, which none of the height checks above can see.
    pg.querySelectorAll('.m-article, .m-text.cols').forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 2) issues.push('text spills into an extra column (' + el.className + ')');
    });
    pg.querySelectorAll('img').forEach(function (im) { if (!im.naturalWidth) issues.push('broken image ' + im.getAttribute('src')); });
    pg.querySelectorAll('.m-fig img').forEach(function (im) {
      var h = im.getBoundingClientRect().height;
      if (im.naturalWidth && h < 1.2 * IN) issues.push('photo squeezed to ' + (h / IN).toFixed(2) + 'in ' + im.getAttribute('src'));
    });
    // ── Checks for the fixes of 16 Nov (Mathew Joseph, from iPhone proofs) ──
    // 1. No soft (blurred) shadows anywhere. iPhone's PDF viewer draws them as hard pale
    //    or dark boxes: they faded headings, ran over footers and looked like a second
    //    page laid on top. The paper wash behind text is baked into page-sample-text.jpg.
    pg.querySelectorAll('*').forEach(function (e) {
      var cs = getComputedStyle(e);
      [cs.boxShadow, cs.textShadow].forEach(function (s) {
        if (!s || s === 'none') return;
        s.replace(/rgba?[(][^)]*[)]/g, '').split(',').forEach(function (one) {
          if (one.indexOf('inset') >= 0) return;
          var n = (one.match(/-?[0-9.]+px/g) || []).map(parseFloat);
          if (n.length >= 3 && n[2] > 0) issues.push('soft shadow (iPhone draws it as a box) on ' + e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''));
        });
      });
    });
    // 1b. Photo captions in a row must not run into each other (16 Nov: three memorial
    //     couples side by side; long one-line dates overlapped the next caption).
    var caps = Array.prototype.map.call(pg.querySelectorAll('.m-fig figcaption'), function (c) {
      var r = document.createRange(); r.selectNodeContents(c); return r.getBoundingClientRect();
    });
    for (var ci = 0; ci < caps.length; ci++) for (var cj = ci + 1; cj < caps.length; cj++) {
      var A = caps[ci], B = caps[cj];
      if (A.width && B.width && A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1) issues.push('photo captions overlap');
    }
    // 2-6. Article pages generated from Word documents (Sunday School, MMVS…)
    if (pg.classList.contains('org-page')) {
      var blocks = pg.querySelectorAll('.page-content > .org-el');
      // 2. even paragraph spacing: no big gap between blocks
      for (var b = 1; b < blocks.length; b++) {
        var gap = blocks[b].getBoundingClientRect().top - blocks[b - 1].getBoundingClientRect().bottom;
        if (gap > 0.2 * IN) issues.push('gap of ' + (gap / IN).toFixed(2) + 'in between paragraphs');
      }
      // 3. no big empty space at the foot of a page when the article carries on overleaf
      var nx = pg.nextElementSibling;
      while (nx && !nx.classList.contains('page')) nx = nx.nextElementSibling;
      var h1 = (pg.querySelector('h1') || {}).textContent;
      if (nx && nx.classList.contains('org-page') && (nx.querySelector('h1') || {}).textContent === h1 && f && blocks.length) {
        var foot = f.getBoundingClientRect().top - blocks[blocks.length - 1].getBoundingClientRect().bottom;
        // a new section (an era heading) may start on a fresh page: allow up to 1.5in then (History, 18 Nov)
        var nf = nx.querySelector('.page-content > .org-el');
        var sectionNext = nf && nf.querySelector(':scope > .org-era, :scope > .org-title');
        if (foot > (sectionNext ? 1.5 : 0.75) * IN) issues.push((foot / IN).toFixed(2) + 'in empty at the foot of the page');
      }
      // 4. a photo beside text is about as tall as the text
      pg.querySelectorAll('.org-pair').forEach(function (q) {
        var fh = q.querySelector('.org-fig').getBoundingClientRect().height, t = q.querySelector('.org-text'), tt = t.getBoundingClientRect().top, th = 0;
        [].forEach.call(t.children, function (c) { th = Math.max(th, c.getBoundingClientRect().bottom - tt); });
        if (Math.abs(fh - th) > 0.45 * IN) issues.push('photo and the text beside it differ by ' + (Math.abs(fh - th) / IN).toFixed(2) + 'in');
      });
      // 5. no line or two of a paragraph stranded under a photo the text wraps round
      pg.querySelectorAll('.org-float').forEach(function (q) {
        var gb = q.querySelector('.org-fig').getBoundingClientRect().bottom;
        [].forEach.call(q.children, function (c) {
          if (c.classList.contains('org-fig')) return;
          var r = c.getBoundingClientRect();
          if (r.top >= gb - 2) return;  // starts below the photo: not wrapping round it
          var rg = document.createRange(), tops = {};
          rg.selectNodeContents(c);
          [].forEach.call(rg.getClientRects(), function (lr) { if (lr.width > 2 && lr.top >= gb) tops[Math.round(lr.top)] = 1; });
          var under = Object.keys(tops).length;
          if (under >= 1 && under <= 2) issues.push(under + ' line(s) stranded under a photo: "' + c.textContent.trim().slice(-30) + '"');
        });
      });
      // 6. side photos squeezed to the text's height keep their top (heads were cut off on p. 47)
      pg.querySelectorAll('.org-pair .org-photo, .org-float .org-photo').forEach(function (im) {
        var cs = getComputedStyle(im), r = im.getBoundingClientRect();
        if (cs.objectFit !== 'cover' || !im.naturalWidth) return;
        var shown = r.width / r.height, nat = im.naturalWidth / im.naturalHeight;
        var y = parseFloat((cs.objectPosition.split(' ')[1]) || '50');
        if (shown > nat * 1.08 && y > 10) issues.push('photo cropped from the middle, heads may be cut (' + im.getAttribute('src') + ')');
      });
    }
    // 7. No short line said twice on one page (Ceena, 18 Nov: "St. Gregorios Malankara Orthodox
    //    Church, Bensalem" under Fr. K. P. Varghese's title and again under his name; the
    //    Trustee's page had the same). Looks at titles, subtitles, names, affiliations and
    //    captions; body paragraphs are too long to count, and tables and lists (names that
    //    rightly recur, e.g. a treasurer serving several years) are left out, and so is the
    //    sign-off, which repeats the writer's name by design. Flags an exact repeat anywhere,
    //    and, between the title block and the lines under the writer's name, a line of 20+
    //    characters contained in another.
    var lines = [];
    pg.querySelectorAll('.page-content h1, .page-content h2, .page-content h3, .page-content h4, .page-content p, .page-content figcaption').forEach(function (e) {
      if (e.closest('table, ul, ol, .page-header, .page-footer, .message-sign') || e.querySelector('p, h2, h3, h4')) return;
      var head = !!e.closest('.section-heading, .message-sender');
      e.innerText.split(String.fromCharCode(10)).forEach(function (ln) {
        ln = ln.trim();
        var k = ln.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (k.length >= 12 && ln.length <= 90) lines.push({ k: k, t: ln, head: head });
      });
    });
    var said = {};
    lines.forEach(function (a, ai) {
      lines.forEach(function (b, bi) {
        if (bi <= ai || said[a.k + '|' + b.k]) return;
        var both = a.head && b.head;
        var inside = a.k === b.k ? null : !both ? false : a.k.length >= 20 && (' ' + b.k + ' ').indexOf(' ' + a.k + ' ') >= 0 ? [a, b]
          : b.k.length >= 20 && (' ' + a.k + ' ').indexOf(' ' + b.k + ' ') >= 0 ? [b, a] : false;
        if (inside === false) return;
        said[a.k + '|' + b.k] = 1;
        issues.push(inside ? 'line repeated inside another: "' + inside[0].t + '" / "' + inside[1].t + '"' : 'same line twice on the page: "' + a.t + '"');
      });
    });
    if (issues.length) out.push({ page: i + 1, title: (pg.querySelector('h1') || {}).textContent, issues: issues });
  });
  var pre = document.createElement('pre');
  pre.id = 'layout-report';
  pre.textContent = JSON.stringify({ pages: document.querySelectorAll('.page').length, problems: out });
  document.body.appendChild(pre);
}
</script>
`;

// The print file uses static EB Garamond and Open Sans from fonts/ (SIL OFL):
// Google serves both as variable fonts, which Chrome writes into the PDF as Type 3 glyphs, and
// Vistaprint rejects those as "non embedded fonts" (Manoj, 17 Nov).
const PRINT_FONTS = [[400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold']]
  .flatMap(([w, n]) => [[w, 'normal', n], [w, 'italic', (n === 'Regular' ? '' : n) + 'Italic']])
  .map(([w, st, n]) => `@font-face{font-family:'EB Garamond';font-weight:${w};font-style:${st};src:url('fonts/EBGaramond-${n}.ttf') format('truetype');}`)
  .join('') + [[400, 'Regular'], [700, 'Bold']]
  .map(([w, n]) => `@font-face{font-family:'Open Sans';font-weight:${w};src:url('fonts/OpenSans-${n}.ttf') format('truetype');}`)
  .join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SGMOC Golden Jubilee Souvenir 1976–2026</title>
<!-- Generated by scripts/build.js — edit src/ and data/, not this file. -->
<style>
${read('src/styles.css')}${read('src/members.css')}${STYLE ? read('src/style-manoj.css') : ''}${BLEED ? read('src/bleed.css') : ''}${STYLE ? read('src/style-frame.css') : ''}</style>
${STYLE && BLEED ? `<style>${PRINT_FONTS}</style>` : ''}
${STYLE ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${BLEED ? '' : 'family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&'}family=Great+Vibes&${BLEED ? '' : 'family=Open+Sans:wght@400;700&'}family=Manjari:wght@400;700&display=swap">` : ''}
</head>
<body>

${bodyHtml}${layoutCheck}
</body>
</html>
`;

const outFile = BLEED ? 'index-print.html' : 'index.html';
fs.writeFileSync(path.join(root, outFile), html);
// preview-style.html is the link Manoj and the board already have; keep it working.
if (STYLE && !BLEED) fs.writeFileSync(path.join(root, 'preview-style.html'), html);
const memberPageCount = pages.filter((p) => p.label.startsWith('MEMBER PAGE')).length;
console.log(`✓ ${outFile}: ${pages.length} pages (${members.length} families on ${memberPageCount} pages, ${ads.length} ads, ${indexPageCount} index page(s))`);
