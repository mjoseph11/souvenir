#!/usr/bin/env node
/**
 * build.js — assembles index.html from source files. Do not edit index.html by hand.
 *
 *   src/styles.css, src/members.css  page styles
 *   src/pages/*.html                  hand-built pages (messages, history, ministries, …)
 *   data/outline.json                 section order, following Manoj's "SGMOC Content Outline"
 *   data/members.json                 member & memorial pages, rendered from the blocks below
 *   data/sponsors.json                sponsor ads, spread evenly through the member section
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
    <span>Golden Jubilee 1976–2026</span>
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
  const cap = photo.caption ? `<figcaption>${esc(photo.caption)}</figcaption>` : '';
  return `<figure class="m-fig"><img src="${esc(photo.src)}" alt="${esc(photo.alt || alt)}"${style}>${cap}</figure>`;
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
    const fill = b.fill ? ' fill' : '';
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
    const cls = ['m-article', b.span && 'span-title'].filter(Boolean).join(' ');
    const fig = b.photo ? figure(b.photo, ctx.alt) : '';
    const title = b.title ? `<h2 class="m-article-title">${esc(b.title)}</h2>` : '';
    const body = paragraphs(b.text).map((p) => `<p>${esc(p)}</p>`).join('');
    const sign = b.sign ? `<p class="m-sign">&mdash; ${esc(b.sign)}</p>` : '';
    return `<div class="${cls}">${b.span ? title + fig : fig + title}${body}${sign}</div>`;
  },
  text(b) {
    const cls = ['m-text', b.cols && 'cols', b.size && `size-${b.size}`, b.center && 'center', b.italic && 'italic', b.bare && 'bare']
      .filter(Boolean)
      .join(' ');
    const title = b.title ? `<p class="m-text-title">${esc(b.title)}</p>` : '';
    const body = paragraphs(b.text).map((p) => `<p>${esc(p)}</p>`).join('');
    const sign = b.sign ? `<p class="m-sign">&mdash; ${esc(b.sign)}</p>` : '';
    return `<div class="${cls}">${title}${body}${sign}</div>`;
  },
  list(b) {
    const title = b.title ? `<p class="m-text-title">${esc(b.title)}</p>` : '';
    return `<div class="m-text center">${title}<ul class="m-list">${lines(b.items).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
  },
  side(b, ctx) {
    const body = paragraphs(b.text).map((p) => `<p>${esc(p)}</p>`).join('');
    const grow = b.grow ? ` style="flex-grow:${Number(b.grow)}"` : '';
    return `<div class="m-side"${grow}><div class="m-photos">${figure(b.photo, ctx.alt)}</div><div class="m-text center italic bare">${body}</div></div>`;
  },
  names: (b) => `<p class="m-names">${lines(b.text).map(esc).join('<br>')}</p>`,
  verse: (b) =>
    `<p class="m-verse${b.big ? ' big' : ''}">&ldquo;${esc(b.text)}&rdquo;${b.ref ? `<br><span>&mdash; ${esc(b.ref)}</span>` : ''}</p>`,
  memorial: (b) =>
    `<div class="m-memorial-head">${b.eyebrow === false ? '' : `<p class="m-eyebrow">${esc(b.eyebrow || 'In Loving Memory')}</p>`}<h2>${esc(b.name)}</h2>${
      b.dates ? `<p class="m-dates">${esc(b.dates)}</p>` : ''
    }<div class="m-rule"></div></div>`,
  eternal: (b) => `<p class="m-eternal">${esc(b.text || 'May Their Memory Be Eternal')}</p>`,
  closing: () => `<p class="m-closing">Celebrating SGMOC&rsquo;s Golden Jubilee &bull; 1976&ndash;2026</p>`,
  half: (b, ctx) => `<section class="m-half${b.dark ? ' dark' : ''}"${b.grow ? ` style="flex-grow:${Number(b.grow)}"` : ''}>\n${renderBlocks(b.blocks, ctx)}\n    </section>`,
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

const STYLE = process.env.STYLE === 'manoj';
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
  const sides = photos.filter((_, i) => i !== mainAt).slice(0, 3);
  const names = pg.blocks.find((b) => b.type === 'names');
  const given = pg.blocks.find((b) => b.type === 'verse');
  const [vText, vRef] = given ? [given.text, given.ref] : VERSES[hash(m.id) % VERSES.length];

  const h = hash(m.id);
  const p1 = PHRASES[h % PHRASES.length];
  // second phrase: a different one, and never the same script word as the first
  let j = (h + 1 + (h >>> 8) % (PHRASES.length - 1)) % PHRASES.length;
  while (PHRASES[j].script === p1.script) j = (j + 1) % PHRASES.length;
  const p2 = PHRASES[j];
  const words = (p, x, y, w, size = 30) =>
    `<div class="s-words" style="left:${inch(x)};top:${inch(y)};width:${inch(w)}"><span class="s-script" style="font-size:${size}pt">${esc(p.script)}</span>${p.lines.map((l) => `<span class="s-caps">${esc(l)}</span>`).join('')}<i class="s-rule"></i></div>`;
  const img = (p, cls, x, y, w, hgt, rot) =>
    `<figure class="${cls}" style="left:${inch(x)};top:${inch(y)};width:${inch(w)};height:${inch(hgt)}${rot ? `;transform:rotate(${rot}deg)` : ''}"><img src="${esc(p.src)}" alt="${esc(m.title)}"></figure>`;

  const foot = 1.3 + (names ? 0.5 : 0);           // verse + closing (+ names) at the bottom
  const avail = H - foot;
  const a = photoAspect(main.src);
  const out = [];
  let wm, hm, beside;

  if (a <= 1.1) {                                  // portrait or square main: phrases beside it
    const maxH = sides.length ? 5.1 : avail - 0.2;
    wm = Math.min(4.5, maxH * a); hm = wm / a; beside = true;
  } else {                                          // wide main: full width, phrases elsewhere
    const maxH = sides.length ? 4.5 : avail - 1.9;
    wm = Math.min(W, maxH * a); hm = wm / a; beside = false;
  }

  // side prints: one row, all the same height, never wider than the room given
  let rowW = W - 0.2, sideTop = 0, sideH = 0, row = [];
  const phrasesFlankRow = !beside && sides.length === 1;
  if (phrasesFlankRow) rowW = 4.1;
  if (sides.length) {
    const as = sides.map((p) => photoAspect(p.src));
    const gap = 0.35;
    const maxH = avail - hm + 0.3 - 0.25;
    sideH = Math.min(maxH, 3.4, (rowW - gap * (as.length - 1)) / as.reduce((s, x) => s + x, 0));
    const widths = as.map((x) => sideH * x);
    const total = widths.reduce((s, x) => s + x, 0) + gap * (as.length - 1);
    let x = (W - total) / 2;
    row = widths.map((w) => { const r = { x, w }; x += w + gap; return r; });
  }

  const used = hm + (sides.length ? sideH - 0.3 : beside ? 0 : 1.7);
  const top = Math.max(0.05, (avail - used) / 2);

  out.push(img(main, 's-main', (W - wm) / 2, top, wm, hm));
  const side = (W - wm) / 2 - 0.12;
  if (beside) {
    out.push(words(p1, 0, top + hm * 0.22, side, side < 1.5 ? 26 : 32));
    out.push(words(p2, W - side, top + hm * 0.22, side, side < 1.5 ? 26 : 32));
  }
  if (sides.length) {
    sideTop = top + hm - 0.3;
    const rots = [-3.5, 3, -2.5];
    sides.forEach((p, i) => out.push(img(p, 's-print', row[i].x, sideTop, row[i].w, sideH, rots[i])));
    if (phrasesFlankRow) {
      out.push(words(p1, 0, sideTop + sideH * 0.2, 1.6, 26));
      out.push(words(p2, W - 1.6, sideTop + sideH * 0.2, 1.6, 26));
    }
  } else if (!beside) {
    out.push(words(p1, 0.35, top + hm + 0.25, 3.2));
    out.push(words(p2, W - 3.55, top + hm + 0.25, 3.2));
  }
  if (names) out.push(`<p class="m-names s-names">${lines(names.text).map(esc).join('<br>')}</p>`);
  out.push(`<p class="m-verse big s-verse">&ldquo;${esc(vText)}&rdquo;<br><span>&mdash; ${esc(vRef)}</span></p>`);
  out.push(`<p class="m-closing s-close">Celebrating SGMOC&rsquo;s Golden Jubilee &bull; 1976&ndash;2026</p>`);
  return `    <div class="s-stage">\n      ${out.join('\n      ')}\n    </div>`;
}

const PHOTO_ONLY = ['photos', 'verse', 'closing', 'names'];
// A page that is only a photo block, with no verse, names or closing line, is a
// design the family made themselves (a card, a memorial, a poster). Those stay as sent.
const isDesigned = (pg) => pg.blocks.length > 0 && pg.blocks.every((b) => b.type === 'photos');
const isStyled = (pg) => STYLE && !isDesigned(pg) && pg.blocks.some((b) => b.type === 'photos') && pg.blocks.every((b) => PHOTO_ONLY.includes(b.type));

/* ── Page kinds ── */

