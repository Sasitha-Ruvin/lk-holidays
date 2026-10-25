/**
 * Parsing helpers for the Central Bank of Sri Lanka "Bank Holidays for YYYY"
 * pages. No third-party dependencies — just regexes over the HTML, so the
 * GitHub Action stays fast and has nothing to break.
 *
 * Page URLs (one per language):
 *   en: https://www.cbsl.gov.lk/en/about/about-the-bank/bank-holidays-2027
 *   si: https://www.cbsl.gov.lk/si/about/about-the-bank/bank-holidays-2027-s
 *   ta: https://www.cbsl.gov.lk/ta/about/about-the-bank/bank-holidays-2027-t
 */
import { lookup, slugify } from './dictionary.js';

export type Category = 'bank' | 'public' | 'mercantile';
export type Lang = 'en' | 'si' | 'ta';

export interface HolidayRecord {
  date: string;
  key: string;
  name: { en: string; si: string; ta: string };
  categories: Category[];
  isPoya: boolean;
}

export interface Row {
  month: number;
  day: number;
  name: string;
  categories: Category[];
}

export const BASE = 'https://www.cbsl.gov.lk';

export function pageUrl(year: number, lang: Lang): string {
  const suffix = lang === 'en' ? '' : lang === 'si' ? '-s' : '-t';
  return `${BASE}/${lang}/about/about-the-bank/bank-holidays-${year}${suffix}`;
}

// ---------------------------------------------------------------------------
// Text clean-up
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  zwj: '\u200d',
  zwnj: '\u200c',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/**
 * Normalise Sinhala/Tamil/English text from the CBSL site:
 * - collapse whitespace, trim
 * - drop stray zero-width joiners (keep the ones after a Sinhala virama,
 *   which are part of conjuncts like ශ්‍රී)
 * - fix a common Tamil encoding typo: "ா்" → "ர்"
 */
export function cleanText(s: string): string {
  return s
    .replace(/(?<!\u0DCA)\u200D/g, '')
    .replace(/ா்/g, 'ர்')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();
}

function stripTags(html: string): string {
  return cleanText(
    decodeEntities(
      html
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|li)>/gi, ' ')
        .replace(/<[^>]+>/g, ''),
    ),
  );
}

// ---------------------------------------------------------------------------
// Months
// ---------------------------------------------------------------------------

const MONTHS: Record<Lang, string[]> = {
  en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
  si: ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'],
  ta: ['சனவரி', 'பெப்புருவரி', 'மாச்சு', 'ஏப்பிறல்', 'மே', 'யூன்', 'யூலை', 'ஓகத்து', 'செத்தெம்பர்', 'ஒத்தோபர்', 'நவெம்பர்', 'திசெம்பர்'],
};

// Alternative spellings seen on the site / in gazettes
const MONTH_ALIASES: Partial<Record<Lang, Record<string, number>>> = {
  si: { 'අප්රේල්': 4, 'සැප්තැම්බර': 9 },
  ta: { 'ஜனவரி': 1, 'பெப்ரவரி': 2, 'மார்ச்': 3, 'ஏப்ரல்': 4, 'ஜூன்': 6, 'ஜூலை': 7, 'ஆகஸ்ட்': 8, 'செப்டெம்பர்': 9, 'ஒக்டோபர்': 10, 'நவம்பர்': 11, 'டிசம்பர்': 12, 'ஓகஸ்ட்': 8 },
};

function findMonth(text: string, lang: Lang): number | undefined {
  const t = lang === 'en' ? text.toLowerCase() : text.replace(/\u200D/g, '');
  const names = MONTHS[lang];
  for (let i = 0; i < names.length; i++) {
    const n = lang === 'en' ? names[i] : names[i].replace(/\u200D/g, '');
    if (lang === 'en' ? new RegExp(`\\b${n.slice(0, 3)}`).test(t) : t.includes(n)) return i + 1;
  }
  for (const [alias, m] of Object.entries(MONTH_ALIASES[lang] ?? {})) {
    if (t.includes(alias.replace(/\u200D/g, ''))) return m;
  }
  return undefined;
}

