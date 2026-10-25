import {mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageUrl, type HolidayRecord } from './cbsl.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = join(ROOT, 'data');

export interface YearFile {
    year:number;
    source:string;
    sourceUrl:string;
    updatedAt:string;
    holidays: HolidayRecord[];
}

export function yearPath(year:number):string{
    return join(DATA_DIR, `${year}.json`);
}

export function readYear(year: number): YearFile | undefined {
  const p = yearPath(year);
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as YearFile) : undefined;
}
export function listYears(): number[]{
    if(!existsSync(DATA_DIR)) return [];
    return readdirSync(DATA_DIR)
        .map((f) => /^(\d{4})\.json$/.exec(f)?.[1])
        .filter((y): y is string => Boolean(y))
        .map(Number)
        .sort((a, b) => a - b);
}

export function todayColombo():string {
    return new Intl.DateTimeFormat('en-CA',{
        timeZone:'Asia/Colombo',
        year:'numeric',
        month:'2-digit',
        day:'2-digit'
    }).format(new Date());
}

export function writeYearIfChanged(year:number, holidays: HolidayRecord[]):boolean{
    const existing = readYear(year);
    if (existing && JSON.stringify(existing.holidays) === JSON.stringify(holidays)) return false;
    mkdirSync(DATA_DIR, { recursive: true});
    const file: YearFile = {
        year,
        source: 'Central Bank of Sri Lanka (cbsl.gov.lk)',
        sourceUrl: pageUrl(year, 'en'),
        updatedAt: todayColombo(),
        holidays
    };
    writeFileSync(yearPath(year), `${JSON.stringify(file,null,2)}\n`, 'utf-8');
    return true;
}
