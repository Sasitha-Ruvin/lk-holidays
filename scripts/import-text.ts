
import { readFileSync } from 'node:fs';
import { mergeLanguages, parseEnglishText, validate } from './lib/cbsl.js';
import { writeYearIfChanged } from './lib/store.js';

const [yearArg, file] = process.argv.slice(2);
if (!/^\d{4}$/.test(yearArg ?? '') || !file) {
  console.error('Usage: npm run import-text -- <year> <file.txt>');
  process.exit(1);
}
const year = Number(yearArg);
const rows = parseEnglishText(readFileSync(file, 'utf8'));
const { holidays, warnings } = mergeLanguages(year, rows);
warnings.forEach((w) => console.warn(`! ${w}`));
const errors = validate(year, holidays);
if (errors.length) {
  console.error(`Validation failed:\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
const changed = writeYearIfChanged(year, holidays);
console.log(`${holidays.length} holidays → data/${year}.json ${changed ? '(UPDATED)' : '(no change)'}`);