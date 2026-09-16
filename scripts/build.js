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

/* ── Page kinds ── */

function memberPages(m) {
  if (m.partial) return [{ html: read(m.partial), label: `MEMBER PAGE: ${m.name}`, member: m }];
  return m.pages.map((pg, i) => {
    const band = [m.band ?? 'Golden Jubilee Family Sponsor', pg.band].filter(Boolean).map(esc).join(' &bull; ');
    const html = shell({
      title: pg.title || m.title,
      band,
      dark: pg.dark,
      body: renderBlocks(pg.blocks, { id: m.id, alt: m.title }),
      badge: m.approved ? null : 'Proof copy',
      // Corner ornament on member pages; set "ornate": false on a family to skip it.
      cls: m.ornate === false ? undefined : 'ornate',
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
    if (item.file) added = [{ html: read(item.file), label: item.label }];
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
${read('src/styles.css')}${read('src/members.css')}</style>
</head>
<body>

${bodyHtml}${layoutCheck}
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html);
const memberPageCount = pages.filter((p) => p.label.startsWith('MEMBER PAGE')).length;
console.log(`✓ index.html: ${pages.length} pages (${members.length} families on ${memberPageCount} pages, ${ads.length} ads, ${indexPageCount} index page(s))`);
