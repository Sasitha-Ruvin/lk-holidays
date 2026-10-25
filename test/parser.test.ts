import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanText,
  mergeLanguages,
  pageUrl,
  parseDateCell,
  parseEnglishText,
  parsePage,
  splitCodes,
  validate,
} from '../scripts/lib/cbsl.js';
import { lookup } from '../scripts/lib/dictionary.js';

const fixture = (name: string) =>
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', name), 'utf8');

test('page URLs follow the CBSL pattern', () => {
  assert.equal(pageUrl(2028, 'en'), 'https://www.cbsl.gov.lk/en/about/about-the-bank/bank-holidays-2028');
  assert.equal(pageUrl(2028, 'si'), 'https://www.cbsl.gov.lk/si/about/about-the-bank/bank-holidays-2028-s');
  assert.equal(pageUrl(2028, 'ta'), 'https://www.cbsl.gov.lk/ta/about/about-the-bank/bank-holidays-2028-t');
});

test('date cells in all three languages and both English formats', () => {
  assert.deepEqual(parseDateCell('15 January, Friday', 'en'), { month: 1, day: 15 });
  assert.deepEqual(parseDateCell('January 03, Saturday', 'en'), { month: 1, day: 3 });
  assert.deepEqual(parseDateCell('May 01, Friday', 'en'), { month: 5, day: 1 });
  assert.deepEqual(parseDateCell('March 08, Monday', 'en'), { month: 3, day: 8 });
  assert.deepEqual(parseDateCell('අප්‍රේල් 13, අඟහරුවාදා', 'si'), { month: 4, day: 13 });
  assert.deepEqual(parseDateCell('දෙසැම්බර් 25, සෙනසුරාදා', 'si'), { month: 12, day: 25 });
  assert.deepEqual(parseDateCell('ஓகத்து 15 ஞாயிற்றுக்கிழமை', 'ta'), { month: 8, day: 15 });
  assert.equal(parseDateCell('Date', 'en'), undefined);
});

test('category codes are split off in every language', () => {
  assert.deepEqual(splitCodes('Tamil Thai Pongal Day B. P. M.', 'en'), {
    name: 'Tamil Thai Pongal Day',
    categories: ['bank', 'public', 'mercantile'],
  });
  assert.deepEqual(splitCodes('Special Bank Holiday B.', 'en'), { name: 'Special Bank Holiday', categories: ['bank'] });
  assert.deepEqual(splitCodes('නත්තල් දිනය    බැ.ර.වෙ.', 'si'), {
    name: 'නත්තල් දිනය',
    categories: ['bank', 'public', 'mercantile'],
  });
  assert.deepEqual(splitCodes('பெரிய வெள்ளி வ.அ.', 'ta'), { name: 'பெரிய வெள்ளி', categories: ['bank', 'public'] });
});

test('text clean-up keeps Sinhala conjuncts and removes stray joiners', () => {
  assert.equal(cleanText('බක් පුර \u200dපසළොස්වක'), 'බක් පුර පසළොස්වක');
  assert.equal(cleanText('ශ්\u200dරී'), 'ශ්\u200dරී');
  assert.equal(cleanText('தொழிலாளா்கள்'), 'தொழிலாளர்கள்');
});

test('English page: table rows parsed, junk in <script> ignored', () => {
  const rows = parsePage(fixture('en-2027.html'), 'en');
  assert.equal(rows.length, 25);
  assert.deepEqual(rows[0], { month: 1, day: 15, name: 'Tamil Thai Pongal Day', categories: ['bank', 'public', 'mercantile'] });
  assert.equal(rows.at(-1)!.name, 'Christmas Day');
});

test('Sinhala page: table parsed (including CBSL date typo row)', () => {
  const rows = parsePage(fixture('si-2027.html'), 'si');
  assert.equal(rows.length, 25);
  assert.equal(rows[4].month, 2); // CBSL lists Mahasivarathri under February by mistake
});

