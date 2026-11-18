#!/usr/bin/env node
/**
 * status.js — writes status.html, the editorial board's live list of what is
 * still open before the final print (Mathew, 18 Nov 2026: the WhatsApp list was
 * being used as a tracker and went stale as soon as items were done).
 *
 * Found automatically from index.html (opened in headless Chrome):
 *   - placeholder pages ("To be completed")
 *   - "Photo" circles where a portrait is still missing
 *   - pictures that print below 150 dpi at their size on the page
 * Added from data/status.json: what needs a person — questions, photos that
 * were asked for, and recently done items.
 *
 * Run after build.js:  node scripts/status.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const MIN_DPI = 150;
const SITE = 'https://mjoseph11.github.io/souvenir/';

const chrome = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => fs.existsSync(p));
if (!chrome) { console.error('No Chrome/Edge found. Set CHROME=/path/to/chrome.'); process.exit(2); }

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// PAGE comments run in the same order as the .page elements.
const labels = [...html.matchAll(/PAGE (\d+) — ([^\n]*)/g)].map((m) => ({ n: Number(m[1]), label: m[2].trim() }));
const byLabel = new Map(labels.map((l) => [l.label, l.n]));

/* ── scan the laid-out book ── */
const scan = `<script>
window.addEventListener('load', function () {
  var IN = 96, MIN = ${MIN_DPI}, out = [];
  document.querySelectorAll('.page').forEach(function (pg, i) {
    var h1 = pg.querySelector('.page-header h1');
    var rec = { i: i, title: h1 ? h1.textContent.trim() : '', placeholder: null, missing: [], lowres: [] };
    var ph = pg.querySelector('.m-placeholder');
    if (ph) {
      var h2 = ph.querySelector('h2'), plan = ph.querySelector('.m-plan');
      rec.placeholder = { heading: h2 ? h2.textContent.trim() : '', plan: plan ? plan.textContent.replace(/^Planned length:\\s*/, '').trim() : '' };
    }
    pg.querySelectorAll('div').forEach(function (d) {
      if (d.children.length || d.textContent.trim() !== 'Photo') return;
      var nm = d.nextElementSibling;
      rec.missing.push(nm ? nm.textContent.trim() : '');
    });
    pg.querySelectorAll('img').forEach(function (im) {
      if (!im.naturalWidth || im.closest('.page-header')) return;
      var r = im.getBoundingClientRect();
      if (r.width < IN || r.height < IN) return;               // logos, seals, small marks
      var sx = r.width / im.naturalWidth, sy = r.height / im.naturalHeight;
      var fit = getComputedStyle(im).objectFit;
      var s = fit === 'cover' ? Math.max(sx, sy) : fit === 'contain' ? Math.min(sx, sy) : Math.max(sx, sy);
      var dpi = IN / s;
      if (dpi >= MIN) return;
      var fig = im.closest('figure'), cap = fig && fig.querySelector('figcaption');
      rec.lowres.push({ dpi: Math.round(dpi), what: (cap && cap.textContent.trim()) || im.getAttribute('alt') || '', src: im.getAttribute('src') });
    });
    out.push(rec);
  });
  var pre = document.createElement('pre'); pre.id = 'status-scan'; pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
});
</script>`;
const tmp = path.join(root, '.status-scan.html');
fs.writeFileSync(tmp, html.replace('</body>', scan + '\n</body>'));
let dom;
try {
  dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,1400',
    '--virtual-time-budget=60000', '--dump-dom', pathToFileURL(tmp).href], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
} finally {
  fs.unlinkSync(tmp);
}
const m = dom.match(/<pre id="status-scan">([\s\S]*?)<\/pre>/);
if (!m) { console.error('Status scan not found — did the page finish loading?'); process.exit(2); }
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const pages = JSON.parse(decode(m[1]));
// The back cover is the one page without a PAGE comment, and it comes last.
if (pages.length !== labels.length + 1) console.warn(`! ${pages.length} pages laid out but ${labels.length} PAGE comments`);