function memberPages(m) {
  if (m.partial) return [{ html: read(m.partial), label: `MEMBER PAGE: ${m.name}`, member: m }];
  return m.pages.map((pg, i) => {
    const band = [m.band ?? 'Golden Jubilee Family Sponsor', pg.band].filter(Boolean).map(esc).join(' &bull; ');
    const styled = isStyled(pg);
    const html = shell({
      title: pg.title || m.title,
      band,
      dark: pg.dark,
      body: styled ? styledBody(m, pg) : renderBlocks(pg.blocks, { id: m.id, alt: m.title }),
      // "pending": text still being reviewed by Writing/Editing — flagged louder than a proof copy.
      badge: m.pending ? 'Pending review' : m.approved ? null : 'Proof copy',
      // Corner ornament on member pages; set "ornate": false on a family to skip it.
      cls: [m.ornate === false ? '' : 'ornate', styled ? 'styled-page' : '', isDesigned(pg) ? 'designed-page' : ''].filter(Boolean).join(' ') || undefined,
    });
    const part = m.pages.length > 1 ? ` (${i + 1} of ${m.pages.length})` : '';
    return { html, label: `MEMBER PAGE: ${m.name}${part}`, member: i === 0 ? m : null };
  });
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
  const body = renderBlocks([{ type: 'photos', plain: true, photos: [{ src: ad.src, alt: ad.name }] }], { id: ad.id, alt: ad.name });
  return { html: shell({ title: 'Golden Jubilee Sponsor', body, cls: 'm-ad' }), label: `SPONSOR AD: ${ad.name}` };
}

