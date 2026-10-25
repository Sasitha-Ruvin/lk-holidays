import { addDays, dayOfWeek, toISODate, todayInSriLanka } from './date.js';
function toList(v) {
    if (v === undefined)
        return undefined;
    return Array.isArray(v) ? v : [v];
}
function matches(h, categories) {
    if (!categories || categories.length === 0)
        return true;
    return h.categories.some((c) => categories.includes(c));
}
function clone(h) {
    return { ...h, name: { ...h.name }, categories: [...h.categories] };
}
/**
 * Build the full API over any holiday dataset.
 *
 * The package's default export uses the bundled CBSL data. Call this
 * yourself to use your own data, e.g. a company calendar with extra days,
 * or a test dataset.
 */
export function createHolidayApi(data, lastUpdated = '') {
    const YEARS = Object.keys(data)
        .map(Number)
        .sort((a, b) => a - b);
    const BY_DATE = new Map();
    for (const year of YEARS) {
        for (const h of data[year].holidays) {
            const list = BY_DATE.get(h.date);
            if (list)
                list.push(h);
            else
                BY_DATE.set(h.date, [h]);
        }
    }
    // -------------------------------------------------------------------------
    // Data coverage
    // -------------------------------------------------------------------------
    /** Years that have data, ascending. */
    function getAvailableYears() {
        return [...YEARS];
    }
    /** True if there is data for the given year. */
    function hasYear(year) {
        return YEARS.includes(year);
    }
    /** Metadata about the data (source, last update, years). */
    function getDataInfo() {
        const sources = {};
        for (const y of YEARS)
            sources[y] = data[y].sourceUrl;
        return {
            source: 'Central Bank of Sri Lanka (cbsl.gov.lk)',
            years: getAvailableYears(),
            lastUpdated,
            sources,
        };
    }
    /** Raw data for one year, or `undefined` if the year is not available. */
    function getYearData(year) {
        const d = data[year];
        if (!d)
            return undefined;
        return { ...d, holidays: d.holidays.map(clone) };
    }
    // -------------------------------------------------------------------------
    // Lookups
    // -------------------------------------------------------------------------
    /**
     * All holidays in a year (defaults to the current year in Sri Lanka),
     * sorted by date. Throws if the year has no data, so a missing year is
     * never silently treated as "no holidays".
     */
    function getHolidays(year, options = {}) {
        const y = year ?? Number(todayInSriLanka().slice(0, 4));
        const d = data[y];
        if (!d) {
            throw new RangeError(`No holiday data for ${y}. Available years: ${YEARS.join(', ')}. ` +
                'Update the package (npm update lk-holidays) to get newer years.');
        }
        const cats = toList(options.categories);
        return d.holidays.filter((h) => matches(h, cats)).map(clone);
    }
    /** Holidays that fall on a given date (there can be more than one). */
    function getHolidaysOn(date, options = {}) {
        const iso = toISODate(date);
        const cats = toList(options.categories);
        return (BY_DATE.get(iso) ?? []).filter((h) => matches(h, cats)).map(clone);
    }
    /** True if the date is a CBSL-listed holiday (weekends are not counted). */
    function isHoliday(date, options = {}) {
        return getHolidaysOn(date, options).length > 0;
    }
    /** True if the date is a public holiday. */
    function isPublicHoliday(date) {
        return isHoliday(date, { categories: 'public' });
    }
    /** True if the date is a bank holiday (CBSL list only, not weekends). */
    function isBankHoliday(date) {
        return isHoliday(date, { categories: 'bank' });
    }
    /** True if the date is a mercantile holiday. */
    function isMercantileHoliday(date) {
        return isHoliday(date, { categories: 'mercantile' });
    }
    /** True if the date is a Full Moon Poya day. */
    function isPoyaDay(date) {
        return getHolidaysOn(date).some((h) => h.isPoya);
    }
    /** Poya days of a year (defaults to current year). */
    function getPoyaDays(year) {
        return getHolidays(year).filter((h) => h.isPoya);
    }
    /** Holidays between two dates, inclusive. Spans years automatically. */
    function getHolidaysBetween(start, end, options = {}) {
        const from = toISODate(start);
        const to = toISODate(end);
        if (from > to)
            throw new RangeError('start must be on or before end');
        const cats = toList(options.categories);
        const out = [];
        for (const y of YEARS) {
            if (y < Number(from.slice(0, 4)) || y > Number(to.slice(0, 4)))
                continue;
            for (const h of data[y].holidays) {
                if (h.date >= from && h.date <= to && matches(h, cats))
                    out.push(clone(h));
            }
        }
        return out;
    }
    /** The next holiday on or after a date (defaults to today in Sri Lanka). */
    function getNextHoliday(from, options = {}) {
        const start = from === undefined ? todayInSriLanka() : toISODate(from);
        const cats = toList(options.categories);
        for (const y of YEARS) {
            if (y < Number(start.slice(0, 4)))
                continue;
            for (const h of data[y].holidays) {
                if (h.date >= start && matches(h, cats))
                    return clone(h);
            }
        }
        return undefined;
    }
    /** Holidays in a given month (1–12) of a year. */
    function getHolidaysInMonth(year, month, options = {}) {
        if (month < 1 || month > 12)
            throw new RangeError('month must be 1–12');
        const prefix = `${year}-${month < 10 ? '0' : ''}${month}-`;
        return getHolidays(year, options).filter((h) => h.date.startsWith(prefix));
    }
    /** A holiday's name in the requested language (defaults to English). */
    function getHolidayName(holiday, lang = 'en') {
        return holiday.name[lang] || holiday.name.en;
    }
    // -------------------------------------------------------------------------
    // Working days (attendance, payroll, SLA calculations)
    // -------------------------------------------------------------------------
    function buildWorkingDayChecker(options) {
        const cats = toList(options.categories) ?? ['public'];
        const weekend = options.weekendDays ?? [0, 6];
        const extraOff = new Set((options.extraHolidays ?? []).map(toISODate));
        const extraOn = new Set((options.extraWorkingDays ?? []).map(toISODate));
        return (iso) => {
            if (extraOn.has(iso))
                return true;
            if (extraOff.has(iso))
                return false;
            if (weekend.includes(dayOfWeek(iso)))
                return false;
            const year = Number(iso.slice(0, 4));
            if (!data[year]) {
                throw new RangeError(`No holiday data for ${year}; cannot decide whether ${iso} is a working day.`);
            }
            return !(BY_DATE.get(iso) ?? []).some((h) => matches(h, cats));
        };
    }
    /**
     * True if the date is a working day: not a weekend and not a holiday in the
     * chosen categories (default: public holidays, Saturday & Sunday off).
     */
    function isWorkingDay(date, options = {}) {
        return buildWorkingDayChecker(options)(toISODate(date));
    }
    /** List of working days (YYYY-MM-DD) between two dates, inclusive. */
    function getWorkingDays(start, end, options = {}) {
        const from = toISODate(start);
        const to = toISODate(end);
        if (from > to)
            throw new RangeError('start must be on or before end');
        const check = buildWorkingDayChecker(options);
        const out = [];
        for (let d = from; d <= to; d = addDays(d, 1))
            if (check(d))
                out.push(d);
        return out;
    }
    /** Number of working days between two dates, inclusive. */
    function countWorkingDays(start, end, options = {}) {
        return getWorkingDays(start, end, options).length;
    }
    /** The date `n` working days after `date` (n can be negative). */
    function addWorkingDays(date, n, options = {}) {
        if (!Number.isInteger(n))
            throw new TypeError('n must be an integer');
        const check = buildWorkingDayChecker(options);
        const step = n >= 0 ? 1 : -1;
        let d = toISODate(date);
        let remaining = Math.abs(n);
        while (remaining > 0) {
            d = addDays(d, step);
            if (check(d))
                remaining--;
        }
        return d;
    }
    /** The next working day strictly after `date`. */
    function nextWorkingDay(date, options = {}) {
        return addWorkingDays(date, 1, options);
    }
    return {
        getAvailableYears,
        hasYear,
        getDataInfo,
        getYearData,
        getHolidays,
        getHolidaysOn,
        isHoliday,
        isPublicHoliday,
        isBankHoliday,
        isMercantileHoliday,
        isPoyaDay,
        getPoyaDays,
        getHolidaysBetween,
        getNextHoliday,
        getHolidaysInMonth,
        getHolidayName,
        isWorkingDay,
        getWorkingDays,
        countWorkingDays,
        addWorkingDays,
        nextWorkingDay,
    };
}
