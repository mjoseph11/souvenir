#!/usr/bin/env node
/**
 * member-pdfs.js — one print-quality PDF per family, named after the member.
 *
 * Splits index.html at its PAGE markers, keeps the "MEMBER PAGE: <name>" ones,
 * groups the multi-page families back together, and prints each group through
 * headless Chrome. The head (styles, fonts, the gold seal) is carried over
 * verbatim, so a proof is pixel-identical to the same page in the book — same
 * Letter size, same full-resolution photos, text still vector.
 *
 * Run:  node scripts/member-pdfs.js              → build/member-pdfs/
 *       node scripts/member-pdfs.js --only=Joseph  (substring filter, for a retry)
 *       CHROME=/path/to/chrome node scripts/member-pdfs.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'build', 'member-pdfs');
const workDir = path.join(root, 'build', '.member-pdf-work');

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = candidates.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('No Chrome/Edge found. Set CHROME=/path/to/chrome.');
  process.exit(2);
}

const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).toLowerCase();
// --pages=1,24,77 puts those book pages in one PDF instead, for a print sample.
const pagesArg = (process.argv.find((a) => a.startsWith('--pages=')) || '').slice(8);
const outArg = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Everything before the first page marker is the head + <body> opening: reused as-is
// so the proof inherits every style rule the book page had.
const MARKER = /<!-- ═{10,}\r?\n\s+(PAGE \d+ — [^\r\n]+|BACK COVER)\r?\n\s*═{10,} -->/g;

const marks = [];
for (let m; (m = MARKER.exec(html)); ) marks.push({ label: m[1], start: m.index, end: MARKER.lastIndex });
if (!marks.length) {
  console.error('No PAGE markers found in index.html — run scripts/build.js first.');
  process.exit(2);
}

let preamble = html.slice(0, marks[0].start);

/* ── Slim the header seal ──
 * SGMOC_Official_logo_Gold.png is 5120x5120 (28 MB on disk, ~48 MB once Chrome
 * re-encodes it). The page header paints it at 0.55in — about 9,000 dpi. Chrome
 * embeds it whole, so every proof would weigh ~50 MB for one decorative seal.
 * A 1024px copy is still 1,860 dpi at that size: past any press requirement,
 * and it takes a family's proof from 50 MB to about 2 MB. The repo asset is
 * left alone — this copy lives in build/ and is only used for the proofs. */
const SEAL = 'images/Logos/SGMOC_Official_logo_Gold.png';
const sealProof = path.join(root, 'build', '.proof-assets', 'seal-1024.png');
if (!fs.existsSync(sealProof)) {
  fs.mkdirSync(path.dirname(sealProof), { recursive: true });
  try {
    execFileSync(process.env.PYTHON || 'python',
      ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.thumbnail((1024,1024),Image.LANCZOS);im.save(sys.argv[2])',
       path.join(root, SEAL), sealProof],
      { stdio: 'pipe' });
  } catch (e) {
    console.warn('! Could not downsample the header seal (needs python + Pillow).');
    console.warn('  Proofs will still be correct, but each one will be ~50 MB.');
  }
}
if (fs.existsSync(sealProof)) {
  preamble = preamble.split(SEAL).join('build/.proof-assets/seal-1024.png');
}
// The tail after the last page: closing </body></html> plus the layout-check script.
const tail = '\n</body>\n</html>\n';

const pages = marks.map((mk, i) => ({
  label: mk.label,
  html: html.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : html.length),
}));

/* ── --pages: an arbitrary selection, in one PDF ── */

if (pagesArg) {
  const want = pagesArg.split(',').map((s) => s.trim());
  const picked = [];
  for (const w of want) {
    const p = pages.find((x) => x.label === 'BACK COVER'
      ? w.toLowerCase() === 'back'
      : x.label.startsWith(`PAGE ${w} —`));
    if (!p) {
      console.error(`No page "${w}" in index.html.`);
      process.exit(2);
    }
    picked.push(p);
  }

  const out = path.resolve(root, outArg || 'build/sample.pdf');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = path.join(root, `.sample-${process.pid}.html`);
  fs.writeFileSync(tmp, preamble + picked.map((p) => p.html).join('\n') + tail, 'utf8');
  try {
    execFileSync(chrome,
      ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
       '--virtual-time-budget=30000', '--no-pdf-header-footer', `--print-to-pdf=${out}`, tmp],
      { stdio: 'pipe', timeout: 180000 });
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  console.log(`${picked.length} pages -> ${path.relative(root, out)} ` +
              `(${Math.round(fs.statSync(out).size / 1024)} KB)`);
  for (const p of picked) console.log(`   ${p.label}`);
  process.exit(0);
}

/* ── Group the member pages by family ── */

const groups = new Map(); // name -> { name, number, pages: [html] }
for (const p of pages) {
  const m = p.label.match(/^PAGE (\d+) — MEMBER PAGE: (.+?)(?: \(\d+ of \d+\))?$/);
  if (!m) continue;
  const [, number, name] = m;
  if (!groups.has(name)) groups.set(name, { name, number: Number(number), pages: [] });
  const g = groups.get(name);
  // A family's pages are contiguous in the book, but guard the page number anyway.
  g.number = Math.min(g.number, Number(number));
  g.pages.push(p.html);
}

let list = [...groups.values()].sort((a, b) => a.number - b.number);
if (only) list = list.filter((g) => g.name.toLowerCase().includes(only));

if (!list.length) {
  console.error(only ? `No member matched --only=${only}` : 'No member pages found.');
  process.exit(2);
}

/* ── Print ── */

// Drive, Windows and macOS each dislike a different set of characters; strip the union.
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();

fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const failures = [];
list.forEach((g, i) => {
  const base = safe(g.name);
  // Chrome resolves images relative to the HTML file, so the scratch page has to
  // live at the repo root for images/... to keep pointing at the real photos.
  const tmp = path.join(root, `.member-proof-${process.pid}.html`);
  fs.writeFileSync(tmp, preamble + g.pages.join('\n') + tail, 'utf8');

  const pdf = path.join(outDir, `${base}.pdf`);
  try {
    execFileSync(
      chrome,
      ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
       '--virtual-time-budget=30000', '--no-pdf-header-footer',
       `--print-to-pdf=${pdf}`, tmp],
      { stdio: 'pipe', timeout: 120000 }
    );
    const kb = Math.round(fs.statSync(pdf).size / 1024);
    console.log(`  ${String(i + 1).padStart(3)}/${list.length}  p${g.number}  ${base}.pdf  (${g.pages.length} page${g.pages.length > 1 ? 's' : ''}, ${kb} KB)`);
  } catch (e) {
    failures.push(g.name);
    console.error(`  ✗ ${base}: ${e.message.split('\n')[0]}`);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

fs.rmSync(workDir, { recursive: true, force: true });

console.log(`\n${list.length - failures.length} PDF${list.length - failures.length === 1 ? '' : 's'} in build/member-pdfs/`);
if (failures.length) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}
