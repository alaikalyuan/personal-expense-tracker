"use client";

import { useState, useMemo } from "react";
import {
  addDays,
  format,
  isAfter,
  isSameDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDate,
  setDate,
} from "date-fns";
import UserMenu from "./UserMenu";
import TrackingStreak from "./TrackingStreak";
import { StreakData } from "@/utils/streak";
import InstallPrompt from "./InstallPrompt";
import CadenceToggle from "./CadenceToggle";
import ProjectedBurnCard from "./ProjectedBurnCard";
import BudgetProgress from "./BudgetProgress";
import BreakdownCard, { DaySpend, WeekSpend, CategorySpend } from "./BreakdownCard";
import ExpenseList, { ExpenseItem } from "./ExpenseList";
import { useTranslation } from "@/utils/i18n/context";
import { calculateExemptTotals, isExpenseExempt } from "@/utils/exemptions";

interface DashboardClientProps {
  initialCadence: "week" | "month";
  allExpenses: ExpenseItem[];
  priorMtdSpend: number;
  weeklyBudget: number;
  monthlyBudget: number;
  streakData: StreakData;
  nowIso: string;
}

export default function DashboardClient({
  initialCadence,
  allExpenses,
  priorMtdSpend,
  weeklyBudget,
  monthlyBudget,
  streakData,
  nowIso,
}: DashboardClientProps) {
  const [cadence, setCadence] = useState<"week" | "month">(initialCadence);
  const { t, formatDate, getCategoryLabel } = useTranslation();

  const isMonth = cadence === "month";
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  // Date boundaries for Week
  const startOfWeekDate = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const endOfWeekDate = useMemo(() => startOfWeekDate ? addDays(startOfWeekDate, 6) : now, [startOfWeekDate, now]);
  const startOfWeekStr = useMemo(() => format(startOfWeekDate, "yyyy-MM-dd"), [startOfWeekDate]);
  const endOfWeekStr = useMemo(() => format(endOfWeekDate, "yyyy-MM-dd"), [endOfWeekDate]);

  // Date boundaries for Month
  const startOfMonthDate = useMemo(() => startOfMonth(now), [now]);
  const endOfMonthDate = useMemo(() => endOfMonth(now), [now]);
  const startOfMonthStr = useMemo(() => format(startOfMonthDate, "yyyy-MM-dd"), [startOfMonthDate]);
  const endOfMonthStr = useMemo(() => format(endOfMonthDate, "yyyy-MM-dd"), [endOfMonthDate]);
  const currentDay = useMemo(() => getDate(now), [now]);
  const totalDaysInMonth = useMemo(() => getDaysInMonth(now), [now]);

  // Active boundaries
  const activeStartStr = isMonth ? startOfMonthStr : startOfWeekStr;
  const activeEndStr = isMonth ? endOfMonthStr : endOfWeekStr;

  // Filter expenses for current view in 0ms purely in client memory
  const activeExpenses = useMemo(() => {
    return allExpenses.filter((item) => {
      const d = item.spent_at.includes("T") ? item.spent_at.split("T")[0] : item.spent_at;
      return d >= activeStartStr && d <= activeEndStr;
    });
  }, [allExpenses, activeStartStr, activeEndStr]);

  // Totals & exemptions
  const {
    totalSpend: activePeriodTotal,
    regularTotal,
    exemptTotal,
    exemptCount,
  } = useMemo(() => calculateExemptTotals(activeExpenses), [activeExpenses]);

  // Budgets
  const activeBudget = isMonth ? monthlyBudget : weeklyBudget;
  const isOverBudget = activeBudget > 0 && regularTotal > activeBudget;

  // Day index & pacing
  const todayDayIndex = (now.getDay() + 6) % 7 + 1;
  const elapsedDays = isMonth ? currentDay : todayDayIndex;
  const daysRemaining = isMonth
    ? Math.max(totalDaysInMonth - currentDay, 0)
    : Math.max(7 - todayDayIndex + 1, 1);
  const avgDailySpend = regularTotal / Math.max(elapsedDays, 1);

  // Largest spend
  const largestExpense = useMemo(() => {
    if (activeExpenses.length === 0) return null;
    return activeExpenses.reduce((largest, expense) =>
      Number(expense.amount) > Number(largest.amount) ? expense : largest
    );
  }, [activeExpenses]);
  const largestSpend = Number(largestExpense?.amount ?? 0);

  // Category totals
  const categoryTotals = useMemo(() => {
    return activeExpenses.reduce<Record<string, number>>((acc, curr) => {
      const amt = Number(curr.amount);
      acc[curr.category] = (acc[curr.category] || 0) + amt;
      return acc;
    }, {});
  }, [activeExpenses]);

  const topCategory = useMemo(() => {
    return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
  }, [categoryTotals]);

  const topCategoryName =
    topCategory[0] === "None"
      ? t.common.none
      : getCategoryLabel(topCategory[0]);

  // Category breakdown list
  const categoryData: CategorySpend[] = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          activePeriodTotal > 0 ? Math.round((amount / activePeriodTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [categoryTotals, activePeriodTotal]);

  // Daily breakdown (for Week mode)
  const dailyData: DaySpend[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(startOfWeekDate, i);
      const dateStr = format(dayDate, "yyyy-MM-dd");
      const dayTotal = allExpenses.reduce((acc, curr) => {
        const d = curr.spent_at.includes("T") ? curr.spent_at.split("T")[0] : curr.spent_at;
        if (d === dateStr) {
          return acc + Number(curr.amount);
        }
        return acc;
      }, 0);

      return {
        dayName: formatDate(dayDate, "EEE"),
        dateStr,
        formattedDate: formatDate(dayDate, "EEEE, MMM d"),
        amount: dayTotal,
        isToday: isSameDay(dayDate, now),
        isFuture: isAfter(dayDate, now),
      };
    });
  }, [allExpenses, startOfWeekDate, now, formatDate]);

  // Weekly chunks (for Month mode: W1: 1-7, W2: 8-14, etc.)
  const weeklyChunks: WeekSpend[] = useMemo(() => {
    const numWeeks = Math.ceil(totalDaysInMonth / 7);
    return Array.from({ length: numWeeks }, (_, i) => {
      const startDay = i * 7 + 1;
      const endDay = Math.min((i + 1) * 7, totalDaysInMonth);
      const chunkStartDate = setDate(startOfMonthDate, startDay);
      const chunkEndDate = setDate(startOfMonthDate, endDay);
      const chunkStartStr = format(chunkStartDate, "yyyy-MM-dd");
      const chunkEndStr = format(chunkEndDate, "yyyy-MM-dd");

      const chunkTotal = allExpenses.reduce((acc, curr) => {
        const d = curr.spent_at.includes("T") ? curr.spent_at.split("T")[0] : curr.spent_at;
        if (d >= chunkStartStr && d <= chunkEndStr) {
          return acc + Number(curr.amount);
        }
        return acc;
      }, 0);

      const isCurrent = currentDay >= startDay && currentDay <= endDay;
      const isFuture = currentDay < startDay;

      return {
        weekLabel: `W${i + 1}`,
        dateRange: `${startDay}–${endDay} ${formatDate(chunkStartDate, "MMM")}`,
        amount: chunkTotal,
        isCurrent,
        isFuture,
      };
    });
  }, [allExpenses, totalDaysInMonth, startOfMonthDate, currentDay, formatDate]);

  // Anomaly suggestion
  const unexemptAnomaly = useMemo(() => {
    if (activePeriodTotal <= activeBudget) return null;
    return (
      activeExpenses.find((e) => {
        if (isExpenseExempt(e)) return false;
        const amt = Number(e.amount);
        return amt >= activeBudget * 0.3 || amt >= 300000;
      }) || null
    );
  }, [activePeriodTotal, activeBudget, activeExpenses]);

  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="font-bold tracking-tight text-lg">{t.dashboard.title}</h1>
          <p className="text-[11px] text-zinc-500">
            {isMonth
              ? `${formatDate(startOfMonthDate, "d MMM")} – ${formatDate(now, "d MMM yyyy")} (${currentDay}/${totalDaysInMonth} ${t.dashboard.dayOfMonth})`
              : `${formatDate(startOfWeekDate, "d MMM")} – ${formatDate(endOfWeekDate, "d MMM yyyy")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrackingStreak
            streakData={streakData}
            isOverBudget={isOverBudget}
          />
          <UserMenu />
        </div>
      </div>

      {/* Instant Cadence Switcher (Week / Month) */}
      <div className="flex justify-center -mt-2">
        <CadenceToggle currentCadence={cadence} onChange={setCadence} />
      </div>

      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Hero Spent Summary */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-linear-to-b dark:from-zinc-900 dark:to-zinc-950 dark:shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isMonth ? t.dashboard.spentThisMonth : t.dashboard.spentThisWeek}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Rp {activePeriodTotal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Budget Progress & Allowance Pace */}
        <BudgetProgress
          period={cadence}
          weeklyTotal={activePeriodTotal}
          weeklyBudget={activeBudget}
          daysRemaining={daysRemaining}
          regularTotal={regularTotal}
          exemptTotal={exemptTotal}
          exemptCount={exemptCount}
          unexemptAnomaly={
            unexemptAnomaly
              ? {
                  id: unexemptAnomaly.id,
                  name: unexemptAnomaly.name,
                  amount: Number(unexemptAnomaly.amount),
                }
              : null
          }
        />

        {/* Micro-Stats Shelf */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
          {/* Daily Average */}
          <div>
            <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.dashboard.dailyAvg}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Rp {Math.round(avgDailySpend).toLocaleString("id-ID")}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              {isMonth
                ? `${currentDay}/${totalDaysInMonth} ${t.dashboard.dayOfMonth}`
                : `${todayDayIndex} ${t.dashboard.dayOfSeven}`}
            </p>
          </div>

          {/* Top Category */}
          <div className="border-l border-zinc-200/80 pl-2 dark:border-zinc-800/60">
            <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.dashboard.topCategory}
            </p>
            <p
              className="mt-0.5 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200"
              title={topCategoryName}
            >
              {topCategoryName}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-zinc-500">
              Rp {Number(topCategory[1]).toLocaleString("id-ID")}
            </p>
          </div>

          {/* Max Spend */}
          <div className="border-l border-zinc-200/80 pl-2 dark:border-zinc-800/60">
            <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.dashboard.largest}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Rp {largestSpend.toLocaleString("id-ID")}
            </p>
            <p
              className="mt-0.5 truncate text-[10px] text-zinc-500"
              title={largestExpense?.name ?? t.common.none}
            >
              {largestExpense?.name ?? t.common.none}
            </p>
          </div>
        </div>
      </div>

      {/* Projected Monthly Burn Rate Card (Visible in Monthly Cadence) */}
      {isMonth && (
        <ProjectedBurnCard
          monthTotal={activePeriodTotal}
          regularTotal={regularTotal}
          exemptTotal={exemptTotal}
          monthlyBudget={monthlyBudget}
          elapsedDays={currentDay}
          totalDays={totalDaysInMonth}
          priorMtdSpend={priorMtdSpend}
        />
      )}

      {/* Breakdown Card */}
      <BreakdownCard
        period={cadence}
        dailyData={dailyData}
        weeklyChunks={weeklyChunks}
        categoryData={categoryData}
        weeklyTotal={activePeriodTotal}
      />

      {/* Expense Log */}
      <ExpenseList
        expenses={activeExpenses}
        showPeriodToggle={true}
        dashboardPeriod={cadence}
        title={t.dashboard.recentEntries}
        weeklyBudget={activeBudget}
        startDateStr={activeStartStr}
        endDateStr={activeEndStr}
      />

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}
