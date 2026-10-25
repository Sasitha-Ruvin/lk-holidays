import { createHolidayApi } from './core.js';
import { DATA, LAST_UPDATED } from './data.generated.js';

export type {
    DateInput,
    FilterOptions,
    Holiday,
    HolidayCategory,
    HolidayName,
    Language,
    WorkingDayOptions,
    YearData,
} from './type.js';
export { toISODate, todayInSriLanka } from './date.js';
export { createHolidayApi, type HolidayApi } from './core.js';

const api = createHolidayApi(DATA, LAST_UPDATED);

export const {
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
} = api;