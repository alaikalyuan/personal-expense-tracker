"use client";

import { useState } from "react";
import { Pencil, ChevronDown, Tag } from "lucide-react";
import { toggleExpenseExemption } from "@/app/actions";
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
  regularTotal?: number;
  exemptTotal?: number;
  exemptCount?: number;
  unexemptAnomaly?: { id: string; name: string; amount: number } | null;
  projectedSubscriptionsTotal?: number;
  dueSubscriptions?: DueSubscriptionItem[];
  onPaySubscription?: (id: string, name: string) => Promise<void>;
  /** Opens the budget dialog, which the dashboard renders outside this card. */
  onEditBudget?: () => void;
  /** Replaces the "set a budget" prompt, e.g. for a savings Saku that has no spending budget. */
  noBudgetText?: string;
}

/** The period line under the day's summary: spent of budget, the bar, and what is still due. */
export default function BudgetProgress({
  period = "week",
  weeklyTotal,
  weeklyBudget,
  regularTotal,
  exemptTotal,
  exemptCount,
  unexemptAnomaly,
  projectedSubscriptionsTotal,
  dueSubscriptions,
  onPaySubscription,
  onEditBudget,
  noBudgetText,
}: BudgetProgressProps) {
  const { t, formatCurrency } = useTranslation();
  const [isExempting, setIsExempting] = useState(false);
  const [payingSubId, setPayingSubId] = useState<string | null>(null);
  const [isDueSubsOpen, setIsDueSubsOpen] = useState(false);

  // One-off expenses are left out of the budget math.
  const activeSpend = regularTotal !== undefined ? regularTotal : weeklyTotal;
  const rawPercent = weeklyBudget > 0 ? Math.round((activeSpend / weeklyBudget) * 100) : 0;
  const barWidth = Math.min(rawPercent, 100);
  const remaining = weeklyBudget - activeSpend;
  const isOver = weeklyBudget > 0 && remaining < 0;
  const isWarning = !isOver && rawPercent >= 75;

  const projectedSubSpend = Math.max(0, projectedSubscriptionsTotal || 0);
  const projectedBarWidth =
    weeklyBudget > 0
      ? Math.min(Math.round((projectedSubSpend / weeklyBudget) * 100), Math.max(0, 100 - barWidth))
      : 0;
  const projectedRemaining = weeklyBudget - activeSpend - projectedSubSpend;
  const willBeOverWithSubs = !isOver && projectedRemaining < 0;

  // Leaf while comfortable, tangerine when 75% is gone, brick when over.
  const barColor = isOver ? "bg-danger" : isWarning ? "bg-accent" : "bg-ok";

  const spentOfBudget = (period === "month" ? t.home.spentOfBudgetMonth : t.home.spentOfBudgetWeek)
    .replace("{spent}", formatCurrency(activeSpend))
    .replace("{budget}", formatCurrency(weeklyBudget));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{weeklyBudget > 0 ? spentOfBudget : noBudgetText ?? t.home.noBudget}</p>
        {/* Changing an existing budget lives in the menu; the card only asks when none is set. */}
        {weeklyBudget <= 0 && onEditBudget && (
          <button
            type="button"
            onClick={onEditBudget}
            className="-mr-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-accent-strong hover:bg-paper active:bg-line"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span>{t.home.setBudget}</span>
          </button>
        )}
      </div>

      {weeklyBudget > 0 && (
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label={spentOfBudget}
          aria-valuenow={Math.min(rawPercent, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={`h-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${barWidth}%` }} />
          {projectedBarWidth > 0 && (
            <div
              className="h-full bg-ink-soft/50 transition-all duration-700 ease-out"
              style={{ width: `${projectedBarWidth}%` }}
              title={`${t.budget.projectedSubsLegend}: ${formatCurrency(projectedSubSpend)}`}
            />
          )}
        </div>
      )}

      {/* What subscriptions will still take before the period ends */}
      {projectedSubSpend > 0 && !isOver && (
        <p className={`text-xs ${willBeOverWithSubs ? "font-semibold text-danger" : "text-ink-soft"}`}>
          {willBeOverWithSubs
            ? t.budget.projectedOverWarning.replace("{amount}", formatCurrency(Math.abs(projectedRemaining)))
            : t.budget.projectedRemaining.replace("{amount}", formatCurrency(projectedRemaining))}
        </p>
      )}

      {/* Subscriptions due in this period, with a one-tap "paid" action */}
      {projectedSubSpend > 0 && dueSubscriptions && dueSubscriptions.length > 0 && (
        <div className="rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setIsDueSubsOpen(!isDueSubsOpen)}
            aria-expanded={isDueSubsOpen}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm hover:bg-paper active:bg-line"
          >
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ink-soft transition-transform ${isDueSubsOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
              <span className="truncate">
                {period === "month" ? t.budget.dueThisMonthTitle : t.budget.dueThisWeekTitle} ({dueSubscriptions.length})
              </span>
            </span>
            <span className="shrink-0 font-bold">+{formatCurrency(projectedSubSpend)}</span>
          </button>

          {isDueSubsOpen && (
            <ul className="flex flex-col border-t border-line">
              {dueSubscriptions.map((sub) => {
                const isPayingThis = payingSubId === sub.id;
                return (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between gap-3 border-b border-dashed border-line px-3 py-2 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{sub.name}</p>
                      <p className="text-xs text-ink-soft">
                        {formatCurrency(sub.userShare)} · {sub.next_renewal_date}
                      </p>
                    </div>
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
                        className="min-h-11 shrink-0 rounded-xl border border-line bg-card px-3 text-sm font-semibold hover:bg-paper active:bg-line disabled:opacity-50"
                      >
                        {isPayingThis ? t.budget.payingAction : t.budget.markAsPaidAction}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* One-off expenses left out of the budget */}
      {exemptTotal && exemptTotal > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t.budget.exemptSummary
              .replace("{amount}", formatCurrency(exemptTotal))
              .replace("{count}", String(exemptCount || 1))}
          </span>
        </p>
      ) : null}

      {/* Offer to mark one large expense as a one-off when it pushed the period over */}
      {unexemptAnomaly && isOver && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-3">
          <p className="min-w-0 flex-1 text-sm break-words">
            {t.budget.exemptSuggestTitle
              .replace("{name}", unexemptAnomaly.name)
              .replace("{amount}", formatCurrency(unexemptAnomaly.amount))}
          </p>
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
            className="min-h-11 shrink-0 rounded-xl border border-line bg-card px-3 text-sm font-semibold hover:bg-paper active:bg-line disabled:opacity-50"
          >
            {isExempting ? t.common.saving : t.budget.exemptSuggestAction}
          </button>
        </div>
      )}

      {isOver && <p className="text-sm text-ink-soft">{t.budget.overBudgetEncouragement}</p>}

    </div>
  );
}
