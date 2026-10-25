import type { DateInput, FilterOptions, Holiday, Language, WorkingDayOptions, YearData } from './type.js';
/**
 * Build the full API over any holiday dataset.
 *
 * The package's default export uses the bundled CBSL data. Call this
 * yourself to use your own data, e.g. a company calendar with extra days,
 * or a test dataset.
 */
export declare function createHolidayApi(data: Record<number, YearData>, lastUpdated?: string): {
    getAvailableYears: () => number[];
    hasYear: (year: number) => boolean;
    getDataInfo: () => {
        source: string;
        years: number[];
        lastUpdated: string;
        sources: Record<number, string>;
    };
    getYearData: (year: number) => YearData | undefined;
    getHolidays: (year?: number, options?: FilterOptions) => Holiday[];
    getHolidaysOn: (date: DateInput, options?: FilterOptions) => Holiday[];
    isHoliday: (date: DateInput, options?: FilterOptions) => boolean;
    isPublicHoliday: (date: DateInput) => boolean;
    isBankHoliday: (date: DateInput) => boolean;
    isMercantileHoliday: (date: DateInput) => boolean;
    isPoyaDay: (date: DateInput) => boolean;
    getPoyaDays: (year?: number) => Holiday[];
    getHolidaysBetween: (start: DateInput, end: DateInput, options?: FilterOptions) => Holiday[];
    getNextHoliday: (from?: DateInput, options?: FilterOptions) => Holiday | undefined;
    getHolidaysInMonth: (year: number, month: number, options?: FilterOptions) => Holiday[];
    getHolidayName: (holiday: Holiday, lang?: Language) => string;
    isWorkingDay: (date: DateInput, options?: WorkingDayOptions) => boolean;
    getWorkingDays: (start: DateInput, end: DateInput, options?: WorkingDayOptions) => string[];
    countWorkingDays: (start: DateInput, end: DateInput, options?: WorkingDayOptions) => number;
    addWorkingDays: (date: DateInput, n: number, options?: WorkingDayOptions) => string;
    nextWorkingDay: (date: DateInput, options?: WorkingDayOptions) => string;
};
export type HolidayApi = ReturnType<typeof createHolidayApi>;
