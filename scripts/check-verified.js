#!/usr/bin/env node
/**
 * check-verified.js — guards against silent regressions of VERIFIED content.
 *
 * Reads data/verified-facts.json and asserts, against index.html, that:
 *   - every fact's `expected` string is present, and
 *   - none of its `forbidden` (previously-corrected) strings reappear.
 *
 * A fact may set `scope`: text that appears in the PAGE comment of the page(s)
 * it belongs to (e.g. "MINISTRY: MMVS"). The check then looks only at those
 * pages, so the same name used correctly elsewhere in the book is not flagged.
 *
 * Exits non-zero on any violation so CI (and an optional pre-commit hook)
 * blocks the change. Add a fact to verified-facts.json whenever a name/detail
 * is confirmed by a person or issue.
 *
 * Run locally:  node scripts/check-verified.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const { facts } = JSON.parse(
  fs.readFileSync(path.join(root, 'data', 'verified-facts.json'), 'utf8')
);

// Split the book into pages using the PAGE comments that scripts/build.js writes.
// \r? so the check also works on a Windows checkout with CRLF line endings.
const marker = /<!-- ═+\r?\n     (PAGE \d+ — .+?|BACK COVER)\r?\n═+ -->\r?\n/g;
const pages = [];
let m;
let last = null;
while ((m = marker.exec(html))) {
  if (last) pages.push({ label: last.label, html: html.slice(last.end, m.index) });
  last = { label: m[1], end: marker.lastIndex };
}
if (last) pages.push({ label: last.label, html: html.slice(last.end) });

const failures = [];

for (const fact of facts) {
  const { id, label, expected, forbidden = [], source, scope } = fact;

  let haystack = html;
  let where = 'index.html';
  if (scope) {
    const scoped = pages.filter((p) => p.label.includes(scope));
    if (!scoped.length) {
      failures.push(`NO PAGE  [${id}] ${label}: no page labelled "${scope}" in index.html\n         source: ${source}`);
      continue;
    }
    haystack = scoped.map((p) => p.html).join('\n');
    where = `the "${scope}" page`;
  }

  if (expected && !haystack.includes(expected)) {
    failures.push(
      `MISSING  [${id}] ${label}: expected "${expected}" not found in ${where}\n` +
      `         source: ${source}`
    );
  }

  for (const bad of forbidden) {
    if (haystack.includes(bad)) {
      failures.push(
        `REVERTED [${id}] ${label}: forbidden value "${bad}" reappeared in ${where} ` +
        `(should be "${expected}")\n         source: ${source}`
      );
    }
  }
}

if (failures.length) {
  console.error('\n✗ Verified-facts check FAILED:\n');
  for (const f of failures) console.error('  ' + f + '\n');
  console.error(
    `${failures.length} violation(s). If a change is intentional, update ` +
    `data/verified-facts.json (and confirm with the source) — do not just edit index.html.\n`
  );
  process.exit(1);
}

console.log(`✓ Verified-facts check passed (${facts.length} fact(s)).`);
