import type { DateInput } from './type.js';
/**
 * Normalise any supported input to a `YYYY-MM-DD` string.
 *
 * - Strings must already be `YYYY-MM-DD` (time parts like `2027-01-15T08:00`
 *   are accepted and the time is ignored).
 * - `Date` objects are converted to the calendar date **in Sri Lanka
 *   (Asia/Colombo)**, so a server running in UTC gets the right day.
 */
export declare function toISODate(input: DateInput): string;
/** Day of week for an ISO date (0 = Sunday … 6 = Saturday). */
export declare function dayOfWeek(iso: string): number;
/** Add whole days to an ISO date. */
export declare function addDays(iso: string, days: number): string;
/** Today's date in Sri Lanka as YYYY-MM-DD. */
export declare function todayInSriLanka(): string;
