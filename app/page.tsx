import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
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
import GuestLanding from "./GuestLanding";
import { getNowInTimezone, getTodayString } from "@/utils/date";
import { calculateStreak } from "@/utils/streak";
import {
  STREAK_WINDOW_ROW_LIMIT,
  streakNeedsFullHistory,
  streakWindowStart,
} from "@/utils/streakWindow";
import { getDictionaryServer } from "@/utils/i18n/server";
import {
  pickPrimaryWallets,
  getWalletBalances,
  getMultiSakuEnabledServer,
  getSelectedSakuServer,
} from "@/utils/wallets/server";
import { processSubscriptionRenewals } from "@/app/subscriptions/actions";
import type { PendingEmailTransaction } from "@/app/email-sync/actions";
import { resolveBudgets } from "@/utils/budget";

export default async function DashboardPage(props: {
  searchParams?: Promise<{
    period?: string;
    merged?: string;
    auth?: "login" | "signup";
    error?: string;
    next?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const searchParams = await props.searchParams;
  const hasAuthCookie = cookieStore.getAll().some((cookie) => cookie.name.includes("-auth-token"));
  const initialMergedCount = searchParams?.merged ? parseInt(searchParams.merged, 10) : 0;
  const initialAuthMode = searchParams?.auth;
  const initialAuthError = searchParams?.error;
  const cookieCadence = cookieStore.get("dashboard_cadence")?.value;
  const initialCadence: "week" | "month" =
    searchParams?.period === "month" || (!searchParams?.period && cookieCadence === "month")
      ? "month"
      : "week";

  const supabase = await createClient(cookieStore);

  // The proxy has already called auth.getUser (and refreshed the session) for
  // a document request. Here the JWT is verified locally against the
  // project's asymmetric signing key, so there is no second auth round trip.
  // No auth cookie means no session: skip Supabase entirely.
  const claims = hasAuthCookie ? (await supabase.auth.getClaims()).data?.claims ?? null : null;
  const user = claims
    ? {
        id: claims.sub,
        is_anonymous: Boolean(claims.is_anonymous),
        user_metadata: claims.user_metadata ?? null,
      }
    : null;

  if (!user) {
    return (
      <GuestLanding
        next={searchParams?.next}
        initialAuthMode={initialAuthMode}
        initialAuthError={initialAuthError}
      />
    );
  }

  const isGuest = Boolean(user.is_anonymous);

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

  const selectedSakuId = isGuest ? "all" : await getSelectedSakuServer(cookieStore);
  const streakStartStr = streakWindowStart(now);

  // Every read the dashboard needs. Queries that don't depend on the wallet
  // list start at once; the expense reads wait only for the wallet filter.
  const loadDashboardData = async () => {
    const streakWindowPromise = supabase
      .from("expenses")
      .select("spent_at")
      .eq("user_id", user.id)
      .gte("spent_at", streakStartStr)
      .order("spent_at", { ascending: false })
      .limit(STREAK_WINDOW_ROW_LIMIT);

    const subscriptionsPromise = !isGuest
      ? supabase
          .from("subscriptions")
          .select("id, name, price, billing_cycle, next_renewal_date, last_processed_date, is_split, payment_platform, category, pay_from_wallet_id, split_config")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("next_renewal_date", { ascending: true })
      : Promise.resolve({ data: [] });

    const pendingEmailPromise = !isGuest
      ? supabase
          .from("email_transactions")
          .select(`
            id,
            source,
            sender,
            subject,
            merchant_name,
            amount,
            currency,
            transaction_date,
            transaction_time,
            reference_id,
            suggested_category,
            target_wallet_id,
            status,
            created_at
          `)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] });

    // wallet_balances is read once; the fallback wallet is picked from it below.
    const [multiSakuEnabled, balances] = await Promise.all([
      isGuest ? false : getMultiSakuEnabledServer(cookieStore, supabase, user.id),
      getWalletBalances(supabase, user.id),
    ]);
    const wallets = isGuest ? [] : balances;
    const selectedWallet =
      !isGuest && selectedSakuId !== "all"
        ? wallets.find((w) => w.id === selectedSakuId) || null
        : null;

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
      { data: streakWindowDates },
      { data: priorMtdExpenses },
      { data: upcomingSubscriptions },
      { data: pendingEmailTransactions },
    ] = await Promise.all([
      expensesQuery.order("spent_at", { ascending: false }),
      streakWindowPromise,
      priorMtdQuery,
      subscriptionsPromise,
      pendingEmailPromise,
    ]);

    return {
      multiSakuEnabled,
      balances,
      wallets,
      unifiedExpenses,
      streakWindowDates,
      priorMtdExpenses,
      upcomingSubscriptions: upcomingSubscriptions || [],
      pendingEmailTransactions: (pendingEmailTransactions || []) as PendingEmailTransaction[],
    };
  };

  const [{ locale }, firstLoad] = await Promise.all([
    getDictionaryServer(),
    loadDashboardData(),
  ]);
  let data = firstLoad;

  // Subscription renewals log expenses and advance renewal dates, so they
  // must land before the numbers are shown. The subscription list read above
  // says whether any renewal is due; only then is the renewal run and the
  // data read again. Most loads have nothing due and make no extra request.
  if (!isGuest) {
    const todayStr = getTodayString();
    const hasDueRenewal = data.upcomingSubscriptions.some(
      (sub: { next_renewal_date: string; last_processed_date: string | null }) =>
        sub.next_renewal_date <= todayStr &&
        sub.last_processed_date !== sub.next_renewal_date
    );
    if (hasDueRenewal) {
      try {
        const { processedCount } = await processSubscriptionRenewals(user.id);
        if (processedCount > 0) {
          data = await loadDashboardData();
        }
      } catch (e) {
        console.warn("Proactive subscription renewal sync failed:", e);
      }
    }
  }

  const {
    multiSakuEnabled,
    balances,
    wallets,
    unifiedExpenses,
    priorMtdExpenses,
    upcomingSubscriptions,
    pendingEmailTransactions,
  } = data;

  let spentDates: string[] = (data.streakWindowDates || []).map((e) => e.spent_at);
  let streakData = calculateStreak(spentDates, now, locale);
  if (streakNeedsFullHistory(spentDates, streakStartStr, streakData.currentStreak, now)) {
    // Rare: the streak may reach past the window, so read the full history as before.
    const { data: allUserExpenseDates } = await supabase
      .from("expenses")
      .select("spent_at")
      .eq("user_id", user.id)
      .order("spent_at", { ascending: false });
    spentDates = (allUserExpenseDates || []).map((e) => e.spent_at);
    streakData = calculateStreak(spentDates, now, locale);
  }

  const priorMtdSpend = (priorMtdExpenses || []).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

  const fallbackWallet =
    !multiSakuEnabled || selectedSakuId === "all"
      ? pickPrimaryWallets(balances, user.id).spendingWallet
      : null;

  const { weeklyBudget, monthlyBudget } = resolveBudgets({
    user,
    wallets,
    fallbackWallet,
    multiSakuEnabled,
    selectedSakuId,
    totalDaysInMonth,
  });

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
      pendingEmailTransactions={pendingEmailTransactions}
    />
  );
}
