const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SL_TIME_ZONE = 'Asia/Colombo';
let formatter;
function sriLankaParts(d) {
    formatter ?? (formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: SL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }));
    const parts = formatter.formatToParts(d);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    return { y: get('year'), m: get('month'), day: get('day') };
}
function pad(n) {
    return n < 10 ? `0${n}` : String(n);
}
/**
 * Normalise any supported input to a `YYYY-MM-DD` string.
 *
 * - Strings must already be `YYYY-MM-DD` (time parts like `2027-01-15T08:00`
 *   are accepted and the time is ignored).
 * - `Date` objects are converted to the calendar date **in Sri Lanka
 *   (Asia/Colombo)**, so a server running in UTC gets the right day.
 */
export function toISODate(input) {
    if (typeof input === 'string') {
        const datePart = input.trim().slice(0, 10);
        const m = ISO_RE.exec(datePart);
        if (!m)
            throw new TypeError(`Invalid date "${input}". Use YYYY-MM-DD.`);
        const [, y, mo, d] = m;
        const check = new Date(Date.UTC(+y, +mo - 1, +d));
        if (check.getUTCMonth() !== +mo - 1 || check.getUTCDate() !== +d) {
            throw new RangeError(`Date does not exist: "${input}"`);
        }
        return datePart;
    }
    if (input instanceof Date && !Number.isNaN(input.getTime())) {
        const { y, m, day } = sriLankaParts(input);
        return `${y}-${pad(m)}-${pad(day)}`;
    }
    throw new TypeError('Expected a YYYY-MM-DD string or a valid Date.');
}
/** Day of week for an ISO date (0 = Sunday … 6 = Saturday). */
export function dayOfWeek(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
/** Add whole days to an ISO date. */
export function addDays(iso, days) {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
/** Today's date in Sri Lanka as YYYY-MM-DD. */
export function todayInSriLanka() {
    return toISODate(new Date());
}
