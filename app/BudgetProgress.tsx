"use client";

import { useState } from "react";
import { Pencil, ChevronDown, Tag } from "lucide-react";
import { setWeeklyBudget, setMonthlyBudget, toggleExpenseExemption } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField } from "@/app/ui/Field";

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
}

function getPresets(currency: string, period: "week" | "month", t: ReturnType<typeof useTranslation>["t"]) {
  if (currency === "IDR") {
    return period === "month"
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
        ];
  }
  if (currency === "MYR") {
    return period === "month"
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
        ];
  }
  return period === "month"
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
      ];
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
}: BudgetProgressProps) {
  const { t, formatCurrency, currency, currencySymbol } = useTranslation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExempting, setIsExempting] = useState(false);
  const [payingSubId, setPayingSubId] = useState<string | null>(null);
  const [isDueSubsOpen, setIsDueSubsOpen] = useState(false);

  const presetBudgets = getPresets(currency, period, t);

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

  const closeEdit = () => {
    if (isSubmitting) return;
    setSaveError(null);
    setIsEditOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetInput || Number(budgetInput) <= 0) return;
    const formData = new FormData();
    formData.set("budget", budgetInput);
    try {
      setIsSubmitting(true);
      setSaveError(null);
      if (period === "month") {
        await setMonthlyBudget(formData);
      } else {
        await setWeeklyBudget(formData);
      }
      setIsEditOpen(false);
    } catch {
      setSaveError(t.home.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const spentOfBudget = (period === "month" ? t.home.spentOfBudgetMonth : t.home.spentOfBudgetWeek)
    .replace("{spent}", formatCurrency(activeSpend))
    .replace("{budget}", formatCurrency(weeklyBudget));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{weeklyBudget > 0 ? spentOfBudget : t.home.noBudget}</p>
        <button
          type="button"
          onClick={() => {
            setBudgetInput(weeklyBudget > 0 ? String(Math.round(weeklyBudget)) : "");
            setIsEditOpen(true);
          }}
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-accent-strong hover:bg-paper active:bg-line"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span>{weeklyBudget > 0 ? t.budget.editLimit : t.home.setBudget}</span>
        </button>
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

      <Dialog
        isOpen={isEditOpen}
        onClose={closeEdit}
        busy={isSubmitting}
        title={period === "month" ? t.budget.monthlyModalTitle : t.budget.modalTitle}
        description={period === "month" ? t.budget.monthlyModalSubtitle : t.budget.modalSubtitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={closeEdit} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button block variant="primary" type="submit" form="budget-form" disabled={isSubmitting || !budgetInput}>
              {isSubmitting ? t.common.saving : t.budget.saveBudget}
            </Button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <MoneyField
            label={t.home.budgetAmountLabel}
            value={budgetInput}
            onChange={setBudgetInput}
            prefix={currencySymbol}
            error={saveError}
            required
            autoFocus
          />
          <div role="group" aria-label={t.budget.quickPresets} className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">{t.budget.quickPresets}</p>
            <div className="grid grid-cols-4 gap-2">
              {presetBudgets.map((preset) => {
                const selected = budgetInput === String(preset.value);
                return (
                  <button
                    key={preset.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setBudgetInput(String(preset.value))}
                    className={`min-h-11 rounded-xl border text-sm font-semibold ${
                      selected ? "border-ink bg-ink text-card" : "border-line bg-card text-ink hover:bg-paper active:bg-line"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
