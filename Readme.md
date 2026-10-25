# lk-holidays 🇱🇰

[![npm version](https://img.shields.io/npm/v/lk-holidays.svg)](https://www.npmjs.com/package/lk-holidays)
[![CI](https://github.com/Sasitha-Ruvin/lk-holidays/actions/workflows/ci.yml/badge.svg)](https://github.com/Sasitha-Ruvin/lk-holidays/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/lk-holidays.svg)](LICENSE)

Sri Lankan **public, bank and mercantile holidays**, taken from the
[Central Bank of Sri Lanka (CBSL)](https://www.cbsl.gov.lk/en/about/about-the-bank/bank-holidays-2027),
with names in **English, සිංහල and தமிழ்**. Built for attendance systems,
payroll, leave management, calendars and anything else that needs to know
whether a day in Sri Lanka is a working day.

- **Official data:** dates and the CBSL **B / P / M** (Bank / Public / Mercantile) flags
- **Three languages:** English, Sinhala and Tamil name for every holiday
- **Working-day maths:** count, list and add working days, with your own weekends and company holidays
- **Sri Lanka time zone aware:** `Date` objects are read in Asia/Colombo, so UTC servers get the right day
- **Updated automatically:** a GitHub Action checks CBSL regularly and publishes new years
- **Zero dependencies:** works offline, ESM + CommonJS, full TypeScript types
- **Runs anywhere:** Node 18+, browsers, React, Next.js, React Native, Bun, Deno

---

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Key concepts](#key-concepts)
- [The Holiday object](#the-holiday-object)
- [API reference](#api-reference)
  - [Lookups](#lookups)
  - [Working days](#working-days)
  - [Data coverage](#data-coverage)
  - [Custom data: `createHolidayApi`](#custom-data-createholidayapi)
  - [Date helpers](#date-helpers)
- [Recipes](#recipes)
- [Using the data without JavaScript](#using-the-data-without-javascript)
- [Holiday keys](#holiday-keys)
- [TypeScript](#typescript)
- [How the data is kept up to date](#how-the-data-is-kept-up-to-date)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## Installation

```bash
npm install lk-holidays
# or
yarn add lk-holidays
# or
pnpm add lk-holidays
```

## Quick start

```ts
import { isHoliday, getHolidaysOn, getHolidays, countWorkingDays } from 'lk-holidays';

isHoliday('2027-04-14'); // true
isHoliday('2027-04-15'); // false

const [holiday] = getHolidaysOn('2027-04-14');
holiday.name.en; // 'Sinhala & Tamil New Year Day'
holiday.name.si; // 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය'
holiday.name.ta; // 'சிங்கள, தமிழ் புத்தாண்டு'

getHolidays(2027).length; // 25

// Working days in April 2027 (Sat & Sun off, public holidays off)
countWorkingDays('2027-04-01', '2027-04-30'); // 19
```

CommonJS:

```js
const { isHoliday } = require('lk-holidays');
```

Browser without a build step:

```html
<script type="module">
  import { isHoliday } from 'https://cdn.jsdelivr.net/npm/lk-holidays/+esm';
  console.log(isHoliday('2027-04-14')); // true
</script>
```

---

## Key concepts

### Categories: public, bank, mercantile

CBSL tags each holiday with one or more categories. They decide who gets the
day off:

| Code | Category | Who it applies to |
| --- | --- | --- |
| **P** | `public` | Government offices, schools and most public services |
| **B** | `bank` | Banks and financial institutions |
| **M** | `mercantile` | Private sector (shops, offices, factories) |

For example, Full Moon **Poya days are bank and public holidays, but not
mercantile holidays**. Christmas and Sinhala & Tamil New Year are all three.

Most functions take an optional `categories` filter. Leave it out to get every
holiday CBSL lists.

```ts
getHolidays(2027).length;                                // 25 (all)
getHolidays(2027, { categories: 'public' }).length;      // 25
getHolidays(2027, { categories: 'mercantile' }).length;  // 8
getHolidays(2027, { categories: ['bank', 'mercantile'] }); // either category
```

### Weekends are not listed

CBSL notes that *all Saturdays and Sundays are bank holidays*. This package does
**not** add weekends to the holiday list. Use the [working-day
functions](#working-days), which handle weekends for you and let you choose
which days are your weekend.

### Poya days

Every Full Moon Poya day has `isPoya: true`. A year normally has 12; years
with an **Adhi** (extra) Poya have 13, as 2026 does with Adhi Poson.

### Dates and time zones

- Pass dates as `'YYYY-MM-DD'` strings or as `Date` objects.
- A `Date` is converted to the calendar date **in Sri Lanka (Asia/Colombo)**.
  On a server running in UTC, `new Date('2027-04-13T20:00:00Z')` is already
  14 April in Colombo, so it counts as New Year Day.
- All returned dates are `'YYYY-MM-DD'` strings.

### Missing years throw

If you ask about a year that isn't in the bundled data, functions **throw a
`RangeError`** instead of returning "no holidays". That way an out-of-date
package can never quietly mark Vesak as a working day in your attendance
system. Use [`hasYear()`](#data-coverage) to check first.

```ts
getHolidays(2035);
// RangeError: No holiday data for 2035. Available years: 2024, 2025, 2026, 2027.
// Update the package (npm update lk-holidays) to get newer years.
```

---

## The Holiday object

```jsonc
{
  "date": "2027-05-19",                 // YYYY-MM-DD, Sri Lanka date
  "key": "vesak-poya",                  // stable id, the same every year
  "name": {
    "en": "Vesak Full Moon Poya Day",   // as published by CBSL
    "si": "වෙසක් පුර පසළොස්වක පෝය දිනය",
    "ta": "வெசாக் முழு நோன்மதி தினம்"
  },
  "categories": ["bank", "public"],     // CBSL B / P / M flags
  "isPoya": true
}
```

| Field | Type | Description |
| --- | --- | --- |
| `date` | `string` | `YYYY-MM-DD` |
| `key` | `string` | Stable id such as `vesak-poya` or `christmas`. Use it for icons, colours or your own translations. See [Holiday keys](#holiday-keys). |
| `name.en` | `string` | English name exactly as CBSL publishes it (spelling can vary slightly between years) |
| `name.si` | `string` | Sinhala name |
| `name.ta` | `string` | Tamil name |
| `categories` | `('bank' \| 'public' \| 'mercantile')[]` | At least one category |
| `isPoya` | `boolean` | `true` for Full Moon Poya days, including Adhi Poya |

Every function returns **copies**, so changing a returned object never affects
the package's data.

---

## API reference

In the signatures below:

- `DateInput` is `string | Date` (`'YYYY-MM-DD'` or a `Date`).
- `FilterOptions` is `{ categories?: HolidayCategory | HolidayCategory[] }`.

### Lookups

#### `getHolidays(year?, options?)`

All holidays in a year, sorted by date.

```ts
getHolidays(year?: number, options?: FilterOptions): Holiday[]
```

- `year` defaults to the current year in Sri Lanka.
- Throws `RangeError` if the year isn't available.

```ts
getHolidays(2027);                               // 25 holidays
getHolidays(2027, { categories: 'mercantile' }); // 8 holidays
getHolidays();                                   // current year
```

#### `getHolidaysOn(date, options?)`

Holidays that fall on one date. Usually zero or one, but some dates have two,
such as 1 May 2026 (Vesak and May Day).

```ts
getHolidaysOn(date: DateInput, options?: FilterOptions): Holiday[]
```

```ts
getHolidaysOn('2026-05-01').map((h) => h.key); // ['may-day', 'vesak-poya']
getHolidaysOn('2027-04-15');                   // []
```

#### `getHolidaysBetween(start, end, options?)`

Holidays between two dates, inclusive. Works across years.

```ts
getHolidaysBetween(start: DateInput, end: DateInput, options?: FilterOptions): Holiday[]
```

- Throws `RangeError` if `start` is after `end`.
- Only returns holidays from years that have data.

```ts
getHolidaysBetween('2027-12-01', '2027-12-31').map((h) => h.key);
// ['unduvap-poya', 'christmas']
```

#### `getHolidaysInMonth(year, month, options?)`

Holidays in one month. `month` is 1–12.

```ts
getHolidaysInMonth(year: number, month: number, options?: FilterOptions): Holiday[]
```

```ts
getHolidaysInMonth(2027, 4).map((h) => h.name.en);
// ['Day prior to Sinhala & Tamil New Year Day',
//  'Sinhala & Tamil New Year Day',
//  'Bak Full Moon Poya Day']
```

#### `getNextHoliday(from?, options?)`

The next holiday on or after a date. `from` defaults to today in Sri Lanka.
Returns `undefined` if there are no more holidays in the bundled data.

```ts
getNextHoliday(from?: DateInput, options?: FilterOptions): Holiday | undefined
```

```ts
getNextHoliday('2027-04-15')?.name.en;                             // 'Bak Full Moon Poya Day'
getNextHoliday('2027-04-15', { categories: 'mercantile' })?.date;  // '2027-05-01'
```

#### `getPoyaDays(year?)`

All Full Moon Poya days in a year.

```ts
getPoyaDays(year?: number): Holiday[]
```

```ts
getPoyaDays(2026).length; // 13 (includes Adhi Poson)
getPoyaDays(2027).length; // 12
```

#### `isHoliday(date, options?)` and shortcuts

```ts
isHoliday(date: DateInput, options?: FilterOptions): boolean
isPublicHoliday(date: DateInput): boolean
isBankHoliday(date: DateInput): boolean
isMercantileHoliday(date: DateInput): boolean
isPoyaDay(date: DateInput): boolean
```

These check only the CBSL holiday list; weekends return `false`.

```ts
isHoliday('2027-04-14');           // true
isPublicHoliday('2027-01-22');     // true  (Duruthu Poya)
isMercantileHoliday('2027-01-22'); // false (Poya days aren't mercantile)
isBankHoliday('2025-04-15');       // true  (Special Bank Holiday)
isPublicHoliday('2025-04-15');     // false
isPoyaDay('2027-01-22');           // true
```

#### `getHolidayName(holiday, lang?)`

A holiday's name in one language. `lang` is `'en'` (default), `'si'` or `'ta'`.

```ts
getHolidayName(holiday: Holiday, lang?: 'en' | 'si' | 'ta'): string
```

```ts
const [h] = getHolidaysOn('2027-04-14');
getHolidayName(h, 'si'); // 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය'
```

### Working days

These answer "is this a working day?" for attendance, payroll, leave and
deadlines. They all take the same options:

```ts
interface WorkingDayOptions {
  /** Holidays that count as days off. Default: 'public'. */
  categories?: HolidayCategory | HolidayCategory[];
  /** Days of the week that are off (0 = Sunday … 6 = Saturday). Default: [0, 6]. */
  weekendDays?: number[];
  /** Extra days off for your organisation. */
  extraHolidays?: DateInput[];
  /** Days that are working days even if they're a holiday or weekend. */
  extraWorkingDays?: DateInput[];
}
```

The rules are applied in this order:

1. In `extraWorkingDays`: working day.
2. In `extraHolidays`: day off.
3. A weekend day: day off.
4. A holiday in the chosen `categories`: day off.
5. Otherwise: working day.

Each function throws `RangeError` if a date falls in a year without data.

| Organisation | Suggested `categories` |
| --- | --- |
| Government offices, schools | `'public'` (default) |
| Banks | `'bank'` |
| Private sector (Shop & Office Act) | `'mercantile'`, or `'public'` if staff get all public holidays |

#### `isWorkingDay(date, options?)`

```ts
isWorkingDay(date: DateInput, options?: WorkingDayOptions): boolean
```

```ts
isWorkingDay('2027-04-13');                                 // false (New Year eve)
isWorkingDay('2027-04-17');                                 // false (Saturday)
isWorkingDay('2027-04-20', { categories: 'mercantile' });   // true  (Poya isn't mercantile)
isWorkingDay('2027-04-15', { extraHolidays: ['2027-04-15'] });    // false
isWorkingDay('2027-04-13', { extraWorkingDays: ['2027-04-13'] }); // true
```

#### `countWorkingDays(start, end, options?)`

Number of working days between two dates, inclusive.

```ts
countWorkingDays(start: DateInput, end: DateInput, options?: WorkingDayOptions): number
```

```ts
countWorkingDays('2027-04-01', '2027-04-30');                              // 19
countWorkingDays('2027-04-01', '2027-04-30', { categories: 'mercantile' }); // 20
countWorkingDays('2027-04-01', '2027-04-30', { weekendDays: [0] });         // 23 (6-day week)
```

#### `getWorkingDays(start, end, options?)`

List of working days between two dates, inclusive.

```ts
getWorkingDays(start: DateInput, end: DateInput, options?: WorkingDayOptions): string[]
```

```ts
getWorkingDays('2027-04-12', '2027-04-16');
// ['2027-04-12', '2027-04-15', '2027-04-16']
```

#### `addWorkingDays(date, n, options?)`

The date `n` working days after `date`. Use a negative `n` to go backwards.
`n` must be an integer.

```ts
addWorkingDays(date: DateInput, n: number, options?: WorkingDayOptions): string
```

```ts
addWorkingDays('2027-04-12', 3);  // '2027-04-19' (skips New Year eve, New Year and the weekend)
addWorkingDays('2027-04-15', -1); // '2027-04-12'
```

#### `nextWorkingDay(date, options?)`

The next working day strictly after `date`. Same as `addWorkingDays(date, 1, options)`.

```ts
nextWorkingDay('2027-04-12'); // '2027-04-15'
```

### Data coverage

```ts
getAvailableYears(): number[]            // [2024, 2025, 2026, 2027]
hasYear(year: number): boolean           // hasYear(2027) → true
getYearData(year: number): YearData | undefined
getDataInfo(): {
  source: string;
  years: number[];
  lastUpdated: string;                   // 'YYYY-MM-DD'
  sources: Record<number, string>;       // CBSL page URL for each year
}
```

```ts
getDataInfo().sources[2027];
// 'https://www.cbsl.gov.lk/en/about/about-the-bank/bank-holidays-2027'
```

### Custom data: `createHolidayApi`

Every function above is also available over **your own dataset**. Use this
for a company calendar with extra days, data loaded from your own server, or
small datasets in your tests.

```ts
import { createHolidayApi, getYearData } from 'lk-holidays';

const cbsl2027 = getYearData(2027)!;

const company = createHolidayApi({
  2027: {
    ...cbsl2027,
    holidays: [
      ...cbsl2027.holidays,
      {
        date: '2027-06-04',
        key: 'company-day',
        name: { en: 'Company Day', si: 'සමාගම් දිනය', ta: 'நிறுவன தினம்' },
        categories: ['mercantile'],
        isPoya: false,
      },
    ],
  },
});

company.isHoliday('2027-06-04');   // true
company.getHolidays(2027).length;  // 26
```

```ts
createHolidayApi(data: Record<number, YearData>, lastUpdated?: string): HolidayApi
```

Keep each year's `holidays` array sorted by date. For one-off days off, the
`extraHolidays` option of the working-day functions is simpler.

### Date helpers

```ts
toISODate(input: DateInput): string   // normalise to 'YYYY-MM-DD' in Sri Lanka time
todayInSriLanka(): string             // today's date in Colombo
```

```ts
toISODate(new Date('2027-04-13T20:00:00Z')); // '2027-04-14'
toISODate('2027-02-30');                     // throws RangeError (no such date)
toISODate('14/04/2027');                     // throws TypeError (use YYYY-MM-DD)
```

---

## Recipes

### Monthly attendance summary

```ts
import { countWorkingDays, getHolidaysInMonth } from 'lk-holidays';

function monthSummary(year: number, month: number) {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const options = { categories: 'mercantile' as const };

  return {
    workingDays: countWorkingDays(`${year}-${mm}-01`, `${year}-${mm}-${lastDay}`, options),
    holidays: getHolidaysInMonth(year, month, options).map((h) => ({ date: h.date, name: h.name.en })),
  };
}

monthSummary(2027, 4);
// { workingDays: 20, holidays: [ New Year eve, New Year Day ] }
```

### Mark absences only on working days

```ts
import { isWorkingDay } from 'lk-holidays';

function attendanceStatus(date: string, checkedIn: boolean) {
  if (!isWorkingDay(date)) return 'off';
  return checkedIn ? 'present' : 'absent';
}
```

### Leave request: how many days does it use?

```ts
import { countWorkingDays } from 'lk-holidays';

// Leave from Monday 12 April to Friday 16 April 2027
countWorkingDays('2027-04-12', '2027-04-16'); // 3: New Year eve and New Year Day aren't deducted
```

### Due dates: "within 5 working days"

```ts
import { addWorkingDays, todayInSriLanka } from 'lk-holidays';

const dueDate = addWorkingDays(todayInSriLanka(), 5, { categories: 'bank' });
```

### Calendar cell (React)

```tsx
import { getHolidaysOn, type Language } from 'lk-holidays';

export function DayCell({ date, lang = 'si' }: { date: string; lang?: Language }) {
  const [holiday] = getHolidaysOn(date);
  return (
    <div className={holiday ? (holiday.isPoya ? 'day poya' : 'day holiday') : 'day'}>
      <span>{Number(date.slice(8))}</span>
      {holiday && <small title={holiday.name.en}>{holiday.name[lang]}</small>}
    </div>
  );
}
```

### Upcoming holidays widget

```ts
import { getHolidaysBetween, todayInSriLanka, toISODate } from 'lk-holidays';

const today = todayInSriLanka();
const in60Days = toISODate(new Date(Date.now() + 60 * 86_400_000));
const upcoming = getHolidaysBetween(today, in60Days, { categories: 'public' });
```

### Next.js route handler

```ts
// app/api/holidays/[year]/route.ts
import { getHolidays, hasYear } from 'lk-holidays';

export function GET(_req: Request, { params }: { params: { year: string } }) {
  const year = Number(params.year);
  if (!hasYear(year)) return Response.json({ error: 'Year not available' }, { status: 404 });
  return Response.json(getHolidays(year));
}
```

### Express API

```ts
import express from 'express';
import { getHolidays, hasYear, isWorkingDay } from 'lk-holidays';

const app = express();

app.get('/holidays/:year', (req, res) => {
  const year = Number(req.params.year);
  if (!hasYear(year)) return res.status(404).json({ error: 'Year not available' });
  res.json(getHolidays(year));
});

app.get('/working-day/:date', (req, res) => {
  try {
    res.json({ date: req.params.date, working: isWorkingDay(req.params.date) });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.listen(3000);
```

### Warn before the data runs out

Call this at startup or from a scheduled job so you know to update the package
before next year begins:

```ts
import { hasYear, todayInSriLanka } from 'lk-holidays';

const nextYear = Number(todayInSriLanka().slice(0, 4)) + 1;
if (!hasYear(nextYear)) {
  console.warn(`lk-holidays has no data for ${nextYear} yet. Run: npm update lk-holidays`);
}
```

---

## Using the data without JavaScript

Every published version includes the raw JSON, one file per year:

```
https://cdn.jsdelivr.net/npm/lk-holidays/data/2027.json
https://unpkg.com/lk-holidays/data/2027.json
```

Pin a version for production, for example `https://cdn.jsdelivr.net/npm/lk-holidays@1/data/2027.json`.

File format:

```jsonc
{
  "year": 2027,
  "source": "Central Bank of Sri Lanka",
  "sourceUrl": "https://www.cbsl.gov.lk/en/about/about-the-bank/bank-holidays-2027",
  "updatedAt": "2026-10-25",
  "holidays": [ /* Holiday objects, sorted by date */ ]
}
```

**Python**

```python
import requests

data = requests.get("https://cdn.jsdelivr.net/npm/lk-holidays@1/data/2027.json").json()
holidays = {h["date"]: h for h in data["holidays"]}
print("2027-04-14" in holidays)  # True
```

**PHP**

```php
$data = json_decode(file_get_contents('https://cdn.jsdelivr.net/npm/lk-holidays@1/data/2027.json'), true);
$dates = array_column($data['holidays'], 'date');
var_dump(in_array('2027-04-14', $dates)); // bool(true)
```

From JavaScript, you can also import a year's JSON directly:

```ts
import data2027 from 'lk-holidays/data/2027.json' with { type: 'json' };
```

---

## Holiday keys

`key` stays the same every year, even when CBSL changes the English spelling
(for example `Deepavali` / `Deepawali`).

| Key | Holiday |
| --- | --- |
| `thai-pongal` | Tamil Thai Pongal Day |
| `independence-day` | Independence Day |
| `mahasivarathri` | Mahasivarathri Day |
| `eid-ul-fitr` | Id-Ul-Fitr (Ramazan Festival Day) |
| `good-friday` | Good Friday |
| `new-year-eve` | Day prior to Sinhala & Tamil New Year Day |
| `new-year` | Sinhala & Tamil New Year Day |
| `may-day` | May Day (International Workers' Day) |
| `day-after-vesak` | Day following Vesak Full Moon Poya Day |
| `eid-ul-adha` | Id-Ul-Alha (Hadji Festival Day) |
| `milad-un-nabi` | Milad-Un-Nabi (Holy Prophet's Birthday) |
| `deepavali` | Deepavali Festival Day |
| `christmas` | Christmas Day |
| `special-bank-holiday` | Special Bank Holiday |

**Poya days:** `duruthu-poya`, `navam-poya`, `medin-poya`, `bak-poya`,
`vesak-poya`, `poson-poya`, `esala-poya`, `nikini-poya`, `binara-poya`,
`vap-poya`, `ill-poya`, `unduvap-poya`. Adhi Poyas add an `adhi-` prefix, such
as `adhi-poson-poya`.

One-off holidays that aren't in this list get a key made from their English
name, such as `special-public-holiday`.

---

## TypeScript

Types are included. Import them like this:

```ts
import type {
  Holiday,
  HolidayCategory,  // 'bank' | 'public' | 'mercantile'
  HolidayName,      // { en, si, ta }
  Language,         // 'en' | 'si' | 'ta'
  DateInput,        // string | Date
  FilterOptions,
  WorkingDayOptions,
  YearData,
  HolidayApi,       // return type of createHolidayApi
} from 'lk-holidays';
```

---

## How the data is kept up to date

A scheduled GitHub Action:

1. Runs on the 1st and 15th of every month, and every Monday from September to December.
2. Downloads the CBSL English, Sinhala and Tamil holiday pages for the current and next year.
3. Validates the result: real dates, 12–13 Poya days, key holidays present, a category on every holiday.
4. If anything changed, commits the new data and publishes a new version to npm.

New years are released as **minor** versions (`1.1.0`); corrections are
**patch** versions (`1.0.1`). To get them:

```bash
npm update lk-holidays
```

Dependabot or Renovate can do this for you automatically.

CBSL usually publishes the next year's holidays in September or October, so
the new year is normally on npm well before 1 January.

Dates, English names and categories come straight from CBSL. Sinhala and Tamil
names come from CBSL's Sinhala and Tamil pages, with spelling kept consistent
from year to year.

---

## FAQ

**Why does a function throw for a year?**
That year isn't in your installed version. Run `npm update lk-holidays`. If
the newest version still doesn't have it, CBSL hasn't published that year yet.

**Why isn't Saturday a holiday?**
Weekends aren't in the holiday list. Use `isWorkingDay` and the other
working-day functions, and set `weekendDays` to match your organisation.

**Which category should my company use?**
Government and schools: `public`. Banks: `bank`. Private companies usually
follow `mercantile`, but many give all public holidays, in which case use
`public`.

**A special holiday was announced. When will it show up?**
On the next scheduled run after CBSL adds it to their page. Until then, add it
yourself with the `extraHolidays` option.

**Does it work in the browser or React Native?**
Yes. The data is compiled into the package, so there's no file or network
access at runtime.

**How big is it?**
About 15 kB compressed for all years, with no dependencies.

---

## Contributing

```bash
git clone https://github.com/Sasitha-Ruvin/lk-holidays.git
cd lk-holidays
npm install
npm test
```

| Command | What it does |
| --- | --- |
| `npm test` | Run the tests |
| `npm run build` | Build `dist/` (ESM + CommonJS + types) |
| `npm run typecheck` | Type-check everything |
| `npm run scrape -- 2028` | Download a year from CBSL into `data/2028.json` |
| `npm run import-text -- 2028 file.txt` | Import a year from text copied off the CBSL page |

Found a wrong date or name? Please open an issue with a link to the CBSL page.

---

## Disclaimer

The data comes from the Central Bank of Sri Lanka website. The Government can
declare special holidays at short notice by gazette, and the package only
includes them after CBSL updates its page. This is an independent open-source
project, not affiliated with CBSL. Confirm with official sources for legal or
financial decisions.

## License

[MIT](LICENSE)