import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDate,
  subMonths,
  setDate,
  addDays,
} from "date-fns";
import DashboardClient from "./DashboardClient";
import { getNowInTimezone } from "@/utils/date";
import { calculateStreak } from "@/utils/streak";
import { getDictionaryServer } from "@/utils/i18n/server";
import {
  getPrimaryWallets,
  getWalletBalances,
  getMultiSakuEnabledServer,
  getSelectedSakuServer,
} from "@/utils/wallets/server";

export default async function DashboardPage(props: {
  searchParams?: Promise<{
    period?: string;
    merged?: string;
    auth?: "login" | "signup";
    error?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const searchParams = await props.searchParams;
  const initialMergedCount = searchParams?.merged ? parseInt(searchParams.merged, 10) : 0;
  const initialAuthMode = searchParams?.auth;
  const initialAuthError = searchParams?.error;
  const cookieCadence = cookieStore.get("dashboard_cadence")?.value;
  const initialCadence: "week" | "month" =
    searchParams?.period === "month" || (!searchParams?.period && cookieCadence === "month")
      ? "month"
      : "week";

  const supabase = await createClient(cookieStore);
  const { locale } = await getDictionaryServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/guest");
  }

  const isGuest = Boolean(user.is_anonymous);

  const multiSakuEnabled = isGuest
    ? false
    : await getMultiSakuEnabledServer(cookieStore, supabase, user.id);
  const selectedSakuId = isGuest ? "all" : await getSelectedSakuServer(cookieStore);
  const wallets = isGuest ? [] : await getWalletBalances(supabase, user.id);
  const selectedWallet =
    !isGuest && selectedSakuId !== "all"
      ? wallets.find((w) => w.id === selectedSakuId) || null
      : null;

  const now = getNowInTimezone();

  // Weekly boundaries (Monday 00:00 to Sunday 23:59)
  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
  const endOfWeekDate = addDays(startOfWeekDate, 6);
  const startOfWeekStr = format(startOfWeekDate, "yyyy-MM-dd");
  const endOfWeekStr = format(endOfWeekDate, "yyyy-MM-dd");

  // Monthly boundaries (1st to end of month)
  const startOfMonthDate = startOfMonth(now);
  const endOfMonthDate = endOfMonth(now);
  const startOfMonthStr = format(startOfMonthDate, "yyyy-MM-dd");
  const endOfMonthStr = format(endOfMonthDate, "yyyy-MM-dd");
  const currentDay = getDate(now);
  const totalDaysInMonth = getDaysInMonth(now);

  // Unified fetch window covering BOTH week and month in a single query
  const rangeStartStr = startOfWeekStr < startOfMonthStr ? startOfWeekStr : startOfMonthStr;
  const rangeEndStr = endOfWeekStr > endOfMonthStr ? endOfWeekStr : endOfMonthStr;

  // Prior Month MTD boundaries (for MoM comparison)
  const lastMonthDate = subMonths(now, 1);
  const startOfLastMonth = startOfMonth(lastMonthDate);
  const daysInLastMonth = getDaysInMonth(lastMonthDate);
  const priorMtdEndDay = Math.min(currentDay, daysInLastMonth);
  const priorMtdEndDate = setDate(startOfLastMonth, priorMtdEndDay);
  const startOfLastMonthStr = format(startOfLastMonth, "yyyy-MM-dd");
  const priorMtdEndStr = format(priorMtdEndDate, "yyyy-MM-dd");

  let expensesQuery = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("spent_at", rangeStartStr)
    .lte("spent_at", rangeEndStr);

  let priorMtdQuery = supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .gte("spent_at", startOfLastMonthStr)
    .lte("spent_at", priorMtdEndStr);

  if (multiSakuEnabled && selectedWallet) {
    expensesQuery = expensesQuery.eq("wallet_id", selectedWallet.id);
    priorMtdQuery = priorMtdQuery.eq("wallet_id", selectedWallet.id);
  }

  const [
    { data: unifiedExpenses },
    { data: allUserExpenseDates },
    { data: priorMtdExpenses },
    { data: upcomingSubscriptions },
  ] = await Promise.all([
    expensesQuery.order("spent_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("spent_at")
      .eq("user_id", user.id)
      .order("spent_at", { ascending: false }),
    priorMtdQuery,
    !isGuest
      ? supabase
          .from("subscriptions")
          .select("id, name, price, billing_cycle, next_renewal_date, is_split, payment_platform")
          .eq("user_id", user.id)
          .eq("status", "active")
          .lte("next_renewal_date", format(addDays(now, 4), "yyyy-MM-dd"))
          .order("next_renewal_date", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const spentDates = (allUserExpenseDates || []).map((e) => e.spent_at);
  const streakData = calculateStreak(spentDates, now, locale);

  const priorMtdSpend = (priorMtdExpenses || []).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

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
      (sum, w) => sum + (w.weekly_budget !== null ? Number(w.weekly_budget) : 0),
      0
    );
    const totalMonthlyBudget = spendingWallets.reduce(
      (sum, w) =>
        sum +
        (w.monthly_budget !== null
          ? Number(w.monthly_budget)
          : w.weekly_budget !== null
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
    const { spendingWallet } = await getPrimaryWallets(
      supabase,
      user.id,
      user.user_metadata
    );

    weeklyBudget =
      spendingWallet?.weekly_budget !== null && spendingWallet?.weekly_budget !== undefined
        ? Number(spendingWallet.weekly_budget)
        : Number(user.user_metadata?.weekly_budget || 500000);

    monthlyBudget =
      spendingWallet?.monthly_budget !== null && spendingWallet?.monthly_budget !== undefined
        ? Number(spendingWallet.monthly_budget)
        : Number(
            user.user_metadata?.monthly_budget || Math.round((weeklyBudget / 7) * totalDaysInMonth)
          );
  }

  return (
    <DashboardClient
      initialCadence={initialCadence}
      allExpenses={unifiedExpenses || []}
      priorMtdSpend={priorMtdSpend}
      weeklyBudget={weeklyBudget}
      monthlyBudget={monthlyBudget}
      streakData={streakData}
      nowIso={format(now, "yyyy-MM-dd'T'HH:mm:ss")}
      isGuest={isGuest}
      initialMergedCount={initialMergedCount}
      initialAuthMode={initialAuthMode}
      initialAuthError={initialAuthError}
      upcomingSubscriptions={upcomingSubscriptions || []}
      wallets={wallets}
      selectedSakuId={selectedSakuId}
      multiSakuEnabled={multiSakuEnabled}
    />
  );
}