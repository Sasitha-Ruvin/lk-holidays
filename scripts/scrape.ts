
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeLanguages, pageUrl, parsePage, validate, type Lang, type Row } from './lib/cbsl.js';
import { todayColombo, writeYearIfChanged } from './lib/store.js';

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 lk-holidays-bot (+https://github.com/YOUR_GITHUB_USERNAME/lk-holidays)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,si;q=0.8,ta;q=0.7',
  'Cache-Control': 'no-cache',
};

class NotPublishedError extends Error {}

/** Signs that we got a firewall / bot-challenge page rather than real content. */
const BLOCK_RE = /captcha|challenge|access denied|request rejected|are you a robot|enable javascript|support id/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string, attempts = 4): Promise<string> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(30_000) });
      if (res.status === 404) throw new NotPublishedError(`404 ${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const html = await res.text();
      if (/<title>[^<]*(page not found|404)/i.test(html)) throw new NotPublishedError(`Not found page at ${url}`);
      return html;
    } catch (err) {
      if (err instanceof NotPublishedError) throw err;
      lastErr = err;
      const wait = 2000 * 2 ** (i - 1);
      console.warn(`  attempt ${i}/${attempts} failed (${(err as Error).message}); retrying in ${wait / 1000}s`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function parseArgs(argv: string[]) {
  let htmlDir: string | undefined;
  const years: number[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--html-dir') htmlDir = argv[++i];
    else if (/^\d{4}$/.test(argv[i])) years.push(Number(argv[i]));
  }
  if (years.length === 0) {
    const thisYear = Number(todayColombo().slice(0, 4));
    years.push(thisYear, thisYear + 1);
  }
  return { htmlDir, years };
}

async function loadPage(year: number, lang: Lang, htmlDir?: string): Promise<string> {
  if (htmlDir) {
    const p = join(htmlDir, `${lang}-${year}.html`);
    if (!existsSync(p)) throw new NotPublishedError(`missing ${p}`);
    return readFileSync(p, 'utf8');
  }
  return fetchHtml(pageUrl(year, lang));
}

async function scrapeYear(year: number, htmlDir?: string): Promise<boolean> {
  console.log(`\n== ${year} ==`);
  const enHtml = await loadPage(year, 'en', htmlDir);
  const en = parsePage(enHtml, 'en');
  console.log(`  en: ${en.length} rows`);
  if (en.length === 0 && BLOCK_RE.test(enHtml)) {
    throw new Error(
      'CBSL returned a bot-protection page instead of the holiday list. ' +
        'Run the scraper from your own computer (self-hosted runner) or add the year via incoming/YYYY.txt — see SETUP.md.',
    );
  }

  const optional = async (lang: Lang): Promise<Row[]> => {
    try {
      await sleep(htmlDir ? 0 : 1500); // be polite to cbsl.gov.lk
      const rows = parsePage(await loadPage(year, lang, htmlDir), lang);
      console.log(`  ${lang}: ${rows.length} rows`);
      return rows;
    } catch (err) {
      console.warn(`  ${lang}: unavailable (${(err as Error).message}) — dictionary names will be used`);
      return [];
    }
  };
  const si = await optional('si');
  const ta = await optional('ta');

  const { holidays, warnings } = mergeLanguages(year, en, si, ta);
  warnings.forEach((w) => console.warn(`  ! ${w}`));
  const errors = validate(year, holidays);
  if (errors.length) throw new Error(`Validation failed for ${year}:\n  - ${errors.join('\n  - ')}`);

  const changed = writeYearIfChanged(year, holidays);
  console.log(`  ${holidays.length} holidays → data/${year}.json ${changed ? '(UPDATED)' : '(no change)'}`);
  return changed;
}

async function main() {
  const { htmlDir, years } = parseArgs(process.argv.slice(2));
  const currentYear = Number(todayColombo().slice(0, 4));
  let changed = false;
  let failed = false;
  const summary: string[] = [];

  for (const year of years) {
    try {
      if (await scrapeYear(year, htmlDir)) {
        changed = true;
        summary.push(`${year}: updated`);
      } else summary.push(`${year}: unchanged`);
    } catch (err) {
      if (err instanceof NotPublishedError && year > currentYear) {
        console.log(`  ${year} not published by CBSL yet — skipping.`);
        summary.push(`${year}: not published yet`);
        continue;
      }
      console.error(`  ERROR ${year}: ${(err as Error).message}`);
      summary.push(`${year}: FAILED — ${(err as Error).message.split('\n')[0]}`);
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