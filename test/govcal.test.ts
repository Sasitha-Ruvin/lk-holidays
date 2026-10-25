import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeLanguages, validate } from '../scripts/lib/cbsl.js';
import { govCalendarUrls, parseGovCalendarText, pdfToText } from '../scripts/lib/govcal.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = (name: string) => join(here, 'fixtures', name);
const fixture = (name: string) => readFileSync(fixturePath(name));

// The 2024 holidays as published by CBSL (data/2024.json), used as the answer key:
// the Government calendar must produce exactly the same dates and categories.
const cbsl2024 = JSON.parse(readFileSync(join(here, '..', 'data', '2024.json'), 'utf8')) as {
  holidays: Array<{ date: string; key: string; categories: string[] }>;
};
const summary = (list: Array<{ date: string; key: string; categories: string[] }>) =>
  list.map((h) => `${h.date} ${h.key} ${h.categories.join(',')}`);

test('Government calendar URLs', () => {
  assert.ok(govCalendarUrls(2028).every((u) => u.endsWith('/2028/2028_E.pdf')));
});

test('Government calendar text: same holidays and categories as CBSL 2024', () => {
  // Text exactly as extracted from documents.gov.lk/view/cdr/2024/2024_E.pdf,
  // including its spacing glitches ("T amil", "T hursday", "0 1").
  const rows = parseGovCalendarText(fixture('gov-2024.txt').toString('utf8'));
  assert.equal(rows.length, 25);
  const { holidays, warnings } = mergeLanguages(2024, rows);
  assert.deepEqual(warnings, []);
  assert.deepEqual(validate(2024, holidays), []);
  assert.deepEqual(summary(holidays), summary(cbsl2024.holidays));
});

test('Government calendar: spelling differences are normalised', () => {
  const rows = parseGovCalendarText(fixture('gov-2024.txt').toString('utf8'));
  const names = rows.map((r) => r.name);
  assert.ok(names.includes('Tamil Thai Pongal Day')); // was "T amil"
  assert.ok(names.includes('Navam Full Moon Poya Day')); // was "Nawam"
  assert.ok(names.includes('Ill Full Moon Poya Day')); // was "Il"
  assert.ok(names.includes('Mahasivarathri Day')); // was "Maha Sivarathri"
  const mayDay = rows.find((r) => r.month === 5 && r.day === 1)!; // was "0 1"
  assert.deepEqual(mayDay.categories, ['bank', 'public', 'mercantile']);
});

// The PDF is not committed; download documents.gov.lk/view/cdr/2024/2024_E.pdf to
// test/fixtures/gov-2024.pdf to run this test.
const pdfSkip = !existsSync(fixturePath('gov-2024.pdf')) && 'fixtures/gov-2024.pdf not present';
test('Government calendar PDF: text extraction + parsing', { skip: pdfSkip }, async () => {
  const text = await pdfToText(new Uint8Array(fixture('gov-2024.pdf')));
  const { holidays } = mergeLanguages(2024, parseGovCalendarText(text));
  assert.deepEqual(summary(holidays), summary(cbsl2024.holidays));
});

test('lines without holiday markers are ignored', () => {
  const rows = parseGovCalendarText(
    '* Public Holidays † Bank Holidays ‡ Mercantile Holidays\nJanuary 2024\nAll Saturdays and Sundays are Bank Holidays.',
  );
  assert.equal(rows.length, 0);
});