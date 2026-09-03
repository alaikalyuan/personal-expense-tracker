/**
 * Timezone utilities for server and client consistency.
 * Default timezone is set to GMT+7 (Asia/Jakarta / WIB).
 */

export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_TIMEZONE ||
  process.env.APP_TIMEZONE ||
  "Asia/Jakarta";

/**
 * Returns a Date object aligned with the target timezone (default: Asia/Jakarta / GMT+7).
 * This ensures cloud servers (such as Vercel, which run in UTC) compute the current day,
 * week start, and day-of-week identically to the user's local clock.
 */
export function getNowInTimezone(timeZone = APP_TIMEZONE): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year") || String(now.getFullYear()), 10);
  const month = parseInt(getPart("month") || String(now.getMonth() + 1), 10) - 1;
  const day = parseInt(getPart("day") || String(now.getDate()), 10);
  const hour = parseInt(getPart("hour") || "0", 10);
  const minute = parseInt(getPart("minute") || "0", 10);
  const second = parseInt(getPart("second") || "0", 10);

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the target timezone.
 */
export function getTodayString(timeZone = APP_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

