import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { getNowInTimezone } from "@/utils/date";
import { getDictionaryServer, formatDateServer } from "@/utils/i18n/server";
import { calculateExemptTotals } from "@/utils/exemptions";
import { budgetOrNull } from "@/utils/budget";
import { weekCounts, weekSurplus } from "@/utils/surplus";
import SavingsClient, {
  CompletedWeekData,
  SavingsGoalItem,
} from "./SavingsClient";
import { ExpenseItem } from "@/app/ExpenseList";
import { SavingsHistoryItem } from "@/app/actions";
import {
  getPrimaryWallets,
  getSavingsGoals,
  getSavingsHistory,
} from "@/utils/wallets/server";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { locale } = await getDictionaryServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?next=/savings");
  }

  const isGuest = Boolean(user.is_anonymous);

  // Active weekly budget & primary wallets
  const { spendingWallet, stashWallet } = await getPrimaryWallets(
    supabase,
    user.id
  );

  // No default: without a weekly budget there is no surplus to report.
  const weeklyBudget = budgetOrNull(spendingWallet?.weekly_budget);

  // User savings goals from savings_goals table
  const rawGoals: SavingsGoalItem[] = await getSavingsGoals(
    supabase,
    user.id
  );

  // Core Savings balance (Tabungan Pokok) from stash wallet
  const coreSavings = stashWallet ? Number(stashWallet.current_balance) : 0;

  // Savings balance history from wallet_transactions
  const rawHistory: SavingsHistoryItem[] = await getSavingsHistory(
    supabase,
    user.id,
    stashWallet?.id
  );

  // Cumulative surplus already swept/transferred calculated directly from transaction ledger
  const sweptSurplus = rawHistory
    .filter((h) => h.type === "surplus_sweep" || h.type === "surplus_sweep_goal")
    .reduce((sum, h) => sum + Number(h.amount || 0), 0);

  let savingsHistory = rawHistory;
  if (savingsHistory.length === 0 && coreSavings > 0) {
    savingsHistory = [
      {
        id: "initial-balance",
        type: "manual_deposit",
        amount: coreSavings,
        balanceAfter: coreSavings,
        note: locale === "id" ? "Saldo awal tercatat" : "Initial savings balance",
        createdAt: user.created_at || new Date().toISOString(),
      },
    ];
  }

  // Current week boundary (Monday 00:00)
  const now = getNowInTimezone();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd");

  // Fetch all user expenses ordered newest first
  const { data: allExpenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("spent_at", { ascending: false });

  // Group past expenses by week strictly before this week
  const pastWeekMap = new Map<string, ExpenseItem[]>();
  const ongoingWeekExpenses: ExpenseItem[] = [];

  (allExpenses || []).forEach((expense) => {
    const dateStr = expense.spent_at.includes("T")
      ? expense.spent_at.split("T")[0]
      : expense.spent_at;

    if (dateStr >= thisWeekStartStr) {
      ongoingWeekExpenses.push(expense);
      return;
    }

    const expDate = parseISO(dateStr);
    const expWeekStart = startOfWeek(expDate, { weekStartsOn: 1 });
    const weekKey = format(expWeekStart, "yyyy-MM-dd");

    if (!pastWeekMap.has(weekKey)) {
      pastWeekMap.set(weekKey, []);
    }
    pastWeekMap.get(weekKey)!.push(expense);
  });

  // Only weeks from the one the account was created in count towards the surplus,
  // so back-dated entries from before the account existed add nothing.
  const firstCountedWeekStartStr = user.created_at
    ? format(startOfWeek(parseISO(user.created_at), { weekStartsOn: 1 }), "yyyy-MM-dd")
    : null;

  // Calculate completed weeks
  const completedWeeks: CompletedWeekData[] = Array.from(pastWeekMap.entries())
    .filter(([weekId]) => weekCounts(weekId, firstCountedWeekStartStr))
    .map(([weekId, expenses]) => {
      const startDate = parseISO(weekId);
      const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const exemptTotals = calculateExemptTotals(expenses);
      const regularSpend = exemptTotals.regularTotal;
      const totalSpend = exemptTotals.totalSpend;

      const { budget, isSurplus, surplus, deficit: rawDeficit } = weekSurplus(
        { weekStartStr: weekId, regularSpend },
        weeklyBudget
      );

      const label = `${formatDateServer(startDate, "d MMM", locale)} – ${formatDateServer(
        endDate,
        "d MMM yyyy",
        locale
      )}`;

      return {
        weekId,
        startDateStr: weekId,
        endDateStr,
        label,
        budget,
        regularSpend,
        totalSpend,
        isSurplus,
        surplus,
        deficit: rawDeficit,
        expensesCount: expenses.length,
      };
    })
    .sort((a, b) => (a.startDateStr < b.startDateStr ? 1 : -1));

  // Ongoing week metrics
  const ongoingExempt = calculateExemptTotals(ongoingWeekExpenses);
  const ongoingSpend = ongoingExempt.regularTotal;
  const ongoingProjectedSurplus = weeklyBudget === null ? 0 : Math.max(0, weeklyBudget - ongoingSpend);

  // Financial aggregates: Pillar 1 (Core Savings / Vault)
  const totalAllocatedToGoals = rawGoals.reduce(
    (sum, g) => sum + Number(g.allocatedAmount || 0),
    0
  );
  const availableCoreSavings = Math.max(0, coreSavings - totalAllocatedToGoals);

  // Financial aggregates: Pillar 2 (Weekly Budget Surpluses / Rollover Buffer)
  const unspentSurplusTotal = completedWeeks.reduce(
    (sum, w) => sum + (w.isSurplus ? w.surplus : 0),
    0
  );
  const availableSurplus = Math.max(0, unspentSurplusTotal - sweptSurplus);

  return (
    <SavingsClient
      weeklyBudget={weeklyBudget ?? 0}
      completedWeeks={completedWeeks}
      goals={rawGoals}
      coreSavings={coreSavings}
      availableCoreSavings={availableCoreSavings}
      totalAllocatedToGoals={totalAllocatedToGoals}
      unspentSurplusTotal={unspentSurplusTotal}
      sweptSurplus={sweptSurplus}
      availableSurplus={availableSurplus}
      ongoingSpend={ongoingSpend}
      ongoingProjectedSurplus={ongoingProjectedSurplus}
      isGuest={isGuest}
      savingsHistory={savingsHistory}
    />
  );
}