/* ── Assemble ── */

const outline = readJSON('data/outline.json');
const members = readJSON('data/members.json').members;
const ads = readJSON('data/sponsors.json').ads;

members.sort((a, b) => (a.sort || a.name).localeCompare(b.sort || b.name, 'en', { sensitivity: 'base' }));
const ids = new Set();
for (const m of members) {
  if (ids.has(m.id)) throw new Error(`duplicate member id ${m.id}`);
  ids.add(m.id);
}

// Member pages with ads spread evenly between families (never inside a multi-page family).
// Members with "placement": "outline" appear where data/outline.json names them (e.g. Past Clergy).
function memberSection() {
  const perMember = members.filter((m) => !m.placement).map(memberPages);
  const total = perMember.reduce((n, p) => n + p.length, 0);
  const gap = total / (ads.length + 1);
  const out = [];
  let count = 0;
  let next = 0;
  for (const pages of perMember) {
    out.push(...pages);
    count += pages.length;
    while (next < ads.length && count >= gap * (next + 1)) out.push(adPage(ads[next++]));
  }
  while (next < ads.length) out.push(adPage(ads[next++]));
  return out;
}

const pages = []; // { html, label, toc?, section?, member?, index? }
const contents = []; // lines for the index: { section } | { title, pageRef }

