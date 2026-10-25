/**
 * CBBSL Marks Every holiday with one or more letters:
 * B = Bank Holiday, P = Public Holiday, M = Mercantile Holiday.
 */

export type HolidayCategory = 'bank' | 'public' | 'mercantile';

//**Supported languages for holiday name */
export type Language = 'en' | 'si' | 'ta';

export interface HolidayName {
    en: string;
    si: string;
    ta: string;
}

export interface Holiday {
    /**ISO Date, `YYYY-MM-DD` Local Srilankan Date format */
    date: string;
    /** */
    key:string;
    name:HolidayName;
    categories: HolidayCategory[];
    isPoya: boolean; // true for Full Moon Poya Days including Adhi Poya.
}

export interface YearData {
    year: number;
    source:string;
    sourceUrl:string;
    updatedAt:string
    holidays: Holiday[];
}

export type DateInput = string | Date;

export interface FilterOptions {
    categories?: HolidayCategory | HolidayCategory[];
}

export interface WorkingDayOptions {
     /**
   * Which holidays count as days off. Defaults to `['public']`.
   * - Government offices: `['public']`
   * - Banks: `['bank']`
   * - Private sector under the Shop & Office Act: often `['mercantile']`
   */

     categories?: HolidayCategory | HolidayCategory[];
     weekendDays?: number[];
     extraHolidays?:DateInput[];
     extraWorkingDays?: DateInput[];
}