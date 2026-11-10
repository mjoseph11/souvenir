#!/usr/bin/env node
/* Copies only what the published pages use into _site/ for GitHub Pages.
   The repo holds ~380 MB of images (logo variants, review copies, originals);
   publishing all of it made Pages deploys slow and often fail. Each published
   page is scanned for local src=, href= and url(...) references.
   Usage: node scripts/pack-site.js [outDir]   (default _site) */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.resolve(root, process.argv[2] || '_site');
// The book itself; compare.html, preview-style.html and the review pages are dev tools.
const pages = ['index.html', 'index-print.html'].filter((f) => fs.existsSync(path.join(root, f)));

const decode = (s) => {
  s = s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  try { return decodeURIComponent(s); } catch { return s; }
};
const files = new Set(['.nojekyll', ...pages]);
const missing = new Set();
const ref = /(?:\bsrc|\bhref)\s*=\s*"([^"]+)"|(?:\bsrc|\bhref)\s*=\s*'([^']+)'|url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/g;

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const m of html.matchAll(ref)) {
    let u = m.slice(1).find(Boolean);
    if (!u || /^(?:[a-z]+:|\/\/|#|data:)/i.test(u)) continue; // external, anchors, inline data
    u = decode(u.split(/[?#]/)[0]).replace(/^\.\//, '').replace(/^\//, '');
    if (!u) continue;
    if (fs.existsSync(path.join(root, u)) && fs.statSync(path.join(root, u)).isFile()) files.add(u);
    else missing.add(`${page}: ${u}`);
  }
}

fs.rmSync(out, { recursive: true, force: true });
let bytes = 0;
for (const f of files) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) continue;
  const dst = path.join(out, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  bytes += fs.statSync(src).size;
}
console.log(`✓ ${out}: ${files.size} files, ${(bytes / 1048576).toFixed(1)} MB`);
if (missing.size) console.log(`  ${missing.size} referenced file(s) not found:\n  ` + [...missing].slice(0, 20).join('\n  '));
