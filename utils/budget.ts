type BudgetValue = number | string | null | undefined;

export interface ResolveBudgetsParams {
  user?: {
    user_metadata?: {
      weekly_budget?: number | string | null;
      monthly_budget?: number | string | null;
    } | null;
  } | null;
  wallets?: Array<{
    id: string;
    kind: "spending" | "stash" | string;
    weekly_budget?: number | null;
    monthly_budget?: number | null;
  }>;
  fallbackWallet?: {
    kind?: "spending" | "stash" | string;
    weekly_budget?: number | null;
    monthly_budget?: number | null;
  } | null;
  multiSakuEnabled: boolean;
  selectedSakuId: string;
  totalDaysInMonth: number;
}

/** `null` means the user has not set a budget for that period. */
export interface ResolvedBudgets {
  weeklyBudget: number | null;
  monthlyBudget: number | null;
}

/** A stored budget counts only when it is a positive number; anything else is "not set". */
export function budgetOrNull(value: BudgetValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** A monthly budget derived from a weekly one, pro rata over the days of the month. */
export function weeklyToMonthly(weekly: number | null, totalDaysInMonth: number): number | null {
  return weekly === null ? null : Math.round((weekly / 7) * totalDaysInMonth);
}

function walletBudgets(
  wallet: { kind?: string; weekly_budget?: BudgetValue; monthly_budget?: BudgetValue } | null,
  totalDaysInMonth: number
): ResolvedBudgets {
  // A savings (stash) Saku holds money; it has no spending budget.
  if (!wallet || wallet.kind === "stash") return { weeklyBudget: null, monthlyBudget: null };
  const weeklyBudget = budgetOrNull(wallet.weekly_budget);
  const monthlyBudget = budgetOrNull(wallet.monthly_budget) ?? weeklyToMonthly(weeklyBudget, totalDaysInMonth);
  return { weeklyBudget, monthlyBudget };
}

/**
 * Single source of truth for weekly and monthly budget calculation
 * matching the dashboard logic across single-saku, multi-saku 'all', and specific saku views.
 * There is no default: a budget the user never set resolves to null.
 */
export function resolveBudgets({
  wallets = [],
  fallbackWallet = null,
  multiSakuEnabled,
  selectedSakuId,
  totalDaysInMonth,
}: ResolveBudgetsParams): ResolvedBudgets {
  const selectedWallet =
    multiSakuEnabled && selectedSakuId !== "all"
      ? wallets.find((w) => w.id === selectedSakuId) || null
      : null;

  if (multiSakuEnabled && selectedWallet) {
    return walletBudgets(selectedWallet, totalDaysInMonth);
  }

  if (multiSakuEnabled && selectedSakuId === "all" && wallets.length > 0) {
    const perWallet = wallets
      .filter((w) => w.kind === "spending")
      .map((w) => walletBudgets(w, totalDaysInMonth));
    const weeklyParts = perWallet.map((b) => b.weeklyBudget).filter((v): v is number => v !== null);
    const monthlyParts = perWallet.map((b) => b.monthlyBudget).filter((v): v is number => v !== null);
    const weeklyBudget = weeklyParts.length > 0 ? weeklyParts.reduce((a, b) => a + b, 0) : null;
    const monthlyBudget = monthlyParts.length > 0 ? monthlyParts.reduce((a, b) => a + b, 0) : null;
    return { weeklyBudget, monthlyBudget };
  }

  const activeWallet = fallbackWallet || (wallets.length > 0 ? wallets[0] : null);
  return walletBudgets(activeWallet, totalDaysInMonth);
}

/** Days of the period still to come, counting today. Week runs Monday to Sunday. */
export function daysLeftInPeriod(period: "week" | "month", now: Date, totalDaysInMonth: number): number {
  if (period === "month") return Math.max(totalDaysInMonth - now.getDate() + 1, 1);
  const dayIndex = ((now.getDay() + 6) % 7) + 1; // Mon=1 ... Sun=7
  return Math.max(7 - dayIndex + 1, 1);
}

/**
 * Today's share of what is left of the budget: the remainder at the start of today,
 * spread evenly over today and the days still to come. This is the one daily figure
 * the dashboard shows; "left today" is this minus what was already spent today.
 */
export function dailyAllowance(budget: number, spentBeforeToday: number, daysLeftIncludingToday: number): number {
  return (budget - spentBeforeToday) / Math.max(daysLeftIncludingToday, 1);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDay(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Inclusive number of calendar days between two `yyyy-MM-dd` dates. */
export function daysBetweenInclusive(startStr: string, endStr: string): number {
  return Math.round((toUtcDay(endStr) - toUtcDay(startStr)) / DAY_MS) + 1;
}

/**
 * Days of a period that have already started, counting today: a finished period
 * counts in full, the current one up to today, and a future one as a single day
 * so an average never divides by zero.
 */
export function daysElapsedInPeriod(startStr: string, endStr: string, todayStr: string): number {
  const length = Math.max(daysBetweenInclusive(startStr, endStr), 1);
  const elapsed = daysBetweenInclusive(startStr, todayStr < endStr ? todayStr : endStr);
  return Math.min(Math.max(elapsed, 1), length);
}

/** A recap covering more than a week is a month view. */
export function periodKindOf(startStr: string, endStr: string): "week" | "month" {
  return daysBetweenInclusive(startStr, endStr) > 7 ? "month" : "week";
}
