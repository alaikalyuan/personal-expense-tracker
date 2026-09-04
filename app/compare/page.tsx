import { createClient } from "@/utils/supabase/server";
import UserMenu from "@/app/UserMenu";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addDays,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { getNowInTimezone } from "@/utils/date";
import {
  getDictionaryServer,
  formatDateServer,
  getCategoryLabelServer,
} from "@/utils/i18n/server";

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-green-500",
  Transportation: "bg-blue-500",
  Utilities: "bg-yellow-500",
  Academics: "bg-purple-500",
  Entertainment: "bg-pink-500",
  Others: "bg-zinc-500",
};

export default async function ComparePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { t, locale } = await getDictionaryServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = getNowInTimezone();

  // 1. Current Week (Monday - Sunday)
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd");
  const thisWeekEndStr = format(thisWeekEnd, "yyyy-MM-dd");

  // 2. Last Week (Monday - Sunday)
  const lastWeekDate = subWeeks(now, 1);
  const lastWeekStart = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
  const lastWeekStartStr = format(lastWeekStart, "yyyy-MM-dd");
  const lastWeekEndStr = format(lastWeekEnd, "yyyy-MM-dd");

  // Query this week and last week expenses concurrently
  const [{ data: thisWeekExpenses }, { data: lastWeekExpenses }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("spent_at", thisWeekStartStr)
        .lte("spent_at", thisWeekEndStr)
        .order("spent_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("spent_at", lastWeekStartStr)
        .lte("spent_at", lastWeekEndStr)
        .order("spent_at", { ascending: false }),
    ]);

  // Total calculations
  const thisTotal = (thisWeekExpenses || []).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );
  const lastTotal = (lastWeekExpenses || []).reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

  const diffAmount = thisTotal - lastTotal;
  const percentDiff =
    lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
  const isSaving = diffAmount < 0;
  const isNeutral = diffAmount === 0;

  // Daily burn rate pacing
  const todayDayIndex = (now.getDay() + 6) % 7 + 1; // Mon=1 ... Sun=7
  const thisDailyAvg = thisTotal / todayDayIndex;
  const lastDailyAvg = lastTotal / 7;

  // 3. Category Delta Comparison
  const allCategories = Array.from(
    new Set([
      ...(thisWeekExpenses || []).map((e) => e.category),
      ...(lastWeekExpenses || []).map((e) => e.category),
    ])
  ).filter(Boolean);

  const categoryComparison = allCategories
    .map((cat) => {
      const thisAmt = (thisWeekExpenses || []).reduce(
        (acc, curr) => (curr.category === cat ? acc + Number(curr.amount) : acc),
        0
      );
      const lastAmt = (lastWeekExpenses || []).reduce(
        (acc, curr) => (curr.category === cat ? acc + Number(curr.amount) : acc),
        0
      );
      const diff = thisAmt - lastAmt;
      const pct = lastAmt > 0 ? Math.round(((thisAmt - lastAmt) / lastAmt) * 100) : null;

      return {
        category: cat,
        thisAmt,
        lastAmt,
        diff,
        pct,
      };
    })
    .sort((a, b) => Math.max(b.thisAmt, b.lastAmt) - Math.max(a.thisAmt, a.lastAmt));

  // 4. Day-by-Day comparison (Mon - Sun)
  const dayComparison = Array.from({ length: 7 }, (_, i) => {
    const thisDayDate = addDays(thisWeekStart, i);
    const lastDayDate = addDays(lastWeekStart, i);

    const thisDateStr = format(thisDayDate, "yyyy-MM-dd");
    const lastDateStr = format(lastDayDate, "yyyy-MM-dd");

    const thisDayAmt = (thisWeekExpenses || []).reduce(
      (acc, curr) =>
        curr.spent_at && curr.spent_at.startsWith(thisDateStr)
          ? acc + Number(curr.amount)
          : acc,
      0
    );

    const lastDayAmt = (lastWeekExpenses || []).reduce(
      (acc, curr) =>
        curr.spent_at && curr.spent_at.startsWith(lastDateStr)
          ? acc + Number(curr.amount)
          : acc,
      0
    );

    return {
      dayName: formatDateServer(thisDayDate, "EEE", locale),
      thisAmt: thisDayAmt,
      lastAmt: lastDayAmt,
      isToday: isSameDay(thisDayDate, now),
      isFuture: isAfter(thisDayDate, now),
    };
  });

  const maxDayAmount = Math.max(
    ...dayComparison.map((d) => Math.max(d.thisAmt, d.lastAmt)),
    1
  );

  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="font-bold tracking-tight text-lg">{t.compare.title}</h1>
          <p className="text-[11px] text-zinc-400">
            {formatDateServer(thisWeekStart, "MMM d", locale)} – {formatDateServer(thisWeekEnd, "MMM d", locale)} {t.common.vs}{" "}
            {formatDateServer(lastWeekStart, "MMM d", locale)} – {formatDateServer(lastWeekEnd, "MMM d", locale)}
          </p>
        </div>
        <UserMenu />
      </div>

      {/* Week-over-Week Spend Hero Card */}
      <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 shadow-sm">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          {t.compare.wowCardTitle}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">{t.compare.thisWeek}</p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">
              Rp {thisTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {locale === "id" ? `Hari ke-${todayDayIndex} dari 7` : `Day ${todayDayIndex} of 7`}
            </p>
          </div>

          <div className="border-l border-zinc-800/80 pl-4">
            <p className="text-[11px] text-zinc-400 font-medium">{t.compare.lastWeek}</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-300">
              Rp {lastTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{t.compare.fullSevenDays}</p>
          </div>
        </div>

        {/* Delta Outcome Badge */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
          <div className="flex items-center gap-2">
            {isNeutral ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                <Minus className="w-3.5 h-3.5" />
                {t.compare.evenWithLastWeek}
              </span>
            ) : isSaving ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <TrendingDown className="w-3.5 h-3.5" />
                {Math.abs(percentDiff)}% {t.compare.lessThanLastWeek}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {percentDiff}% {t.compare.moreThanLastWeek}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            {diffAmount < 0 ? "-" : diffAmount > 0 ? "+" : ""}Rp{" "}
            {Math.abs(diffAmount).toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Burn Rate Pacing Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
          {t.compare.burnRateTitle}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3">
            <p className="text-[10px] text-zinc-400">{t.compare.currentDailyAvg}</p>
            <p className="mt-1 text-sm font-bold text-zinc-100">
              Rp {Math.round(thisDailyAvg).toLocaleString("id-ID")}
            </p>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              {t.compare.basedOnElapsedDays.replace("{days}", String(todayDayIndex))}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3">
            <p className="text-[10px] text-zinc-400">{t.compare.lastWeekDailyAvg}</p>
            <p className="mt-1 text-sm font-bold text-zinc-300">
              Rp {Math.round(lastDailyAvg).toLocaleString("id-ID")}
            </p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{t.compare.acrossAllDays}</p>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 text-center mt-3">
          {thisDailyAvg <= lastDailyAvg ? (
            <span className="text-emerald-400 font-medium">
              {t.compare.pacingSaving.replace(
                "{amount}",
                Math.round(lastDailyAvg - thisDailyAvg).toLocaleString("id-ID")
              )}
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              {t.compare.pacingOver.replace(
                "{amount}",
                Math.round(thisDailyAvg - lastDailyAvg).toLocaleString("id-ID")
              )}
            </span>
          )}
        </p>
      </div>

      {/* Day-by-Day Side-by-Side Sparkline */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {t.compare.trendTitle}
          </h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-xs bg-emerald-500"></span> {t.compare.thisWeek}
            </span>
            <span className="flex items-center gap-1 text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-xs bg-zinc-700"></span> {t.compare.lastWeek}
            </span>
          </div>
        </div>

        <div className="pt-3">
          <div className="flex items-end justify-between gap-2 h-28 px-1">
            {dayComparison.map((day) => {
              const thisHeight =
                maxDayAmount > 0
                  ? Math.max(Math.round((day.thisAmt / maxDayAmount) * 100), 4)
                  : 4;
              const lastHeight =
                maxDayAmount > 0
                  ? Math.max(Math.round((day.lastAmt / maxDayAmount) * 100), 4)
                  : 4;

              return (
                <div
                  key={day.dayName}
                  className={`flex-1 flex flex-col items-center gap-1 h-full justify-end ${
                    day.isFuture ? "opacity-35" : "opacity-100"
                  }`}
                >
                  {/* Paired vertical bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-20">
                    {/* Last Week Bar (Zinc) */}
                    <div
                      style={{ height: `${day.lastAmt > 0 ? lastHeight : 4}%` }}
                      className="w-1/2 rounded-t-xs bg-zinc-700 transition-all"
                      title={`${t.compare.lastWeek} ${day.dayName}: Rp ${day.lastAmt.toLocaleString("id-ID")}`}
                    />
                    {/* This Week Bar (Emerald) */}
                    <div
                      style={{ height: `${day.thisAmt > 0 ? thisHeight : 4}%` }}
                      className={`w-1/2 rounded-t-xs transition-all ${
                        day.isToday ? "bg-emerald-400" : "bg-emerald-500/80"
                      }`}
                      title={`${t.compare.thisWeek} ${day.dayName}: Rp ${day.thisAmt.toLocaleString("id-ID")}`}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className={`text-[10px] ${
                      day.isToday
                        ? "font-bold text-emerald-400"
                        : "text-zinc-500 font-medium"
                    }`}
                  >
                    {day.isToday ? t.common.today : day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Delta Comparison */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
          {t.compare.categoryChangesTitle}
        </h3>

        {categoryComparison.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-500">
            {t.compare.noExpensesBothWeeks}
          </p>
        ) : (
          <div className="space-y-3">
            {categoryComparison.map((cat) => {
              const hasIncreased = cat.diff > 0;
              const hasDecreased = cat.diff < 0;

              return (
                <div
                  key={cat.category}
                  className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        categoryColors[cat.category] || "bg-zinc-500"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        {getCategoryLabelServer(cat.category, locale)}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Rp {cat.thisAmt.toLocaleString("id-ID")}{" "}
                        <span className="text-zinc-600">{t.common.vs}</span> Rp{" "}
                        {cat.lastAmt.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {hasDecreased ? (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-400 gap-0.5">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Rp {Math.abs(cat.diff).toLocaleString("id-ID")}
                      </span>
                    ) : hasIncreased ? (
                      <span className="inline-flex items-center text-xs font-semibold text-rose-400 gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Rp {Math.abs(cat.diff).toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-zinc-500">
                        {t.compare.noChange}
                      </span>
                    )}
                    {cat.pct !== null && (
                      <p
                        className={`text-[9px] ${
                          hasDecreased
                            ? "text-emerald-500"
                            : hasIncreased
                            ? "text-rose-500"
                            : "text-zinc-500"
                        }`}
                      >
                        {cat.diff > 0 ? "+" : ""}
                        {cat.pct}%
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}

