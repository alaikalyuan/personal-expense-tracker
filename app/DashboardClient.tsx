"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { useRouter } from "next/navigation";
import UserMenu from "./UserMenu";
import TrackingStreak from "./TrackingStreak";
import { StreakData } from "@/utils/streak";
import { ShieldAlert, CreditCard, CheckCircle2, TriangleAlert, Mail, ChevronDown, ChevronRight } from "lucide-react";
import InstallPrompt from "./InstallPrompt";
import CadenceToggle from "./CadenceToggle";
import ProjectedBurnCard from "./ProjectedBurnCard";
import BudgetProgress from "./BudgetProgress";
import dynamic from "next/dynamic";

// Loaded on first open; it is rendered outside the receipt card so the card's
// filter and mask cannot clip it.
const BudgetEditDialog = dynamic(() => import("./BudgetEditDialog"), { ssr: false });
import BreakdownCard, { DaySpend, WeekSpend, CategorySpend } from "./BreakdownCard";
import ExpenseList, { ExpenseItem } from "./ExpenseList";
import { useTranslation } from "@/utils/i18n/context";
import { calculateExemptTotals, isExpenseExempt } from "@/utils/exemptions";
import { dailyAllowance, daysLeftInPeriod } from "@/utils/budget";
// Loaded on first open: it pulls in the Supabase browser client (A002-41).
const UpgradeAccountModal = dynamic(() => import("./UpgradeAccountModal"));
import SakuSwitcher from "./SakuSwitcher";
import { WalletBalance } from "@/utils/wallets/server";
import AiHeaderButton from "@/app/ai/AiHeaderButton";
import { paySubscription } from "@/app/subscriptions/actions";

import PendingTransactionsBanner from "@/app/email-sync/PendingTransactionsBanner";
import type { PendingEmailTransaction } from "@/app/email-sync/actions";

