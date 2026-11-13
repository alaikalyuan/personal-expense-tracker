import { format, subDays } from "date-fns";

/**
 * The dashboard streak used to read every `spent_at` the user ever logged.
 * It now reads a recent window first and widens to the full history only when
 * the streak could reach past what the window covers, so the result is the
 * same as an unbounded read.
 */
export const STREAK_WINDOW_DAYS = 120;

/** Rows per window read; also PostgREST's default max-rows. */
export const STREAK_WINDOW_ROW_LIMIT = 1000;

export function streakWindowStart(now: Date): string {
  return format(subDays(now, STREAK_WINDOW_DAYS), "yyyy-MM-dd");
}

/**
 * True when the window read cannot prove where the streak ends.
 *
 * @param dates `spent_at` values from the window read, newest first.
 * @param windowStart first day the window asked for (yyyy-MM-dd).
 * @param currentStreak streak computed from `dates`.
 * @param now today in the app timezone.
 */
export function streakNeedsFullHistory(
  dates: string[],
  windowStart: string,
  currentStreak: number,
  now: Date
): boolean {
  if (currentStreak === 0) return false;

  // If the row limit was hit, older days inside the window may be missing,
  // so only the oldest day returned is known to be covered.
  const truncated = dates.length >= STREAK_WINDOW_ROW_LIMIT;
  const oldestReturned = dates.length > 0 ? dates[dates.length - 1].slice(0, 10) : windowStart;
  const coveredFrom = truncated ? oldestReturned : windowStart;

  // The streak ends today or yesterday; the day before its first day must be
  // inside the covered range for the count to be final.
  const todayStr = format(now, "yyyy-MM-dd");
  const endsOn = dates.some((d) => d.slice(0, 10) === todayStr) ? now : subDays(now, 1);
  const dayBeforeStart = format(subDays(endsOn, currentStreak), "yyyy-MM-dd");
  return dayBeforeStart < coveredFrom;
}
