/**
 * Week-over-week maths for /compare. Both the headline and the pace card use the
 * same window: this week's days so far against the same days of last week.
 */
export interface WeekComparison {
  /** Days of this week so far, today included (Mon=1 ... Sun=7). */
  days: number;
  /** False when last week had no spending over those days: there is nothing to compare against. */
  hasBaseline: boolean;
  diffAmount: number;
  /** Rounded percent change; null without a baseline. */
  percentDiff: number | null;
  direction: "less" | "more" | "even";
  thisDailyAvg: number;
  lastDailyAvg: number;
  /** Absolute rounded difference in daily average. */
  dailyAvgGap: number;
}

export function compareWeeks(thisTotal: number, lastTotalSameDays: number, days: number): WeekComparison {
  const window = Math.min(Math.max(Math.round(days), 1), 7);
  const hasBaseline = lastTotalSameDays > 0;
  const diffAmount = thisTotal - lastTotalSameDays;
  const thisDailyAvg = thisTotal / window;
  const lastDailyAvg = lastTotalSameDays / window;
  return {
    days: window,
    hasBaseline,
    diffAmount,
    percentDiff: hasBaseline ? Math.round((diffAmount / lastTotalSameDays) * 100) : null,
    direction: diffAmount < 0 ? "less" : diffAmount > 0 ? "more" : "even",
    thisDailyAvg,
    lastDailyAvg,
    dailyAvgGap: Math.round(Math.abs(thisDailyAvg - lastDailyAvg)),
  };
}
