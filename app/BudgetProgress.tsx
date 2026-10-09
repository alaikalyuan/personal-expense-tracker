"use client";

import { useState } from "react";
import { Pencil, X, Sparkles, CheckCircle2, Tag } from "lucide-react";
import { setWeeklyBudget, setMonthlyBudget, toggleExpenseExemption } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";

export interface DueSubscriptionItem {
  id: string;
  name: string;
  userShare: number;
  price: number;
  next_renewal_date: string;
  billing_cycle: string;
  is_split: boolean;
  payment_platform: string;
}

interface BudgetProgressProps {
  period?: "week" | "month";
  weeklyTotal: number;
  weeklyBudget: number;
  daysRemaining: number;
  regularTotal?: number;
  exemptTotal?: number;
  exemptCount?: number;
  unexemptAnomaly?: { id: string; name: string; amount: number } | null;
  projectedSubscriptionsTotal?: number;
  dueSubscriptions?: DueSubscriptionItem[];
  onPaySubscription?: (id: string, name: string) => Promise<void>;
}

export default function BudgetProgress({
  period = "week",
  weeklyTotal,
  weeklyBudget,
  daysRemaining,
  regularTotal,
  exemptTotal,
  exemptCount,
  unexemptAnomaly,
  projectedSubscriptionsTotal,
  dueSubscriptions,
  onPaySubscription,
}: BudgetProgressProps) {
  const { t, locale, formatCurrency, currency, currencySymbol } = useTranslation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(weeklyBudget));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExempting, setIsExempting] = useState(false);
  const [payingSubId, setPayingSubId] = useState<string | null>(null);
  const [isDueSubsOpen, setIsDueSubsOpen] = useState(true);

  const presetBudgets = currency === "IDR"
    ? (period === "month"
        ? [
            { label: t.budget.preset1m5, value: 1500000 },
            { label: t.budget.preset2m5, value: 2500000 },
            { label: t.budget.preset5m, value: 5000000 },
            { label: t.budget.preset10m, value: 10000000 },
          ]
        : [
            { label: t.budget.preset250k, value: 250000 },
            { label: t.budget.preset500k, value: 500000 },
            { label: t.budget.preset1m, value: 1000000 },
            { label: t.budget.preset2m, value: 2000000 },
          ])
    : (currency === "MYR"
        ? (period === "month"
            ? [
                { label: "1.5k", value: 1500 },
                { label: "2.5k", value: 2500 },
                { label: "4k", value: 4000 },
                { label: "6k", value: 6000 },
              ]
            : [
                { label: "300", value: 300 },
                { label: "500", value: 500 },
                { label: "1k", value: 1000 },
                { label: "1.5k", value: 1500 },
              ])
        : (period === "month"
            ? [
                { label: "500", value: 500 },
                { label: "1k", value: 1000 },
                { label: "1.5k", value: 1500 },
                { label: "2.5k", value: 2500 },
              ]
            : [
                { label: "100", value: 100 },
                { label: "200", value: 200 },
                { label: "300", value: 300 },
                { label: "500", value: 500 },
              ]));

  // Base calculation on regular operational spend if one-offs exist
  const activeSpend = regularTotal !== undefined ? regularTotal : weeklyTotal;
  const rawPercent = weeklyBudget > 0 ? Math.round((activeSpend / weeklyBudget) * 100) : 0;
  const barWidth = Math.min(rawPercent, 100);
  const remaining = weeklyBudget - activeSpend;
  const isOver = remaining < 0;
  const dailyAllowance = Math.max(Math.round(remaining / Math.max(daysRemaining, 1)), 0);

  // Projected subscriptions metrics
  const projectedSubSpend = Math.max(0, projectedSubscriptionsTotal || 0);
  const totalWithProjected = activeSpend + projectedSubSpend;
  const projectedPercent = weeklyBudget > 0 ? Math.round((projectedSubSpend / weeklyBudget) * 100) : 0;

  // Calculate width of projected segment on progress bar (up to 100% total track)
  const projectedBarWidth =
    weeklyBudget > 0
      ? Math.min(Math.round((projectedSubSpend / weeklyBudget) * 100), Math.max(0, 100 - barWidth))
      : 0;

  const projectedRemaining = weeklyBudget - totalWithProjected;
  const willBeOverWithSubs = !isOver && projectedRemaining < 0;

  // Health status with calm, non-punitive tone
  const isWarning = !isOver && rawPercent >= 75;

  const barColor = isOver
    ? "bg-amber-500 shadow-md shadow-amber-500/25 dark:bg-amber-500"
    : isWarning
    ? "bg-amber-500 shadow-md shadow-amber-500/20"
    : "bg-emerald-500 shadow-md shadow-emerald-500/20";

  const textColor = isOver
    ? "text-amber-500 dark:text-amber-400"
    : isWarning
    ? "text-amber-400"
    : "text-emerald-400";

  const handleFormSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      if (period === "month") {
        await setMonthlyBudget(formData);
      } else {
        await setWeeklyBudget(formData);
      }
      setIsEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      {/* Progress Track & Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium flex-wrap">
          {isOver ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          )}
          <span>
            {rawPercent}% {t.budget.percentUsedOf}{" "}
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
              {formatCurrency(weeklyBudget)}
            </span>
          </span>
          {projectedSubSpend > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
              +{formatCurrency(projectedSubSpend)} ({projectedPercent}%)
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => {
            setBudgetInput(String(weeklyBudget));
            setIsEditOpen(true);
          }}
          aria-label={t.budget.editLimit}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 py-0.5 px-1.5 rounded-md hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
          <span>{t.budget.editLimit}</span>
        </button>
      </div>

      {/* Visual Progress Bar (Multi-segment with projected subscriptions in distinct indigo) */}
      <div
        className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 flex"
        role="progressbar"
        aria-valuenow={rawPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
        {projectedBarWidth > 0 && (
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-700 ease-out border-l border-white/20 dark:border-black/30"
            style={{ width: `${projectedBarWidth}%` }}
            title={`${t.budget.projectedSubsLegend}: ${formatCurrency(projectedSubSpend)}`}
          />
        )}
      </div>

      {/* Remaining Allowance / Reframed Pace Line */}
      <div className="flex items-center justify-between text-[11px] gap-2">
        {isOver ? (
          <>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              +{formatCurrency(Math.abs(remaining))} {t.budget.aboveTargetBy}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              {t.budget.honestTrackingBadge}
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-zinc-500 dark:text-zinc-400">
                <span className={`font-semibold ${textColor}`}>
                  {formatCurrency(remaining)}
                </span>{" "}
                {t.budget.left}
              </span>
              {projectedSubSpend > 0 && (
                <span className="text-[10px]">
                  {willBeOverWithSubs ? (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      ({t.budget.projectedOverWarning.replace("{amount}", formatCurrency(Math.abs(projectedRemaining)))})
                    </span>
                  ) : (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      ({t.budget.projectedRemaining.replace("{amount}", formatCurrency(projectedRemaining))})
                    </span>
                  )}
                </span>
              )}
            </div>

            <span className="text-zinc-500 shrink-0">
              ~{formatCurrency(dailyAllowance)}/{locale === "id" ? "hari" : "day"} ({locale === "id" ? `sisa ${daysRemaining} hari` : `${daysRemaining}d left`})
            </span>
          </>
        )}
      </div>

      {/* Projected Due Subscriptions List & 1-Tap Pay Action */}
      {projectedSubSpend > 0 && dueSubscriptions && dueSubscriptions.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-2.5 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsDueSubsOpen(!isDueSubsOpen)}
              className="flex items-center gap-1.5 text-left min-w-0 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 ring-2 ring-indigo-300 dark:ring-indigo-700" />
              <span className="font-semibold text-[11px] text-indigo-900 dark:text-indigo-200 truncate">
                {period === "month" ? t.budget.dueThisMonthTitle : t.budget.dueThisWeekTitle} ({dueSubscriptions.length})
              </span>
            </button>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
              +{formatCurrency(projectedSubSpend)}
            </span>
          </div>

          {isDueSubsOpen && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-indigo-100 dark:border-indigo-900/30">
              {dueSubscriptions.map((sub) => {
                const isPayingThis = payingSubId === sub.id;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/80 dark:bg-zinc-900/70 p-2 border border-indigo-100 dark:border-indigo-900/30 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub.name}
                        </span>
                        {sub.is_split && (
                          <span className="rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1 py-0.2 text-[9px] font-semibold">
                            Patungan
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span>{sub.next_renewal_date}</span>
                        <span>•</span>
                        <span>{sub.payment_platform}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                        {formatCurrency(sub.userShare)}
                      </span>
                      {onPaySubscription && (
                        <button
                          type="button"
                          disabled={isPayingThis}
                          onClick={async () => {
                            try {
                              setPayingSubId(sub.id);
                              await onPaySubscription(sub.id, sub.name);
                            } finally {
                              setPayingSubId(null);
                            }
                          }}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-2.5 py-1 text-[10px] font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-2xs flex items-center justify-center min-h-[28px]"
                          title={t.budget.markAsPaidAction}
                        >
                          {isPayingThis ? t.budget.payingAction : t.budget.markAsPaidAction}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exemption summary pill if one-offs exist */}
      {exemptTotal && exemptTotal > 0 ? (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
          <Tag className="w-3 h-3 text-amber-500 shrink-0" />
          <span>
            {t.budget.exemptSummary
              .replace("{amount}", formatCurrency(exemptTotal))
              .replace("{count}", String(exemptCount || 1))}
          </span>
        </div>
      ) : null}

      {/* 1-Tap Retroactive Anomaly Suggestion Chip when overbudget */}
      {unexemptAnomaly && isOver && (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-amber-50/90 p-2.5 text-xs text-amber-950 border border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/80 animate-fade-in">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug font-medium break-words">
              {t.budget.exemptSuggestTitle
                .replace("{name}", unexemptAnomaly.name)
                .replace("{amount}", formatCurrency(unexemptAnomaly.amount))}
            </p>
          </div>
          <button
            type="button"
            disabled={isExempting}
            onClick={async () => {
              try {
                setIsExempting(true);
                await toggleExpenseExemption(unexemptAnomaly.id, true);
              } finally {
                setIsExempting(false);
              }
            }}
            className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExempting ? "..." : t.budget.exemptSuggestAction}
          </button>
        </div>
      )}

      {/* Empathetic Encouragement Banner when Over Budget */}
      {isOver && (
        <div className="mt-1 flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-2.5 text-[11px] text-amber-900 border border-amber-200/70 dark:bg-amber-950/25 dark:text-amber-200 dark:border-amber-800/50 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-normal">
            {t.budget.overBudgetEncouragement}
          </p>
        </div>
      )}

      {/* Edit Budget Modal */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsEditOpen(false);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {period === "month" ? t.budget.monthlyModalTitle : t.budget.modalTitle}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {period === "month" ? t.budget.monthlyModalSubtitle : t.budget.modalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={handleFormSubmit} className="flex flex-col gap-3 pt-3">
              {/* Preset buttons */}
              <div>
                <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {t.budget.quickPresets}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {presetBudgets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBudgetInput(String(preset.value))}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        budgetInput === String(preset.value)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-500 mt-1">
                <span className="mr-2 text-sm font-semibold text-zinc-400">
                  {currencySymbol}
                </span>
                <input
                  name="budget"
                  type="number"
                  inputMode={currency === "IDR" ? "numeric" : "decimal"}
                  step={currency === "IDR" ? "1000" : "1"}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder={currency === "IDR" ? "e.g. 500000" : "e.g. 100"}
                  required
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-400 text-zinc-900 dark:placeholder:text-zinc-500 dark:text-zinc-100"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-4 py-2 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.common.saving : t.budget.saveBudget}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

