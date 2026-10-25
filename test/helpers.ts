import type { Holiday, HolidayCategory, YearData } from '../src/type.js';

/** One test holiday: [date, key, categories, isPoya?] */
export type Spec = [date: string, key: string, categories: HolidayCategory[], isPoya?: boolean];

/** Build a small, made-up dataset so API tests never depend on real CBSL data. */
export function makeData(specs: Spec[]): Record<number, YearData> {
  const data: Record<number, YearData> = {};
  for (const [date, key, categories, isPoya = false] of specs) {
    const year = Number(date.slice(0, 4));
    data[year] ??= { year, source: 'test', sourceUrl: 'test', updatedAt: '2000-01-01', holidays: [] };
    const h: Holiday = {
      date,
      key,
      name: { en: `${key} (en)`, si: `${key} (si)`, ta: `${key} (ta)` },
      categories,
      isPoya,
    };
    data[year].holidays.push(h);
  }
  for (const y of Object.values(data)) y.holidays.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}