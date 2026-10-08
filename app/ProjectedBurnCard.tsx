"use client";

import { TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2, Flame } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

interface ProjectedBurnCardProps {
  monthTotal: number;
  regularTotal: number;
  exemptTotal: number;
  monthlyBudget: number;
  elapsedDays: number;
  totalDays: number;
  priorMtdSpend: number;
}

export default function ProjectedBurnCard({
  monthTotal,
  regularTotal,
  exemptTotal,
  monthlyBudget,
  elapsedDays,
  totalDays,
  priorMtdSpend,
}: ProjectedBurnCardProps) {
  const { t, formatCurrency, locale } = useTranslation();

  const safeElapsedDays = Math.max(elapsedDays, 1);
  const remainingDays = Math.max(totalDays - elapsedDays, 0);

  // Velocity: regular spend per day (excludes one-offs from daily multiplication)
  const dailyVelocity = regularTotal / safeElapsedDays;
  const projectedRegular = Math.round(dailyVelocity * totalDays);
  const projectedTotal = projectedRegular + exemptTotal;

  // Safe pace to stay within budget
  const budgetRemaining = Math.max(monthlyBudget - regularTotal, 0);
  const safeTargetDailyPace = remainingDays > 0 ? Math.round(budgetRemaining / remainingDays) : 0;

  // Month progress vs Budget consumed
  const monthElapsedPercent = Math.min(Math.round((elapsedDays / totalDays) * 100), 100);
  const budgetConsumedPercent =
    monthlyBudget > 0 ? Math.min(Math.round((regularTotal / monthlyBudget) * 100), 100) : 0;

  // Pace status determination
  const isOverBudgetAlready = monthlyBudget > 0 && regularTotal > monthlyBudget;
  const isProjectedOver = monthlyBudget > 0 && projectedTotal > monthlyBudget;
  const projectedDiff = Math.abs(projectedTotal - monthlyBudget);

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
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
              {t.burnRate.cardTitle}
            </h3>
            <p className="text-[10px] text-zinc-500">
              {elapsedDays} / {totalDays} {t.dashboard.dayOfMonth}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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
      </div>

      {/* Main Projected Amount Banner */}
      <div className="rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/60 dark:bg-zinc-900/80 dark:border-zinc-800/70">
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {t.burnRate.projectedEndMonth}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(projectedTotal)}
          </span>
          {monthlyBudget > 0 && (
            <span className={`text-xs font-semibold ${
              isProjectedOver
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}>
              {isProjectedOver
                ? `+${formatCurrency(projectedDiff)}`
                : `-${formatCurrency(projectedDiff)}`}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
          {isProjectedOver
            ? `${t.burnRate.projectedExceedNote} ${formatCurrency(projectedDiff)}.`
            : `${t.burnRate.projectedSafeNote} ${formatCurrency(projectedDiff)}.`}
        </p>
      </div>

      {/* Velocity vs Safe Pace micro-shelf */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {t.burnRate.dailyVelocity}
          </p>
          <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {formatCurrency(Math.round(dailyVelocity))}/{locale === "id" ? "hari" : "day"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {t.burnRate.targetDailyPace}
          </p>
          <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {formatCurrency(safeTargetDailyPace)}/{locale === "id" ? "hari" : "day"}
          </p>
        </div>
      </div>

      {/* MoM Pacing Comparison Badge */}
      {priorMtdSpend > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70 text-xs">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {t.burnRate.momVsSameTime}
          </span>
          <div className="flex items-center gap-1 font-semibold text-xs">
            {momDiff > 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="text-rose-600 dark:text-rose-400">
                  +{momPercent}% (+{formatCurrency(momDiff)})
                </span>
              </>
            ) : momDiff < 0 ? (
              <>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  -{momPercent}% (-{formatCurrency(Math.abs(momDiff))})
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