interface DashboardClientProps {
  initialCadence: "week" | "month";
  allExpenses: ExpenseItem[];
  priorMtdSpend: number;
  /** null when the user has not set a budget for that period. */
  weeklyBudget: number | null;
  monthlyBudget: number | null;
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
    category?: string;
    pay_from_wallet_id?: string | null;
    split_config?: {
      split_mode?: "equal" | "custom";
      friends?: Array<{ name: string; share?: number }>;
      auto_create_split_bill?: boolean;
      auto_log_to_expenses?: boolean;
    };
  }>;
  wallets?: WalletBalance[];
  selectedSakuId?: string;
  multiSakuEnabled?: boolean;
  pendingEmailTransactions?: PendingEmailTransaction[];
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
  pendingEmailTransactions = [],
}: DashboardClientProps) {
  const router = useRouter();
  const [cadence, setCadence] = useState<"week" | "month">(initialCadence);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(Boolean(initialAuthMode));
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login">(initialAuthMode || "signup");
  const [authModalError, setAuthModalError] = useState<string | null>(initialAuthError || null);
  const [mergedToastCount, setMergedToastCount] = useState<number>(initialMergedCount);
  const [subToastMessage, setSubToastMessage] = useState<string | null>(null);
  const [subErrorMessage, setSubErrorMessage] = useState<string | null>(null);
  const [pendingEmailCount, setPendingEmailCount] = useState(pendingEmailTransactions.length);
  const [showEmailReview, setShowEmailReview] = useState(false);
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

  // Budgets: null means none is set, and nothing below invents one.
  const activeBudget = isMonth ? monthlyBudget : weeklyBudget;
  const hasBudget = activeBudget !== null && activeBudget > 0;
  const budgetAmount = hasBudget ? activeBudget : 0;
  const isOverBudget = hasBudget && regularTotal > budgetAmount;

  // Day index & pacing
  const todayDayIndex = (now.getDay() + 6) % 7 + 1;
  const elapsedDays = isMonth ? currentDay : todayDayIndex;
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
        dateRange: `${startDay}-${endDay}${formatDate(chunkStartDate, "MMM")}`,
        amount: chunkTotal,
        isCurrent,
        isFuture,
      };
    });
  }, [allExpenses, totalDaysInMonth, startOfMonthDate, currentDay, formatDate]);

  // Anomaly suggestion
  const unexemptAnomaly = useMemo(() => {
    if (!hasBudget || activePeriodTotal <= budgetAmount) return null;
    return (
      activeExpenses.find((e) => {
        if (isExpenseExempt(e)) return false;
        const amt = Number(e.amount);
        return amt >= budgetAmount * 0.3 || amt >= 300000;
      }) || null
    );
  }, [hasBudget, activePeriodTotal, budgetAmount, activeExpenses]);

  // Selected wallet object
  const selectedWalletObj = useMemo(() => {
    if (!multiSakuEnabled || selectedSakuId === "all") return null;
    return wallets.find((w) => w.id === selectedSakuId) || null;
  }, [wallets, selectedSakuId, multiSakuEnabled]);

  // A savings Saku holds money; it has no spending budget to set or show.
  const isStashView = selectedWalletObj?.kind === "stash";

  // Check if subscription matches active wallet view
  const isSubForSelectedWallet = useCallback(
    (sub: { pay_from_wallet_id?: string | null }): boolean => {
      if (!multiSakuEnabled || selectedSakuId === "all" || !selectedWalletObj) {
        return true;
      }
      if (sub.pay_from_wallet_id) {
        return sub.pay_from_wallet_id === selectedWalletObj.id;
      }
      return selectedWalletObj.is_primary;
    },
    [multiSakuEnabled, selectedSakuId, selectedWalletObj]
  );

  // Helper to compute user share of subscription cost
  const getSubscriptionShare = (sub: {
    price: number;
    is_split: boolean;
    split_config?: {
      split_mode?: "equal" | "custom";
      friends?: Array<{ name: string; share?: number }>;
    };
  }): number => {
    const rawPrice = Number(sub.price) || 0;
    if (!sub.is_split || !sub.split_config?.friends || sub.split_config.friends.length === 0) {
      return rawPrice;
    }
    if (sub.split_config.split_mode === "custom") {
      const friendShare = sub.split_config.friends.reduce(
        (sum, f) => sum + (Number(f.share) || 0),
        0
      );
      return Math.max(0, rawPrice - friendShare);
    }
    const totalCount = sub.split_config.friends.length + 1;
    return Math.round(rawPrice / totalCount);
  };

  // Subscriptions due in the active period (on or before activeEndStr)
  const dueSubscriptions = useMemo(() => {
    return (upcomingSubscriptions || [])
      .filter((sub) => {
        if (!isSubForSelectedWallet(sub)) return false;
        // Check if next_renewal_date falls on or before end of current period
        return sub.next_renewal_date <= activeEndStr;
      })
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        userShare: getSubscriptionShare(sub),
        price: Number(sub.price) || 0,
        next_renewal_date: sub.next_renewal_date,
        billing_cycle: sub.billing_cycle,
        is_split: sub.is_split,
        payment_platform: sub.payment_platform,
      }));
  }, [upcomingSubscriptions, activeEndStr, isSubForSelectedWallet]);

  const projectedSubscriptionsTotal = useMemo(() => {
    return dueSubscriptions.reduce((acc, curr) => acc + curr.userShare, 0);
  }, [dueSubscriptions]);

  // Subscriptions renewing soon (<= 4 days) for the top alert banner
  const soonDueSubscriptions = useMemo(() => {
    return (upcomingSubscriptions || []).filter((sub) => {
      const daysDiff = Math.ceil(
        (new Date(sub.next_renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff >= -1 && daysDiff <= 4;
    });
  }, [upcomingSubscriptions, now]);

  // Handle paying subscription (logs expense and advances renewal date)
  const handlePaySubscription = async (id: string, name: string) => {
    try {
      await paySubscription(id);
      setSubToastMessage(
        t.budget.paidSuccessToast
          ? t.budget.paidSuccessToast.replace("{name}", name)
          : `Langganan ${name} berhasil dicatat ke pengeluaran`
      );
      router.refresh();
      setTimeout(() => {
        setSubToastMessage(null);
      }, 4500);
    } catch (err: unknown) {
      setSubErrorMessage(err instanceof Error ? err.message : t.home.saveFailed);
      setTimeout(() => setSubErrorMessage(null), 4500);
    }
  };

  // The day's summary: how much of today's share of the budget is still unspent.
  const todayStr = useMemo(() => format(now, "yyyy-MM-dd"), [now]);
  const todayRegular = useMemo(() => {
    const todays = activeExpenses.filter((item) => {
      const d = item.spent_at.includes("T") ? item.spent_at.split("T")[0] : item.spent_at;
      return d === todayStr;
    });
    return calculateExemptTotals(todays).regularTotal;
  }, [activeExpenses, todayStr]);

  const daysLeft = daysLeftInPeriod(cadence, now, totalDaysInMonth);
  const periodRemaining = budgetAmount - regularTotal;
  // The one daily figure for this view; the month card's allowance uses it too.
  const todayShare = dailyAllowance(budgetAmount, regularTotal - todayRegular, daysLeft);
  const leftToday = Math.round(todayShare - todayRegular);
  const overToday = hasBudget && !isOverBudget && leftToday < 0;

  let focalLabel = t.home.leftToday;
  let focalAmount = Math.max(leftToday, 0);
  let focalTone = "text-ink";
  let statusText = "";
  let statusTone = "text-ok";
  let StatusIcon = CheckCircle2;

  if (!hasBudget) {
    focalLabel = t.home.spentToday;
    focalAmount = todayRegular;
  } else if (isOverBudget) {
    focalAmount = 0;
    focalTone = "text-danger";
    statusText = t.home.statusOverPeriod.replace("{amount}", formatCurrency(Math.abs(periodRemaining)));
    statusTone = "text-danger";
    StatusIcon = TriangleAlert;
  } else if (overToday) {
    focalLabel = t.home.overToday;
    focalAmount = Math.abs(leftToday);
    focalTone = "text-accent-strong";
    statusText =
      daysLeft > 1
        ? t.home.statusOverToday.replace("{amount}", formatCurrency(Math.round(periodRemaining / (daysLeft - 1))))
        : t.home.statusLastDay;
    statusTone = "text-accent-strong";
    StatusIcon = TriangleAlert;
  } else {
    statusText =
      daysLeft > 1
        ? t.home.statusSafe
            .replace("{amount}", formatCurrency(periodRemaining))
            .replace("{days}", String(daysLeft))
        : t.home.statusLastDay;
  }

  const noticeRow =
    "flex min-h-12 w-full items-center gap-3 rounded-xl border border-line bg-card px-3 text-left text-sm font-semibold text-ink hover:bg-paper active:bg-line";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-28 pt-4">
      {/* Header: today's date is the page title */}
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-ink">{formatDate(now, "EEEE, d MMM")}</h1>
          <p className="truncate text-xs text-ink-soft">
            {isMonth
              ? `${formatDate(startOfMonthDate, "d MMM")} - ${formatDate(endOfMonthDate, "d MMM")} · ${currentDay}/${totalDaysInMonth} ${t.dashboard.dayOfMonth}`
              : `${formatDate(startOfWeekDate, "d MMM")} - ${formatDate(endOfWeekDate, "d MMM")}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isGuest ? (
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("signup");
                setAuthModalError(null);
                setIsUpgradeModalOpen(true);
              }}
              aria-label={t.guest.bannerAction}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-accent bg-card px-3 text-sm font-bold text-accent-strong hover:bg-paper active:bg-line"
            >
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              <span>{t.guest.guestButton}</span>
            </button>
          ) : (
            <TrackingStreak streakData={streakData} isOverBudget={isOverBudget} />
          )}
          <AiHeaderButton />
          <UserMenu
            isGuest={isGuest}
            multiSakuEnabled={multiSakuEnabled}
            budget={
              isStashView ? undefined : { period: cadence, amount: budgetAmount, onEdit: () => setIsBudgetOpen(true) }
            }
            onOpenUpgrade={(mode = "signup") => {
              setAuthModalMode(mode);
              setAuthModalError(null);
              setIsUpgradeModalOpen(true);
            }}
          />
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {multiSakuEnabled && wallets.length > 1 && (
          <SakuSwitcher wallets={wallets} selectedSakuId={selectedSakuId} multiSakuEnabled={multiSakuEnabled} />
        )}
        <CadenceToggle currentCadence={cadence} onChange={setCadence} />
      </div>

      {/* The day's summary: the one focal number on this screen, on a torn receipt. */}
      <div className="receipt">
        <section aria-labelledby="day-summary" className="receipt-edge flex flex-col gap-4 rounded-t-2xl bg-card px-5 pb-8 pt-5">
          <div>
            <h2 id="day-summary" className="text-sm font-semibold text-ink-soft">
              {focalLabel}
            </h2>
            <p className={`mt-1 text-4xl font-extrabold tracking-tight ${focalTone}`}>{formatCurrency(focalAmount)}</p>
            {statusText && (
              <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${statusTone}`}>
                <StatusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{statusText}</span>
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-line pt-3">
            <BudgetProgress
              period={cadence}
              weeklyTotal={activePeriodTotal}
              weeklyBudget={budgetAmount}
              noBudgetText={isStashView ? t.home.noBudgetStash : undefined}
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
              projectedSubscriptionsTotal={projectedSubscriptionsTotal}
              dueSubscriptions={dueSubscriptions}
              onPaySubscription={handlePaySubscription}
              onEditBudget={isStashView ? undefined : () => setIsBudgetOpen(true)}
            />
          </div>
        </section>
      </div>

      {/* Notices: one line each, details on tap */}
      {(pendingEmailCount > 0 || soonDueSubscriptions.length > 0) && (
        <div className="flex flex-col gap-2">
          {!isGuest && pendingEmailCount > 0 && (
            <button
              type="button"
              onClick={() => setShowEmailReview((prev) => !prev)}
              aria-expanded={showEmailReview}
              className={noticeRow}
            >
              <Mail className="h-5 w-5 shrink-0 text-accent-strong" aria-hidden="true" />
              <span className="min-w-0 flex-1">{t.home.emailPending.replace("{count}", String(pendingEmailCount))}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${showEmailReview ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}
          {!isGuest && showEmailReview && (
            <PendingTransactionsBanner
              initialTransactions={pendingEmailTransactions}
              spendingWallets={wallets.filter((w) => w.kind === "spending")}
              onCountChange={setPendingEmailCount}
            />
          )}
          {soonDueSubscriptions.length > 0 && (
            <Link href="/subscriptions" className={noticeRow}>
              <CreditCard className="h-5 w-5 shrink-0 text-accent-strong" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {t.home.subsDue.replace("{count}", String(soonDueSubscriptions.length))}
                </span>
                <span className="block truncate text-xs font-medium text-ink-soft">
                  {soonDueSubscriptions.map((s) => s.name).join(", ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      <InstallPrompt />

      {/* Today's expenses sit directly under the summary */}
      <ExpenseList
        expenses={activeExpenses}
        showPeriodToggle={true}
        dashboardPeriod={cadence}
        title={t.dashboard.recentEntries}
        weeklyBudget={isStashView ? undefined : hasBudget ? budgetAmount : null}
        startDateStr={activeStartStr}
        endDateStr={activeEndStr}
        wallets={wallets}
      />

      {/* Insights come last: useful, but not what the student opened the app for */}
      <dl className="rounded-2xl border border-line bg-card px-4">
        <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-3">
          <dt className="text-sm text-ink-soft">{t.dashboard.dailyAvg}</dt>
          <dd className="text-sm font-bold text-ink">{formatCurrency(Math.round(avgDailySpend))}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-3">
          <dt className="shrink-0 text-sm text-ink-soft">{t.dashboard.topCategory}</dt>
          <dd className="min-w-0 truncate text-sm font-bold text-ink">
            {topCategoryName} · {formatCurrency(Number(topCategory[1]))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-3">
          <dt className="shrink-0 text-sm text-ink-soft">{t.dashboard.largest}</dt>
          <dd className="min-w-0 truncate text-sm font-bold text-ink">
            {largestExpense ? `${largestExpense.name} · ${formatCurrency(largestSpend)}` : t.common.none}
          </dd>
        </div>
      </dl>

      {isMonth && !isStashView && (
        <ProjectedBurnCard
          monthTotal={activePeriodTotal}
          regularTotal={regularTotal}
          exemptTotal={exemptTotal}
          monthlyBudget={hasBudget ? budgetAmount : null}
          dailyAllowance={hasBudget && !isOverBudget ? Math.round(todayShare) : 0}
          elapsedDays={currentDay}
          totalDays={totalDaysInMonth}
          priorMtdSpend={priorMtdSpend}
        />
      )}

      <BreakdownCard
        period={cadence}
        dailyData={dailyData}
        weeklyChunks={weeklyChunks}
        categoryData={categoryData}
        weeklyTotal={activePeriodTotal}
      />

      {/* The welcome screen lives in GuestLanding, before a session exists */}
      {isBudgetOpen && (
        <BudgetEditDialog period={cadence} currentBudget={budgetAmount} onClose={() => setIsBudgetOpen(false)} />
      )}

      {isUpgradeModalOpen && (
        <UpgradeAccountModal
          isOpen
          onClose={() => {
            setIsUpgradeModalOpen(false);
            setAuthModalError(null);
          }}
          initialMode={authModalMode}
          initialError={authModalError}
        />
      )}

      {/* Toasts sit above the bottom bar and are announced to screen readers */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
        {mergedToastCount > 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-card animate-modal-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.guest.mergedToast.replace("{count}", String(mergedToastCount))}</span>
          </p>
        )}
        {subToastMessage && (
          <p className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-card animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{subToastMessage}</span>
          </p>
        )}
        {subErrorMessage && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-card animate-fade-in">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{subErrorMessage}</span>
          </p>
        )}
      </div>
    </main>
  );
}
