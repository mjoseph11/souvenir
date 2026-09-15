#!/usr/bin/env node
/**
 * check-layout.js — opens index.html in headless Chrome and reports pages whose
 * content overflows the page, runs under the footer, has broken images, or
 * squeezes a photo too small. Uses the self-check script that build.js puts in
 * index.html (it only runs when the URL ends in #layout-check).
 *
 * Run:  node scripts/check-layout.js          (exit 1 if any problems)
 *       CHROME=/path/to/chrome node scripts/check-layout.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
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

const url = pathToFileURL(path.join(root, 'index.html')).href + '#layout-check';
const dom = execFileSync(
  chrome,
  ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,1400',
   '--virtual-time-budget=60000', '--dump-dom', url],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
);

const m = dom.match(/<pre id="layout-report">([\s\S]*?)<\/pre>/);
if (!m) {
  console.error('Layout report not found — did the page finish loading?');
  process.exit(2);
}
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const report = JSON.parse(decode(m[1]));

if (!report.problems.length) {
  console.log(`✓ Layout check passed (${report.pages} pages).`);
  process.exit(0);
}
console.error(`✗ Layout problems on ${report.problems.length} of ${report.pages} pages:\n`);
for (const p of report.problems) {
  console.error(`  p${p.page} ${p.title}`);
  for (const issue of p.issues) console.error(`      ${issue}`);
}
process.exit(1);
