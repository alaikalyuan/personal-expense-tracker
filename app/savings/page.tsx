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
import SavingsClient, {
  CompletedWeekData,
  SavingsGoalItem,
} from "./SavingsClient";
import { ExpenseItem } from "@/app/ExpenseList";

export default async function SavingsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { locale } = await getDictionaryServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/guest?next=/savings");
  }

  const isGuest = Boolean(user.is_anonymous);

  // Active weekly budget (default: 500,000 IDR)
  const weeklyBudget = Number(user.user_metadata?.weekly_budget || 500000);

  // User savings goals from metadata
  const rawGoals: SavingsGoalItem[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  // Core Savings balance (Tabungan Pokok) from metadata
  const coreSavings = Number(user.user_metadata?.savings_manual_deposit || 0);

  // Cumulative surplus already swept/transferred from metadata
  const sweptSurplus = Number(user.user_metadata?.savings_swept_surplus || 0);

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

  // Calculate completed weeks
  const completedWeeks: CompletedWeekData[] = Array.from(pastWeekMap.entries())
    .map(([weekId, expenses]) => {
      const startDate = parseISO(weekId);
      const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const exemptTotals = calculateExemptTotals(expenses);
      const regularSpend = exemptTotals.regularTotal;
      const totalSpend = exemptTotals.totalSpend;

      const isSurplus = regularSpend <= weeklyBudget;
      const surplus = isSurplus ? weeklyBudget - regularSpend : 0;
      const rawDeficit = !isSurplus ? regularSpend - weeklyBudget : 0;

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
        budget: weeklyBudget,
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
  const ongoingProjectedSurplus = Math.max(0, weeklyBudget - ongoingSpend);

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
      weeklyBudget={weeklyBudget}
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
    />
  );
}

