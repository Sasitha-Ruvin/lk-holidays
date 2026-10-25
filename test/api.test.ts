import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addWorkingDays,
  countWorkingDays,
  getAvailableYears,
  getDataInfo,
  getHolidayName,
  getHolidays,
  getHolidaysBetween,
  getHolidaysInMonth,
  getHolidaysOn,
  getNextHoliday,
  getPoyaDays,
  getWorkingDays,
  hasYear,
  isBankHoliday,
  isHoliday,
  isMercantileHoliday,
  isPoyaDay,
  isPublicHoliday,
  isWorkingDay,
  nextWorkingDay,
  toISODate,
} from '../src/index.js';

test('bundled years', () => {
  const years = getAvailableYears();
  assert.ok(years.includes(2026) && years.includes(2027));
  assert.ok(hasYear(2027));
  assert.ok(!hasYear(1990));
  assert.match(getDataInfo().lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
});

test('every year: sorted, valid, 12–13 poyas, has all three languages', () => {
  for (const y of getAvailableYears()) {
    const list = getHolidays(y);
    const dates = list.map((h) => h.date);
    assert.deepEqual(dates, [...dates].sort(), `${y} sorted`);
    const poyas = list.filter((h) => h.isPoya).length;
    assert.ok(poyas === 12 || poyas === 13, `${y} poyas=${poyas}`);
    for (const h of list) {
      assert.ok(h.date.startsWith(String(y)));
      assert.ok(h.name.en && h.name.si && h.name.ta, `${h.date} names`);
      assert.match(h.name.si, /[\u0D80-\u0DFF]/, `${h.date} Sinhala script`);
      assert.match(h.name.ta, /[\u0B80-\u0BFF]/, `${h.date} Tamil script`);
      assert.ok(h.categories.length > 0);
    }
  }
});

test('lookups by date', () => {
  assert.equal(isHoliday('2027-04-14'), true);
  assert.equal(isHoliday('2027-04-15'), false);
  const [ny] = getHolidaysOn('2027-04-14');
  assert.equal(ny.key, 'new-year');
  assert.equal(getHolidayName(ny, 'si'), 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය');
  assert.equal(getHolidayName(ny, 'ta'), 'சிங்கள, தமிழ் புத்தாண்டு');
});

test('two holidays on the same day (2026-05-01 Vesak + May Day)', () => {
  const list = getHolidaysOn('2026-05-01');
  assert.deepEqual(list.map((h) => h.key).sort(), ['may-day', 'vesak-poya']);
  assert.equal(isPoyaDay('2026-05-01'), true);
});

test('category filters', () => {
  // Poya days are bank + public, NOT mercantile
  assert.equal(isPublicHoliday('2027-01-22'), true);
  assert.equal(isBankHoliday('2027-01-22'), true);
  assert.equal(isMercantileHoliday('2027-01-22'), false);
  // 2025-04-15 Special Bank Holiday is bank only
  assert.equal(isBankHoliday('2025-04-15'), true);
  assert.equal(isPublicHoliday('2025-04-15'), false);
  const merc = getHolidays(2027, { categories: 'mercantile' });
  assert.ok(merc.length >= 8 && merc.every((h) => h.categories.includes('mercantile')));
});

test('Date objects are read in Sri Lanka time', () => {
  // 2027-04-13T20:00Z is already 2027-04-14 01:30 in Colombo
  assert.equal(toISODate(new Date('2027-04-13T20:00:00Z')), '2027-04-14');
  assert.equal(isHoliday(new Date('2027-04-13T20:00:00Z')), true);
  assert.throws(() => toISODate('2027-02-30'));
  assert.throws(() => toISODate('14/04/2027'));
});

test('ranges, months, next holiday, poya list', () => {
  const april = getHolidaysInMonth(2027, 4);
  assert.deepEqual(april.map((h) => h.date), ['2027-04-13', '2027-04-14', '2027-04-20']);
  const span = getHolidaysBetween('2026-12-20', '2027-01-20');
  assert.deepEqual(span.map((h) => h.key), ['unduvap-poya', 'christmas', 'thai-pongal']);
  assert.equal(getNextHoliday('2027-04-15')!.key, 'bak-poya');
  assert.equal(getPoyaDays(2026).length, 13); // 2026 has Adhi Poson
  assert.equal(getPoyaDays(2027).length, 12);
});

test('missing year throws instead of silently returning nothing', () => {
  assert.throws(() => getHolidays(1990), /No holiday data for 1990/);
  assert.throws(() => isWorkingDay('1990-01-02'), /No holiday data/);
});

test('working days for attendance/payroll', () => {
  // April 2027: 22 weekdays, minus New Year eve (Tue 13), New Year (Wed 14), Bak Poya (Tue 20)
  assert.equal(countWorkingDays('2027-04-01', '2027-04-30'), 19);
  assert.equal(isWorkingDay('2027-04-13'), false);
  assert.equal(isWorkingDay('2027-04-17'), false); // Saturday
  assert.equal(isWorkingDay('2027-04-17', { weekendDays: [0] }), true); // 6-day week
  // Mercantile-only: Poya days are working days
  assert.equal(isWorkingDay('2027-04-20', { categories: 'mercantile' }), true);
  // Company-specific overrides
  assert.equal(isWorkingDay('2027-04-15', { extraHolidays: ['2027-04-15'] }), false);
  assert.equal(isWorkingDay('2027-04-13', { extraWorkingDays: ['2027-04-13'] }), true);

  assert.equal(nextWorkingDay('2027-04-12'), '2027-04-15');
  assert.equal(addWorkingDays('2027-04-15', -1), '2027-04-12');
  assert.equal(getWorkingDays('2027-04-12', '2027-04-16').length, 3);
});

test('returned objects are copies (callers cannot corrupt the data)', () => {
  const [h] = getHolidaysOn('2027-12-25');
  h.name.en = 'changed';
  h.categories.push('mercantile');
  assert.equal(getHolidaysOn('2027-12-25')[0].name.en, 'Christmas Day');
});