/** Parse a date cell in any of the three languages. */
export function parseDateCell(text: string, lang: Lang): { month: number; day: number } | undefined {
  const month = findMonth(text, lang);
  const dayMatch = /\b(\d{1,2})\b/.exec(text);
  if (!month || !dayMatch) return undefined;
  const day = Number(dayMatch[1]);
  if (day < 1 || day > 31) return undefined;
  return { month, day };
}

// ---------------------------------------------------------------------------
// Category codes  (B. P. M.  /  බැ.ර.වෙ.  /  வ.அ.வர்.)
// ---------------------------------------------------------------------------

const CODE_PATTERNS: Record<Lang, { re: RegExp; map: Record<string, Category> }> = {
  en: { re: /((?:\s*\b[BPM]\s*\.)+)\s*$/, map: { B: 'bank', P: 'public', M: 'mercantile' } },
  si: { re: /((?:\s*(?:බැ|ර|වෙ)\s*\.)+)\s*$/, map: { 'බැ': 'bank', 'ර': 'public', 'වෙ': 'mercantile' } },
  ta: { re: /((?:\s*(?:வர்|வ|அ)\s*\.)+)\s*$/, map: { 'வ': 'bank', 'அ': 'public', 'வர்': 'mercantile' } },
};

const CATEGORY_ORDER: Category[] = ['bank', 'public', 'mercantile'];

/** Split "Tamil Thai Pongal Day B. P. M." into name + categories. */
export function splitCodes(desc: string, lang: Lang): { name: string; categories: Category[] } {
  const { re, map } = CODE_PATTERNS[lang];
  const m = re.exec(desc);
  if (!m) return { name: cleanText(desc), categories: [] };
  const codes = m[1]
    .split('.')
    .map((c) => c.trim())
    .filter(Boolean);
  const cats = new Set<Category>();
  for (const c of codes) if (map[c]) cats.add(map[c]);
  return {
    name: cleanText(desc.slice(0, m.index)),
    categories: CATEGORY_ORDER.filter((c) => cats.has(c)),
  };
}

// ---------------------------------------------------------------------------
// Page parsing
// ---------------------------------------------------------------------------

/** Pull [dateCell, descriptionCell] pairs out of every <tr> on the page. */
function tableRows(html: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const cells: string[] = [];
    const tdRe = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let td: RegExpExecArray | null;
    while ((td = tdRe.exec(tr[1]))) cells.push(stripTags(td[1]));
    const nonEmpty = cells.filter(Boolean);
    if (nonEmpty.length >= 2) out.push([nonEmpty[0], nonEmpty.slice(1).join(' ')]);
  }
  return out;
}

/**
 * Fallback when the page has no table: treat every block of text as a line
 * and look for "<date> <description>" lines.
 */
function lineRows(html: string, lang: Lang): Array<[string, string]> {
  const main = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  const lines = main
    .split(/<\/?(?:p|div|li|tr|br|h\d)[^>]*>/i)
    .map(stripTags)
    .filter(Boolean);
  const out: Array<[string, string]> = [];
  for (const line of lines) {
    // A date part = (day + month name) or (month name + day), plus optional weekday
    const m = /^(.{3,40}?\d{1,2}[^\s]*(?:\s+\S+)?)\s+(.+)$/.exec(line);
    if (!m) continue;
    if (!parseDateCell(m[1], lang)) continue;
    if (!CODE_PATTERNS[lang].re.test(m[2])) continue;
    out.push([m[1], m[2]]);
  }
  return out;
}

/** Parse one CBSL holiday page into rows. */
export function parsePage(rawHtml: string, lang: Lang): Row[] {
  const html = rawHtml.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '');
  let pairs = tableRows(html);
  if (pairs.filter(([d]) => parseDateCell(d, lang)).length < 5) pairs = lineRows(html, lang);

  const rows: Row[] = [];
  for (const [dateCell, desc] of pairs) {
    const date = parseDateCell(dateCell, lang);
    if (!date) continue; // header, legend or blank row
    const { name, categories } = splitCodes(desc, lang);
    if (!name) continue;
    rows.push({ ...date, name, categories });
  }
  return rows;
}

