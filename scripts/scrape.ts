/**
 * Fetch official holiday data and update data/<year>.json.
 *
 * Sources, in order:
 *   1. Central Bank of Sri Lanka holiday pages (English + Sinhala + Tamil)
 *   2. Government Printing Department calendar PDF (documents.gov.lk),
 *      used automatically if cbsl.gov.lk can't be reached
 *
 *   npm run scrape                 # current year + next year (Sri Lanka time)
 *   npm run scrape -- 2027 2028    # specific years
 *   npm run scrape -- --html-dir ./saved-pages 2028   # parse saved CBSL HTML instead of fetching
 *   npm run scrape -- --source gov 2027               # use only the Government calendar
 *
 * Exit codes:
 *   0  success (files may or may not have changed — see "changed=" output)
 *   1  the current year could not be fetched/parsed (the workflow opens an issue)
 *
 * A missing NEXT year is not an error: it is usually published in Q3/Q4.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeLanguages, pageUrl, parsePage, validate, type HolidayRecord, type Lang, type Row } from './lib/cbsl.js';
import { govCalendarUrls, parseGovCalendarText, pdfToText } from './lib/govcal.js';
import { todayColombo, writeYearIfChanged } from './lib/store.js';

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 lk-holidays-bot (+https://github.com/Sasitha-Ruvin/lk-holidays)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,si;q=0.8,ta;q=0.7',
  'Cache-Control': 'no-cache',
};

/** The year's list doesn't exist (yet) at this source. */
class NotPublishedError extends Error {}
/** The source refused us (HTTP 401/403/429 or a bot-protection page). Retrying won't help. */
class BlockedError extends Error {}