test('Tamil page without a <table>: line fallback parser', () => {
  const rows = parsePage(fixture('ta-2027.html'), 'ta');
  assert.equal(rows.length, 25);
  assert.equal(rows[0].name, 'தமிழ் தைப்பொங்கல் தினம்');
});

test('merge: English dates win, names from dictionary, validation passes', () => {
  const en = parsePage(fixture('en-2027.html'), 'en');
  const si = parsePage(fixture('si-2027.html'), 'si');
  const ta = parsePage(fixture('ta-2027.html'), 'ta');
  const { holidays, warnings } = mergeLanguages(2027, en, si, ta);
  assert.deepEqual(warnings, []);
  assert.deepEqual(validate(2027, holidays), []);
  const shivaratri = holidays.find((h) => h.key === 'mahasivarathri')!;
  assert.equal(shivaratri.date, '2027-03-06');
  assert.equal(shivaratri.name.si, 'මහා ශිවරාත්‍රී දිනය');
  const vesak = holidays.find((h) => h.key === 'vesak-poya')!;
  assert.equal(vesak.name.ta, 'வெசாக் முழு நோன்மதி தினம்');
  assert.equal(vesak.isPoya, true);
});

test('merge: unknown holiday takes Sinhala/Tamil from the CBSL pages', () => {
  const en = [{ month: 6, day: 12, name: 'Special Public Holiday', categories: ['public' as const] }];
  const si = [{ month: 6, day: 12, name: 'විශේෂ රජයේ නිවාඩු දිනය', categories: ['public' as const] }];
  const ta = [{ month: 6, day: 12, name: 'விசேட அரச விடுமுறை', categories: ['public' as const] }];
  const { holidays } = mergeLanguages(2028, en, si, ta);
  assert.equal(holidays[0].key, 'special-public-holiday');
  assert.equal(holidays[0].name.si, 'විශේෂ රජයේ නිවාඩු දිනය');
  assert.equal(holidays[0].name.ta, 'விசேட அரச விடுமுறை');
});

test('dictionary recognises every spelling CBSL has used', () => {
  const cases: Record<string, string> = {
    'Id-Ul-Fitre (Ramazan Festival Day)': 'eid-ul-fitr',
    'Eid-Ul-Fitr (Ramazan Festival Day)': 'eid-ul-fitr',
    'Id-Ul-Allah (Hadji Festival Day)': 'eid-ul-adha',
    'Eid-Ul-Allha (Hadji Festival Day)': 'eid-ul-adha',
    'Id-Ul-Alha (Hadji Festival Day)': 'eid-ul-adha',
    "Milad-Un-Nabi (Holy Prophet's Birthday)": 'milad-un-nabi',
    'Deepawali Festival Day': 'deepavali',
    'Deepavali Festival Day': 'deepavali',
    'Unduwap Full Moon Poya Day': 'unduvap-poya',
    'Madin Full Moon Poya Day': 'medin-poya',
    'Adhi Poson Full Moon Poya Day': 'adhi-poson-poya',
    'Day following Vesak Full Moon Poya Day': 'day-after-vesak',
    'Day prior to Sinhala & Tamil New Year Day': 'new-year-eve',
    'Sinhala & Tamil New Year Day': 'new-year',
    'May Day (International Workers’ Day)': 'may-day',
    'Mahasivarathri Day': 'mahasivarathri',
  };
  for (const [name, key] of Object.entries(cases)) assert.equal(lookup(name)?.key, key, name);
});

test('import-text format', () => {
  const rows = parseEnglishText(
    '15 January, Friday | Tamil Thai Pongal Day B. P. M.\n\nJanuary 03, Saturday   Duruthu Full Moon Poya Day B. P.\nB – Bank Holiday',
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], { month: 1, day: 3, name: 'Duruthu Full Moon Poya Day', categories: ['bank', 'public'] });
});