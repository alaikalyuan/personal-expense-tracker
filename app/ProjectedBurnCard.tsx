"use client";

import { TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2, Flame } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

interface ProjectedBurnCardProps {
  monthTotal: number;
  regularTotal: number;
  exemptTotal: number;
  /** null when no monthly budget is set: the card then shows the projection only. */
  monthlyBudget: number | null;
  /** The dashboard's daily allowance for today, so the month view shows one daily figure. */
  dailyAllowance: number;
  elapsedDays: number;
  totalDays: number;
  priorMtdSpend: number;
}

export default function ProjectedBurnCard({
  monthTotal,
  regularTotal,
  exemptTotal,
  monthlyBudget,
  dailyAllowance,
  elapsedDays,
  totalDays,
  priorMtdSpend,
}: ProjectedBurnCardProps) {
  const { t, formatCurrency, locale } = useTranslation();

  const safeElapsedDays = Math.max(elapsedDays, 1);
  const hasBudget = monthlyBudget !== null && monthlyBudget > 0;
  const budget = hasBudget ? monthlyBudget : 0;

  // Velocity: regular spend per day (excludes one-offs from daily multiplication)
  const dailyVelocity = regularTotal / safeElapsedDays;
  const projectedRegular = Math.round(dailyVelocity * totalDays);
  const projectedTotal = projectedRegular + exemptTotal;

  // Month progress vs Budget consumed
  const monthElapsedPercent = Math.min(Math.round((elapsedDays / totalDays) * 100), 100);
  const budgetConsumedPercent = hasBudget ? Math.min(Math.round((regularTotal / budget) * 100), 100) : 0;

  // Pace status determination
  const isOverBudgetAlready = hasBudget && regularTotal > budget;
  const isProjectedOver = hasBudget && projectedTotal > budget;
  const projectedDiff = Math.abs(projectedTotal - budget);

  const paceStatus = isOverBudgetAlready || isProjectedOver
    ? "danger"
    : budgetConsumedPercent > monthElapsedPercent + 10
    ? "warning"
    : "safe";

  // MoM Delta calculation
  const momDiff = monthTotal - priorMtdSpend;
  const momPercent =
    priorMtdSpend > 0 ? Math.round((Math.abs(momDiff) / priorMtdSpend) * 100) : null;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-linear-to-b dark:from-zinc-900 dark:to-zinc-950 dark:shadow-sm flex flex-col gap-4">
      {/* Header: Title and Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${
            paceStatus === "safe"
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              : paceStatus === "warning"
              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
          }`}>
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
              {t.burnRate.cardTitle}
            </h3>
            <p className="text-xs text-zinc-500">
              {elapsedDays} / {totalDays} {t.dashboard.dayOfMonth}
            </p>
          </div>
        </div>

        {hasBudget && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            paceStatus === "safe"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
              : paceStatus === "warning"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
          }`}
        >
          {paceStatus === "safe" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {paceStatus === "safe"
            ? t.burnRate.paceSafe
            : paceStatus === "warning"
            ? t.burnRate.paceTight
            : t.burnRate.paceExceeded}
        </span>
        )}
      </div>

      {/* Main Projected Amount Banner */}
      <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/60 dark:bg-zinc-900/80 dark:border-zinc-800/70">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t.burnRate.projectedEndMonth}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(projectedTotal)}
          </span>
          {hasBudget && (
            <span className={`text-xs font-semibold ${
              isProjectedOver
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {(isProjectedOver ? t.burnRate.overBudgetBadge : t.burnRate.underBudgetBadge).replace(
                "{amount}",
                formatCurrency(projectedDiff)
              )}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {!hasBudget
            ? t.burnRate.noBudgetNote
            : isProjectedOver
            ? `${t.burnRate.projectedExceedNote} ${formatCurrency(projectedDiff)}.`
            : `${t.burnRate.projectedSafeNote} ${formatCurrency(projectedDiff)}.`}
        </p>
      </div>

      {/* Velocity vs the dashboard's daily allowance */}
      <div className={`grid gap-3 pt-1 ${hasBudget ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs font-medium text-zinc-500">
            {t.burnRate.dailyVelocity}
          </p>
          <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {formatCurrency(Math.round(dailyVelocity))}/{locale === "id" ? "hari" : "day"}
          </p>
        </div>

        {hasBudget && (
          <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs font-medium text-zinc-500">
              {t.burnRate.targetDailyPace}
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(Math.max(dailyAllowance, 0))}/{locale === "id" ? "hari" : "day"}
            </p>
          </div>
        )}
      </div>

      {/* MoM Pacing Comparison Badge */}
      {priorMtdSpend > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70 text-xs">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.burnRate.momVsSameTime}
          </span>
          <div className="flex items-center gap-1 font-semibold text-xs">
            {momDiff > 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="text-rose-600 dark:text-rose-400">
                  {t.burnRate.momHigherBadge
                    .replace("{percent}", String(momPercent))
                    .replace("{amount}", formatCurrency(momDiff))}
                </span>
              </>
            ) : momDiff < 0 ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t.burnRate.momLowerBadge
                    .replace("{percent}", String(momPercent))
                    .replace("{amount}", formatCurrency(Math.abs(momDiff)))}
                </span>
              </>
            ) : (
              <>
                <Minus className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t.burnRate.momEven}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
