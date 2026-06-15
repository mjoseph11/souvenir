#!/usr/bin/env node
/**
 * check-verified.js — guards against silent regressions of VERIFIED content.
 *
 * Reads data/verified-facts.json and asserts, against index.html, that:
 *   - every fact's `expected` string is present, and
 *   - none of its `forbidden` (previously-corrected) strings reappear.
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

const failures = [];

for (const fact of facts) {
  const { id, label, expected, forbidden = [], source } = fact;

  if (expected && !html.includes(expected)) {
    failures.push(
      `MISSING  [${id}] ${label}: expected "${expected}" not found in index.html\n` +
      `         source: ${source}`
    );
  }

  for (const bad of forbidden) {
    if (html.includes(bad)) {
      failures.push(
        `REVERTED [${id}] ${label}: forbidden value "${bad}" reappeared in index.html ` +
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