/* ── collect ── */
const num = (p) => (labels[p.i] ? labels[p.i].n : p.i + 1);
const todo = [], lowres = [], questions = [], done = [];
for (const p of pages) {
  if (p.placeholder) todo.push({ n: num(p), text: p.placeholder.heading && p.placeholder.heading !== p.title ? `${p.title}: ${p.placeholder.heading}` : p.title, note: p.placeholder.plan ? `planned: ${p.placeholder.plan}` : '' });
  for (const name of p.missing) todo.push({ n: num(p), text: `${p.title}: photo missing — ${name || 'one portrait'}` });
  for (const l of p.lowres) {
    const what = l.what || path.basename(l.src).replace(/\.[a-z]+$/i, '');
    lowres.push({ n: num(p), text: `${p.title}${what && what !== p.title ? ` — ${what}` : ''}`, note: `${l.dpi} dpi` });
  }
}
const status = JSON.parse(fs.readFileSync(path.join(root, 'data/status.json'), 'utf8'));
for (const it of status.items) {
  const n = it.label ? byLabel.get(it.label) : undefined;
  if (it.label && n === undefined) console.warn(`! status.json: no page labelled "${it.label}"`);
  const row = { n, text: it.text, note: [it.waiting && `waiting on ${it.waiting}`, it.asked && `asked ${it.asked}`].filter(Boolean).join(' · ') };
  if (it.done) done.push({ ...row, note: `done ${it.done}` });
  else if (it.kind === 'question') questions.push(row);
  else todo.push(row);
}
const byPage = (a, b) => (a.n ?? 9999) - (b.n ?? 9999);
[todo, lowres, questions, done].forEach((l) => l.sort(byPage));

/* ── write status.html ── */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
const total = pages.length;
const list = (rows) => rows.length
  ? `<ol>${rows.map((r) => `<li><span class="pg">${r.n ? `p. ${r.n}` : ''}</span><span class="tx">${esc(r.text)}${r.note ? ` <em>${esc(r.note)}</em>` : ''}</span></li>`).join('')}</ol>`
  : '<p class="none">Nothing open.</p>';
const section = (title, rows, hint) => `<section><h2>${title} <span class="count">${rows.length}</span></h2>${hint ? `<p class="hint">${hint}</p>` : ''}${list(rows)}</section>`;

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Souvenir status — SGMOC Golden Jubilee</title>
<!-- Generated by scripts/status.js — edit data/status.json, not this file. -->
<style>
  body { margin: 0; background: #faf6ee; color: #2b2622; font: 16px/1.45 Georgia, serif; }
  header { background: #6B0000; color: #F1CF78; padding: 18px 20px 14px; border-bottom: 3px solid #C9A227; }
  header h1 { margin: 0; font-size: 22px; font-weight: normal; }
  header p { margin: 4px 0 0; color: #f3e3bf; font-size: 14px; }
  header a { color: #F1CF78; }
  main { max-width: 760px; margin: 0 auto; padding: 8px 16px 40px; }
  h2 { color: #6B0000; font-size: 19px; font-weight: normal; border-bottom: 1px solid #C9A227; padding-bottom: 4px; margin: 26px 0 8px; }
  .count { display: inline-block; min-width: 22px; padding: 0 7px; border-radius: 11px; background: #6B0000; color: #fff; font-size: 13px; text-align: center; vertical-align: 2px; }
  .hint { margin: 0 0 6px; color: #7a6a55; font-size: 14px; }
  ol { list-style: none; margin: 0; padding: 0; }
  li { display: flex; gap: 10px; padding: 7px 0; border-bottom: 1px solid #ece2cf; }
  .pg { flex: none; width: 58px; color: #8a6212; font-variant-numeric: tabular-nums; }
  .tx { min-width: 0; overflow-wrap: anywhere; }
  .tx em { color: #7a6a55; font-size: 14px; }
  .none { color: #7a6a55; font-style: italic; }
  section.done li { color: #7a6a55; }
</style>
</head>
<body>
<header>
  <h1>Golden Jubilee Souvenir — open items</h1>
  <p>Updated ${esc(when)} · ${total} pages · <a href="${SITE}">open the souvenir</a></p>
</header>
<main>
${section('To be completed', todo, 'Pages and photos still to come. Page numbers are from the current book and update on their own.')}
${section('Low-quality pictures', lowres, `These print below ${MIN_DPI} dpi at their size on the page — a larger copy of the original is needed.`)}
${section('Questions', questions)}
<section class="done"><h2>Recently done <span class="count">${done.length}</span></h2>${list(done)}</section>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'status.html'), out);
console.log(`✓ status.html: ${todo.length} to complete, ${lowres.length} low-quality pictures, ${questions.length} questions, ${done.length} done`);
