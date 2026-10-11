export interface ResolveBudgetsParams {
  user: {
    user_metadata?: {
      weekly_budget?: number | string | null;
      monthly_budget?: number | string | null;
    } | null;
  };
  wallets?: Array<{
    id: string;
    kind: "spending" | "stash" | string;
    weekly_budget?: number | null;
    monthly_budget?: number | null;
  }>;
  fallbackWallet?: {
    weekly_budget?: number | null;
    monthly_budget?: number | null;
  } | null;
  multiSakuEnabled: boolean;
  selectedSakuId: string;
  totalDaysInMonth: number;
}

export interface ResolvedBudgets {
  weeklyBudget: number;
  monthlyBudget: number;
}

/**
 * Single source of truth for weekly and monthly budget calculation
 * matching the dashboard logic across single-saku, multi-saku 'all', and specific saku views.
 */
export function resolveBudgets({
  user,
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

  let weeklyBudget: number;
  let monthlyBudget: number;

  if (multiSakuEnabled && selectedWallet) {
    weeklyBudget =
      selectedWallet.weekly_budget !== null && selectedWallet.weekly_budget !== undefined
        ? Number(selectedWallet.weekly_budget)
        : Number(user.user_metadata?.weekly_budget || 500000);

    monthlyBudget =
      selectedWallet.monthly_budget !== null && selectedWallet.monthly_budget !== undefined
        ? Number(selectedWallet.monthly_budget)
        : Number(
            user.user_metadata?.monthly_budget || Math.round((weeklyBudget / 7) * totalDaysInMonth)
          );
  } else if (multiSakuEnabled && selectedSakuId === "all" && wallets.length > 0) {
    const spendingWallets = wallets.filter((w) => w.kind === "spending");
    const totalWeeklyBudget = spendingWallets.reduce(
      (sum, w) => sum + (w.weekly_budget !== null && w.weekly_budget !== undefined ? Number(w.weekly_budget) : 0),
      0
    );
    const totalMonthlyBudget = spendingWallets.reduce(
      (sum, w) =>
        sum +
        (w.monthly_budget !== null && w.monthly_budget !== undefined
          ? Number(w.monthly_budget)
          : w.weekly_budget !== null && w.weekly_budget !== undefined
          ? Math.round((Number(w.weekly_budget) / 7) * totalDaysInMonth)
          : 0),
      0
    );

    weeklyBudget =
      totalWeeklyBudget > 0
        ? totalWeeklyBudget
        : Number(user.user_metadata?.weekly_budget || 500000);

    monthlyBudget =
      totalMonthlyBudget > 0
        ? totalMonthlyBudget
        : Number(
            user.user_metadata?.monthly_budget || Math.round((weeklyBudget / 7) * totalDaysInMonth)
          );
  } else {
    const activeWallet = fallbackWallet || (wallets.length > 0 ? wallets[0] : null);
    weeklyBudget =
      activeWallet?.weekly_budget !== null && activeWallet?.weekly_budget !== undefined
        ? Number(activeWallet.weekly_budget)
        : Number(user.user_metadata?.weekly_budget || 500000);

    monthlyBudget =
      activeWallet?.monthly_budget !== null && activeWallet?.monthly_budget !== undefined
        ? Number(activeWallet.monthly_budget)
        : Number(
            user.user_metadata?.monthly_budget || Math.round((weeklyBudget / 7) * totalDaysInMonth)
          );
  }

  return { weeklyBudget, monthlyBudget };
}