/** Signs that we got a firewall / bot-challenge page rather than real content. */
const BLOCK_RE = /captcha|challenge|access denied|request rejected|are you a robot|enable javascript|support id/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e as Error).message.split('\n')[0];

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(60_000) });
      if (res.status === 404) throw new NotPublishedError(`404 ${url}`);
      if ([401, 403, 429].includes(res.status)) throw new BlockedError(`HTTP ${res.status} for ${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      if (err instanceof NotPublishedError || err instanceof BlockedError) throw err;
      lastErr = err;
      if (i < attempts) {
        const wait = 2000 * 2 ** (i - 1);
        console.warn(`  attempt ${i}/${attempts} failed (${errMsg(err)}); retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function fetchHtml(url: string): Promise<string> {
  const html = await (await fetchWithRetry(url)).text();
  if (/<title>[^<]*(page not found|404)/i.test(html)) throw new NotPublishedError(`Not found page at ${url}`);
  return html;
}

function parseArgs(argv: string[]) {
  let htmlDir: string | undefined;
  let source: 'auto' | 'cbsl' | 'gov' = 'auto';
  const years: number[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--html-dir') htmlDir = argv[++i];
    else if (argv[i] === '--source') source = argv[++i] as typeof source;
    else if (/^\d{4}$/.test(argv[i])) years.push(Number(argv[i]));
  }
  if (!['auto', 'cbsl', 'gov'].includes(source)) throw new Error('--source must be auto, cbsl or gov');
  if (years.length === 0) {
    const thisYear = Number(todayColombo().slice(0, 4));
    years.push(thisYear, thisYear + 1);
  }
  return { htmlDir, source, years };
}

// ---------------------------------------------------------------------------
// Source 1: CBSL
// ---------------------------------------------------------------------------

async function loadCbslPage(year: number, lang: Lang, htmlDir?: string): Promise<string> {
  if (htmlDir) {
    const p = join(htmlDir, `${lang}-${year}.html`);
    if (!existsSync(p)) throw new NotPublishedError(`missing ${p}`);
    return readFileSync(p, 'utf8');
  }
  return fetchHtml(pageUrl(year, lang));
}

async function fromCbsl(year: number, htmlDir?: string): Promise<HolidayRecord[]> {
  const enHtml = await loadCbslPage(year, 'en', htmlDir);
  const en = parsePage(enHtml, 'en');
  console.log(`  CBSL en: ${en.length} rows`);
  if (en.length === 0 && BLOCK_RE.test(enHtml)) {
    throw new BlockedError('CBSL returned a bot-protection page instead of the holiday list.');
  }

  const optional = async (lang: Lang): Promise<Row[]> => {
    try {
      await sleep(htmlDir ? 0 : 1500); // be polite to cbsl.gov.lk
      const rows = parsePage(await loadCbslPage(year, lang, htmlDir), lang);
      console.log(`  CBSL ${lang}: ${rows.length} rows`);
      return rows;
    } catch (err) {
      console.warn(`  CBSL ${lang}: unavailable (${errMsg(err)}) — dictionary names will be used`);
      return [];
    }
  };
  const si = await optional('si');
  const ta = await optional('ta');
  return finish(year, mergeLanguages(year, en, si, ta));
}

// ---------------------------------------------------------------------------
// Source 2: Government Printing Department calendar PDF
// ---------------------------------------------------------------------------

async function fromGovCalendar(year: number): Promise<HolidayRecord[]> {
  let lastErr: unknown = new NotPublishedError(`No Government calendar found for ${year}`);
  for (const url of govCalendarUrls(year)) {
    try {
      const res = await fetchWithRetry(url);
      const type = res.headers.get('content-type') ?? '';
      const bytes = new Uint8Array(await res.arrayBuffer());
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
      if (!isPdf) {
        // Some sites answer missing files with an HTML page instead of a 404
        throw new NotPublishedError(`Not a PDF at ${url} (${type || 'unknown type'})`);
      }
      const rows = parseGovCalendarText(await pdfToText(bytes));
      console.log(`  Gov calendar: ${rows.length} rows from ${url}`);
      // Sinhala/Tamil names come from the dictionary
      return finish(year, mergeLanguages(year, rows));
    } catch (err) {
      lastErr = err;
      if (!(err instanceof NotPublishedError)) console.warn(`  Gov calendar: ${errMsg(err)}`);
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------

function finish(year: number, { holidays, warnings }: { holidays: HolidayRecord[]; warnings: string[] }) {
  warnings.forEach((w) => console.warn(`  ! ${w}`));
  const errors = validate(year, holidays);
  if (errors.length) throw new Error(`Validation failed for ${year}:\n  - ${errors.join('\n  - ')}`);
  return holidays;
}

async function getYear(year: number, source: 'auto' | 'cbsl' | 'gov', htmlDir?: string): Promise<HolidayRecord[]> {
  if (source === 'gov') return fromGovCalendar(year);
  if (source === 'cbsl' || htmlDir) return fromCbsl(year, htmlDir);

  try {
    return await fromCbsl(year);
  } catch (cbslErr) {
    console.warn(`  CBSL failed (${errMsg(cbslErr)}) — trying the Government calendar PDF…`);
    try {
      return await fromGovCalendar(year);
    } catch (govErr) {
      // Neither source has the year yet → "not published" (skipped quietly for next year)
      // (or CBSL blocked us and the Government calendar isn't out yet)
      const cbslHasNothing = cbslErr instanceof NotPublishedError || cbslErr instanceof BlockedError;
      if (govErr instanceof NotPublishedError && cbslHasNothing) {
        throw new NotPublishedError(`Not published yet (CBSL: ${errMsg(cbslErr)}; Gov: ${errMsg(govErr)})`);
      }
      throw new Error(`CBSL: ${errMsg(cbslErr)} | Government calendar: ${errMsg(govErr)}`);
    }
  }
}

async function main() {
  const { htmlDir, source, years } = parseArgs(process.argv.slice(2));
  const currentYear = Number(todayColombo().slice(0, 4));
  let changed = false;
  let failed = false;
  const summary: string[] = [];

  for (const year of years) {
    console.log(`\n== ${year} ==`);
    try {
      const holidays = await getYear(year, source, htmlDir);
      const wrote = writeYearIfChanged(year, holidays);
      console.log(`  ${holidays.length} holidays → data/${year}.json ${wrote ? '(UPDATED)' : '(no change)'}`);
      if (wrote) changed = true;
      summary.push(`${year}: ${wrote ? 'updated' : 'unchanged'}`);
    } catch (err) {
      if (err instanceof NotPublishedError && year > currentYear) {
        console.log(`  ${year} not published yet — skipping.`);
        summary.push(`${year}: not published yet`);
        continue;
      }
      console.error(`  ERROR ${year}: ${(err as Error).message}`);
      summary.push(`${year}: FAILED — ${errMsg(err)}`);
      failed = true;
    }
  }

  console.log(`\nchanged=${changed}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nsummary=${summary.join('; ')}\n`);
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});