for (const section of outline.sections) {
  contents.push({ section: section.name });
  for (const item of section.items) {
    let added;
    if (item.file) {
      // STYLE=manoj uses src/pages/<name>-styled.html where one exists (e.g. the cover).
      const styledFile = item.file.replace(/\.html$/, '-styled.html');
      const file = STYLE && fs.existsSync(path.join(root, styledFile)) ? styledFile : item.file;
      added = [{ html: read(file), label: item.label }];
    }
    else if (item.placeholder) added = [{ html: placeholderPage(item), label: `PLACEHOLDER: ${item.placeholder.title}` }];
    else if (item.generated) {
      const g = item.generated;
      const body = renderBlocks(g.blocks, { id: g.title, alt: g.title });
      added = [{ html: shell({ title: g.title, band: g.band ? esc(g.band) : '', body }), label: item.label || g.title.toUpperCase() }];
    } else if (item.member) {
      const m = members.find((x) => x.id === item.member);
      if (!m) throw new Error(`outline names unknown member "${item.member}"`);
      added = memberPages(m);
    } else if (item.members) added = memberSection();
    else if (item.index) added = [{ index: true, label: 'INDEX' }];
    else throw new Error(`outline item not understood: ${JSON.stringify(item)}`);
    if (item.toc) contents.push({ title: item.toc, ref: added[0] });
    pages.push(...added);
  }
}

// Index: contents + families A–Z. Its size is known before numbering because it's all line counts.
const memberRefs = pages.filter((p) => p.member);
const indexLines = [
  { heading: 'Contents' },
  ...contents,
  { heading: 'Families & Memorials' },
  ...memberRefs.map((p) => ({ title: p.member.indexName || p.member.name, ref: p })),
];
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
      return `<p class="m-index-row"><span>${esc(l.title)}</span><span>${l.ref.number}</span></p>`;
    })
    .join('\n      ');
  const body = `    <div class="m-index">\n      ${rows}\n    </div>`;
  return shell({ title: indexPageCount > 1 ? `Index (${i + 1} of ${indexPageCount})` : 'Index', body, cls: 'm-index-page' });
}

const bar = '═'.repeat(40);
const bodyHtml = pages
  .map((p) => {
    let html = typeof p.index === 'number' ? renderIndexPage(p.index) : p.html;
    html = html.replace(FOOTER_NO, `$1${p.number}$2`);
    const marker = p.label === 'BACK COVER' ? 'BACK COVER' : `PAGE ${p.number} — ${p.label}`;
    return `<!-- ${bar}\n     ${marker}\n${bar} -->\n${html}`;
  })
  .join('');

const layoutCheck = `<script>
/* Layout self-check, only when opened as index.html#layout-check (used by scripts/check-layout.js). */
if (location.hash === '#layout-check') addEventListener('load', function () {
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
    pg.querySelectorAll('img').forEach(function (im) { if (!im.naturalWidth) issues.push('broken image ' + im.getAttribute('src')); });
    pg.querySelectorAll('.m-fig img').forEach(function (im) {
      var h = im.getBoundingClientRect().height;
      if (im.naturalWidth && h < 1.2 * IN) issues.push('photo squeezed to ' + (h / IN).toFixed(2) + 'in ' + im.getAttribute('src'));
    });
    if (issues.length) out.push({ page: i + 1, title: (pg.querySelector('h1') || {}).textContent, issues: issues });
  });
  var pre = document.createElement('pre');
  pre.id = 'layout-report';
  pre.textContent = JSON.stringify({ pages: document.querySelectorAll('.page').length, problems: out });
  document.body.appendChild(pre);
});
</script>
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SGMOC Golden Jubilee Souvenir 1976–2026</title>
<!-- Generated by scripts/build.js — edit src/ and data/, not this file. -->
<style>
${read('src/styles.css')}${read('src/members.css')}${STYLE ? read('src/style-manoj.css') : ''}</style>
${STYLE ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap">' : ''}
</head>
<body>

${bodyHtml}${layoutCheck}
</body>
</html>
`;

// STYLE=manoj writes a preview of Manoj's page style; the souvenir itself is index.html.
const outFile = STYLE ? 'preview-style.html' : 'index.html';
fs.writeFileSync(path.join(root, outFile), html);
const memberPageCount = pages.filter((p) => p.label.startsWith('MEMBER PAGE')).length;
console.log(`✓ ${outFile}: ${pages.length} pages (${members.length} families on ${memberPageCount} pages, ${ads.length} ads, ${indexPageCount} index page(s))`);
