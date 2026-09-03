import { createClient } from "@/utils/supabase/server";
import UserMenu from "./UserMenu";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addDays,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  startOfWeek,
} from "date-fns";
import BreakdownCard, { DaySpend, CategorySpend } from "./BreakdownCard";
import ExpenseList from "./ExpenseList";
import BudgetProgress from "./BudgetProgress";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Calculate start and end of the current week (Monday 00:00 to Sunday 23:59) using date-fns
  const now = new Date();
  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 });
  const startOfWeekStr = format(startOfWeekDate, "yyyy-MM-dd");
  const endOfWeekStr = format(endOfWeekDate, "yyyy-MM-dd");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("spent_at", startOfWeekStr)
    .lte("spent_at", endOfWeekStr)
    .order("spent_at", { ascending: false });

  const weeklyTotal = (expenses || []).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );
  // 1. Largest Single Spend
  const largestExpense = expenses && expenses.length > 0
    ? expenses.reduce((largest, expense) =>
      Number(expense.amount) > Number(largest.amount) ? expense : largest
    )
    : null;
  const largestSpend = Number(largestExpense?.amount ?? 0);

  const todayDayIndex = (new Date().getDay() + 6) % 7 + 1; // Mon=1, Tue=2, ..., Sun=7
  const avgDailySpend = weeklyTotal / todayDayIndex;
  const daysRemaining = Math.max(7 - todayDayIndex + 1, 1);
  const weeklyBudget = Number(user.user_metadata?.weekly_budget || 500000);

  // 3. Top Category by total sum
  const categoryTotals = (expenses || []).reduce<Record<string, number>>((acc, curr) => {
    const amt = Number(curr.amount);
    acc[curr.category] = (acc[curr.category] || 0) + amt;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  // 4. Daily breakdown (Mon - Sun)
  const dailyData: DaySpend[] = Array.from({ length: 7 }, (_, i) => {
    const dayDate = addDays(startOfWeekDate, i);
    const dateStr = format(dayDate, "yyyy-MM-dd");
    const dayTotal = (expenses || []).reduce((acc, curr) => {
      if (curr.spent_at && curr.spent_at.startsWith(dateStr)) {
        return acc + Number(curr.amount);
      }
      return acc;
    }, 0);

    return {
      dayName: format(dayDate, "EEE"),
      dateStr,
      formattedDate: format(dayDate, "EEEE, MMM d"),
      amount: dayTotal,
      isToday: isSameDay(dayDate, now),
      isFuture: isAfter(dayDate, now),
    };
  });

  // 5. Category breakdown
  const categoryData: CategorySpend[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: weeklyTotal > 0 ? Math.round((amount / weeklyTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="font-bold tracking-tight text-lg">Weekly Expenses</h1>
        <UserMenu />
      </div>

      {/* Burn Rate Summary */}
      <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Spent this week
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">
              Rp {weeklyTotal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Budget Progress & Allowance Pace */}
        <BudgetProgress
          weeklyTotal={weeklyTotal}
          weeklyBudget={weeklyBudget}
          daysRemaining={daysRemaining}
        />

        {/* Micro-Stats Shelf */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-800/80 pt-4">
        {/* Daily Average */}
        <div>
          <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">
            Daily Avg
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-200">
            Rp {Math.round(avgDailySpend).toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {todayDayIndex} of 7 days
          </p>
        </div>

        {/* Top Category */}
        <div className="border-l border-zinc-800/60 pl-2">
          <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">
            Top Category
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-zinc-200" title={topCategory[0]}>
            {topCategory[0]}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
            Rp {Number(topCategory[1]).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Max Spend */}
        <div className="border-l border-zinc-800/60 pl-2">
          <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-400">
            Largest
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-200">
            Rp {largestSpend.toLocaleString("id-ID")}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500" title={largestExpense?.name ?? "None"}>
            {largestExpense?.name ?? "None"}
          </p>
        </div>
        </div>
      </div>

      {/* Breakdown Card */}
      <BreakdownCard
        dailyData={dailyData}
        categoryData={categoryData}
        weeklyTotal={weeklyTotal}
      />

      {/* Expense Log */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Recent entries
        </h2>
        <ExpenseList expenses={expenses || []} />
      </div>

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}