"use client";

import { useState, useMemo, useEffect } from "react";
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
import Link from "next/link";
import UserMenu from "./UserMenu";
import TrackingStreak from "./TrackingStreak";
import { StreakData } from "@/utils/streak";
import { ShieldAlert, Sparkles, CreditCard } from "lucide-react";
import InstallPrompt from "./InstallPrompt";
import CadenceToggle from "./CadenceToggle";
import ProjectedBurnCard from "./ProjectedBurnCard";
import BudgetProgress from "./BudgetProgress";
import BreakdownCard, { DaySpend, WeekSpend, CategorySpend } from "./BreakdownCard";
import ExpenseList, { ExpenseItem } from "./ExpenseList";
import { useTranslation } from "@/utils/i18n/context";
import { calculateExemptTotals, isExpenseExempt } from "@/utils/exemptions";
import WelcomeGuestModal from "./WelcomeGuestModal";
import UpgradeAccountModal from "./UpgradeAccountModal";
import SakuSwitcher from "./SakuSwitcher";
import { WalletBalance } from "@/utils/wallets/server";
import AiAdvisorCard from "./AiAdvisorCard";
import AiAdvisorModal from "./AiAdvisorModal";

interface DashboardClientProps {
  initialCadence: "week" | "month";
  allExpenses: ExpenseItem[];
  priorMtdSpend: number;
  weeklyBudget: number;
  monthlyBudget: number;
  streakData: StreakData;
  nowIso: string;
  isGuest?: boolean;
  initialMergedCount?: number;
  initialAuthMode?: "login" | "signup";
  initialAuthError?: string;
  upcomingSubscriptions?: Array<{
    id: string;
    name: string;
    price: number;
    billing_cycle: string;
    next_renewal_date: string;
    is_split: boolean;
    payment_platform: string;
  }>;
  wallets?: WalletBalance[];
  selectedSakuId?: string;
  multiSakuEnabled?: boolean;
}

export default function DashboardClient({
  initialCadence,
  allExpenses,
  priorMtdSpend,
  weeklyBudget,
  monthlyBudget,
  streakData,
  nowIso,
  isGuest = false,
  initialMergedCount = 0,
  initialAuthMode,
  initialAuthError,
  upcomingSubscriptions = [],
  wallets = [],
  selectedSakuId = "all",
  multiSakuEnabled = false,
}: DashboardClientProps) {
  const [cadence, setCadence] = useState<"week" | "month">(initialCadence);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(Boolean(initialAuthMode));
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login">(initialAuthMode || "signup");
  const [authModalError, setAuthModalError] = useState<string | null>(initialAuthError || null);
  const [mergedToastCount, setMergedToastCount] = useState<number>(initialMergedCount);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { t, formatDate, getCategoryLabel, formatCurrency } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      let urlChanged = false;
      if (url.searchParams.has("auth")) {
        url.searchParams.delete("auth");
        urlChanged = true;
      }
      if (url.searchParams.has("error")) {
        url.searchParams.delete("error");
        urlChanged = true;
      }
      if (urlChanged) {
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, []);

  useEffect(() => {
    if (mergedToastCount > 0) {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("merged")) {
          url.searchParams.delete("merged");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }
      const timer = setTimeout(() => {
        setMergedToastCount(0);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [mergedToastCount]);

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
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold tracking-tight text-lg">{t.dashboard.title}</h1>
          <p className="text-[11px] text-zinc-500">
            {isMonth
              ? `${formatDate(startOfMonthDate, "d MMM")} – ${formatDate(now, "d MMM yyyy")} (${currentDay}/${totalDaysInMonth} ${t.dashboard.dayOfMonth})`
              : `${formatDate(startOfWeekDate, "d MMM")} – ${formatDate(endOfWeekDate, "d MMM yyyy")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGuest ? (
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("signup");
                setAuthModalError(null);
                setIsUpgradeModalOpen(true);
              }}
              aria-label={t.guest.bannerAction}
              className="group flex h-8 items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50/90 px-2.5 text-xs font-semibold text-amber-900 shadow-2xs hover:border-amber-400 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="tracking-tight">{t.guest.guestButton}</span>
            </button>
          ) : (
            <TrackingStreak
              streakData={streakData}
              isOverBudget={isOverBudget}
            />
          )}
          <UserMenu
            isGuest={isGuest}
            multiSakuEnabled={multiSakuEnabled}
            onOpenUpgrade={(mode = "signup") => {
              setAuthModalMode(mode);
              setAuthModalError(null);
              setIsUpgradeModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Saku Switcher & Cadence Switcher (Side by Side) */}
      <div className="flex items-center justify-between gap-2 -mt-2">
        <div>
          {multiSakuEnabled && wallets.length > 1 && (
            <SakuSwitcher
              wallets={wallets}
              selectedSakuId={selectedSakuId}
              multiSakuEnabled={multiSakuEnabled}
            />
          )}
        </div>
        <CadenceToggle currentCadence={cadence} onChange={setCadence} />
      </div>

      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Upcoming Subscriptions Renewal Banner */}
      {upcomingSubscriptions.length > 0 && (
        <Link
          href="/subscriptions"
          className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3.5 dark:border-pink-500/20 dark:bg-pink-500/10 flex items-center justify-between gap-3 transition-all hover:bg-pink-500/15"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {upcomingSubscriptions.length} {t.subscriptions.upcomingDueBanner}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                {upcomingSubscriptions.map((s) => s.name).join(", ")}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 shrink-0">
            {t.subscriptions.viewDetails} &rarr;
          </span>
        </Link>
      )}

      {/* Hero Spent Summary */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-linear-to-b dark:from-zinc-900 dark:to-zinc-950 dark:shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isMonth ? t.dashboard.spentThisMonth : t.dashboard.spentThisWeek}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(activePeriodTotal)}
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
              {formatCurrency(Math.round(avgDailySpend))}
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
              {formatCurrency(Number(topCategory[1]))}
            </p>
          </div>

          {/* Max Spend */}
          <div className="border-l border-zinc-200/80 pl-2 dark:border-zinc-800/60">
            <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.dashboard.largest}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(largestSpend)}
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

      {/* AI Financial Advisor Insights Card */}
      <AiAdvisorCard
        onOpenChat={() => setIsAiModalOpen(true)}
        activePeriodTotal={activePeriodTotal}
        activeBudget={activeBudget}
        topCategoryName={topCategoryName}
        isOverBudget={isOverBudget}
      />

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
        wallets={wallets}
      />

      {/* Guest Onboarding & Upgrade Modals */}
      {isGuest && (
        <WelcomeGuestModal
          onOpenUpgrade={(mode = "signup") => {
            setAuthModalMode(mode);
            setAuthModalError(null);
            setIsUpgradeModalOpen(true);
          }}
        />
      )}
      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isGuest={isGuest}
      />
      <UpgradeAccountModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setAuthModalError(null);
        }}
        initialMode={authModalMode}
        initialError={authModalError}
      />

      {/* Merged guest expenses toast */}
      {mergedToastCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl dark:bg-zinc-100 dark:text-zinc-950 animate-modal-in flex items-center gap-2 border border-zinc-700/50 dark:border-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500 shrink-0" />
          <span>
            {t.guest.mergedToast.replace("{count}", String(mergedToastCount))}
          </span>
        </div>
      )}

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}