/**
 * Parse text copied from the English page (or typed by hand), one holiday
 * per line, e.g.
 *   15 January, Friday | Tamil Thai Pongal Day B. P. M.
 *   January 03, Saturday   Duruthu Full Moon Poya Day B. P.
 */
export function parseEnglishText(text: string): Row[] {
  const rows: Row[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = cleanText(raw.replace(/\|/g, ' '));
    if (!line) continue;
    const m =
      /^(\d{1,2}\s+[A-Za-z]+,?(?:\s+[A-Za-z]+day)?|[A-Za-z]+\s+\d{1,2},?(?:\s+[A-Za-z]+day)?)\s+(.+)$/.exec(line);
    if (!m) continue;
    const date = parseDateCell(m[1], 'en');
    if (!date) continue;
    const { name, categories } = splitCodes(m[2], 'en');
    if (name) rows.push({ ...date, name, categories });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Merge the three languages into final records
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

export interface MergeResult {
  holidays: HolidayRecord[];
  warnings: string[];
}

/**
 * Build final records. English is the source of truth for dates and
 * categories. Names come from:
 *   1. the built-in dictionary (consistent spelling year to year), else
 *   2. the Sinhala/Tamil page row with the same date, else
 *   3. the Sinhala/Tamil row at the same position (if row counts match), else
 *   4. the English name (and a warning is printed).
 */
export function mergeLanguages(year: number, en: Row[], si: Row[] = [], ta: Row[] = []): MergeResult {
  const warnings: string[] = [];

  const pick = (rows: Row[], i: number, r: Row): string | undefined => {
    const sameDate = rows.filter((x) => x.month === r.month && x.day === r.day);
    if (sameDate.length === 1) return sameDate[0].name;
    if (rows.length === en.length) return rows[i]?.name;
    return undefined;
  };

  const holidays: HolidayRecord[] = en.map((r, i) => {
    const date = `${year}-${pad(r.month)}-${pad(r.day)}`;
    const dict = lookup(r.name);
    let siName = dict?.si;
    let taName = dict?.ta;
    if (!dict) {
      siName = pick(si, i, r);
      taName = pick(ta, i, r);
      warnings.push(`Not in dictionary: "${r.name}" on ${date} — used names from CBSL si/ta pages.`);
    }
    if (!siName) warnings.push(`No Sinhala name for "${r.name}" on ${date}; using English.`);
    if (!taName) warnings.push(`No Tamil name for "${r.name}" on ${date}; using English.`);
    return {
      date,
      key: dict?.key ?? slugify(r.name),
      name: { en: r.name, si: siName ?? r.name, ta: taName ?? r.name },
      categories: r.categories,
      isPoya: dict?.isPoya ?? /full\s+moon\s+poya/i.test(r.name),
    };
  });

  holidays.sort((a, b) => (a.date === b.date ? a.key.localeCompare(b.key) : a.date < b.date ? -1 : 1));
  return { holidays, warnings };
}

/** Sanity checks so a broken page never gets published. */
export function validate(year: number, holidays: HolidayRecord[]): string[] {
  const errors: string[] = [];
  if (holidays.length < 18) errors.push(`Only ${holidays.length} holidays found for ${year} (expected ~25).`);
  if (holidays.length > 45) errors.push(`${holidays.length} holidays found for ${year} — parser probably picked up junk.`);
  const poyas = holidays.filter((h) => h.isPoya).length;
  if (poyas < 12 || poyas > 13) errors.push(`${poyas} Poya days for ${year} (expected 12 or 13).`);
  for (const h of holidays) {
    const d = new Date(`${h.date}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== h.date) errors.push(`Invalid date ${h.date}`);
    if (h.categories.length === 0) errors.push(`No B/P/M category for "${h.name.en}" on ${h.date}`);
  }
  const keys = holidays.map((h) => `${h.date}|${h.key}`);
  if (new Set(keys).size !== keys.length) errors.push('Duplicate holiday entries.');
  for (const must of ['new-year', 'vesak-poya', 'christmas', 'independence-day']) {
    if (!holidays.some((h) => h.key === must)) errors.push(`Missing "${must}" — page format may have changed.`);
  }
  return errors;
}