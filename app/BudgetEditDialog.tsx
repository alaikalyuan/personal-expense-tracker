"use client";

import { useState } from "react";
import { setWeeklyBudget, setMonthlyBudget } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField } from "@/app/ui/Field";
import { parseRupiahInput } from "@/utils/money";

// Mount this only while it is open: each opening starts from the current budget.
interface BudgetEditDialogProps {
  onClose: () => void;
  period: "week" | "month";
  currentBudget: number;
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

/** Sets the weekly or monthly budget. Opened from the menu, or from the card when no budget exists. */
export default function BudgetEditDialog({ onClose, period, currentBudget }: BudgetEditDialogProps) {
  const { t, currency, currencySymbol } = useTranslation();
  const [budgetInput, setBudgetInput] = useState(currentBudget > 0 ? String(Math.round(currentBudget)) : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const presetBudgets = getPresets(currency, period, t);

  const close = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiahInput(budgetInput);
    // MoneyField shows the parse error itself and the browser blocks the submit.
    if (!parsed.ok) return;
    const formData = new FormData();
    formData.set("budget", String(parsed.value));
    try {
      setIsSubmitting(true);
      setSaveError(null);
      if (period === "month") {
        await setMonthlyBudget(formData);
      } else {
        await setWeeklyBudget(formData);
      }
      onClose();
    } catch {
      setSaveError(t.home.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
        isOpen
        onClose={close}
        busy={isSubmitting}
        title={period === "month" ? t.budget.monthlyModalTitle : t.budget.modalTitle}
        description={period === "month" ? t.budget.monthlyModalSubtitle : t.budget.modalSubtitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={close} disabled={isSubmitting}>
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
  );
}
