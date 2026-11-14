/**
 * "Sisa Anggaran Mingguan": the weekly budget minus regular spending, summed over
 * finished weeks. Only weeks from the one the account was created in onwards count,
 * so back-dated entries from before the account existed never produce a surplus.
 * Weeks without any entry are left out (no record is not the same as no spending).
 */
export interface WeekSpend {
  /** Monday of the week, `yyyy-MM-dd`. */
  weekStartStr: string;
  regularSpend: number;
}

export interface WeekSurplus extends WeekSpend {
  budget: number;
  isSurplus: boolean;
  surplus: number;
  deficit: number;
}

/** Is this week inside the counting window (on or after the week the account started)? */
export function weekCounts(weekStartStr: string, firstCountedWeekStartStr: string | null): boolean {
  return firstCountedWeekStartStr === null || weekStartStr >= firstCountedWeekStartStr;
}

export function weekSurplus(week: WeekSpend, weeklyBudget: number | null): WeekSurplus {
  const budget = weeklyBudget ?? 0;
  if (budget <= 0) {
    return { ...week, budget: 0, isSurplus: false, surplus: 0, deficit: 0 };
  }
  const isSurplus = week.regularSpend <= budget;
  return {
    ...week,
    budget,
    isSurplus,
    surplus: isSurplus ? budget - week.regularSpend : 0,
    deficit: isSurplus ? 0 : week.regularSpend - budget,
  };
}
