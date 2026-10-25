/**
 * Second official source: the Sri Lanka Government Printing Department's
 * desk calendar PDF (documents.gov.lk). It lists every holiday with the
 * same Public / Bank / Mercantile markings as CBSL:
 *
 *   January 15 Monday – Tamil Thai Pongal Day*†‡
 *   January 25 Thursday – Duruthu Full Moon Poya Day*†
 *
 *   * Public Holidays   † Bank Holidays   ‡ Mercantile Holidays
 *
 * Used automatically when cbsl.gov.lk can't be reached.
 */
import { lookup } from './dictionary.js';
import type { Category, Row } from './cbsl.js';

/** Possible PDF addresses for a year (the site has used more than one path). */
export function govCalendarUrls(year: number): string[] {
  return [
    `https://www.documents.gov.lk/view/cdr/${year}/${year}_E.pdf`,
    `https://www.documents.gov.lk/view/calander/${year}/${year}_E.pdf`,
    `https://documents.gov.lk/view/calander/${year}/${year}_E.pdf`,
  ];
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const SYMBOLS: Record<string, Category> = { '*': 'public', '†': 'bank', '‡': 'mercantile' };
const CATEGORY_ORDER: Category[] = ['bank', 'public', 'mercantile'];

/**
 * PDF text often has spacing glitches from letter kerning ("T amil",
 * "T hursday", "0 1"). Squash them so lines can be matched.
 */
function dekern(s: string): string {
  return s
    .replace(/\b([A-Z]) (?=[a-z]{2,})/g, '$1') // "T amil" → "Tamil"
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();
}

// <Month> <day> <Weekday> – <Name><symbols>
const LINE_RE = new RegExp(
  `(${MONTHS.join('|')})\\s+(\\d)\\s?(\\d)?\\s*,?\\s+` + // month + day ("0 1" allowed)
    `[A-Za-z]+day\\s*` + // weekday (already de-kerned)
    `[–—-]\\s*` + // dash
    `(.+?)\\s*([*†‡](?:\\s*[*†‡])*)\\s*$`, // name + symbols
  'i',
);

/** Parse text extracted from the Government calendar PDF. */
export function parseGovCalendarText(text: string): Row[] {
  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = dekern(raw);
    const m = LINE_RE.exec(line);
    if (!m) continue;
    const month = MONTHS.indexOf(m[1].toLowerCase()) + 1;
    const day = Number(m[2] + (m[3] ?? ''));
    if (day < 1 || day > 31) continue;

    const cats = new Set<Category>();
    for (const ch of m[5].replace(/\s/g, '')) if (SYMBOLS[ch]) cats.add(SYMBOLS[ch]);
    const categories = CATEGORY_ORDER.filter((c) => cats.has(c));

    // Use the standard English name when we know the holiday, so the
    // spelling matches the CBSL-sourced years.
    const rawName = dekern(m[4]);
    const name = lookup(rawName)?.en ?? rawName;

    const id = `${month}-${day}-${name}`;
    if (seen.has(id)) continue; // the calendar may print a list twice
    seen.add(id);
    rows.push({ month, day, name, categories });
  }
  return rows;
}

/**
 * Extract the text of a PDF, one line per visual line.
 * Uses pdfjs-dist (a dev dependency only: the published package stays
 * dependency-free).
 */
export async function pdfToText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // verbosity 0: only text is needed, so font-rendering warnings are noise
  const task = pdfjs.getDocument({ data: bytes, verbosity: 0 });
  const doc = await task.promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let current = '';
    let lastY: number | undefined;
    let lastEnd = 0;
    for (const item of content.items as Array<{ str: string; transform: number[]; width: number; hasEOL?: boolean }>) {
      if (typeof item.str !== 'string') continue;
      const x = item.transform[4];
      const y = item.transform[5];
      if (lastY !== undefined && Math.abs(y - lastY) > 2) {
        lines.push(current);
        current = '';
      } else if (current && x - lastEnd > 1) {
        current += ' ';
      }
      current += item.str;
      lastY = y;
      lastEnd = x + item.width;
      if (item.hasEOL) {
        lines.push(current);
        current = '';
        lastY = undefined;
      }
    }
    if (current) lines.push(current);
  }
  await task.destroy();
  return lines.join('\n');
}