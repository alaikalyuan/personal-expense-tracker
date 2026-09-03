"use client";

import { useState } from "react";
import { Pencil, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { setWeeklyBudget } from "@/app/actions";

interface BudgetProgressProps {
  weeklyTotal: number;
  weeklyBudget: number;
  daysRemaining: number;
}

const presetBudgets = [
  { label: "250k", value: 250000 },
  { label: "500k", value: 500000 },
  { label: "1jt", value: 1000000 },
  { label: "2jt", value: 2000000 },
];

export default function BudgetProgress({
  weeklyTotal,
  weeklyBudget,
  daysRemaining,
}: BudgetProgressProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(weeklyBudget));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawPercent = weeklyBudget > 0 ? Math.round((weeklyTotal / weeklyBudget) * 100) : 0;
  const barWidth = Math.min(rawPercent, 100);
  const remaining = weeklyBudget - weeklyTotal;
  const isOver = remaining < 0;
  const dailyAllowance = Math.max(Math.round(remaining / Math.max(daysRemaining, 1)), 0);

  // Health status
  const isDanger = isOver || rawPercent >= 90;
  const isWarning = !isDanger && rawPercent >= 75;

  const barColor = isDanger
    ? "bg-rose-500 shadow-md shadow-rose-500/30"
    : isWarning
    ? "bg-amber-500 shadow-md shadow-amber-500/20"
    : "bg-emerald-500 shadow-md shadow-emerald-500/20";

  const textColor = isDanger
    ? "text-rose-400"
    : isWarning
    ? "text-amber-400"
    : "text-emerald-400";

  const handleFormSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      await setWeeklyBudget(formData);
      setIsEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      {/* Progress Track & Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
          {isDanger ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>
            {rawPercent}% used of{" "}
            <span className="text-zinc-200 font-semibold">
              Rp {weeklyBudget.toLocaleString("id-ID")}
            </span>
          </span>
        </span>

        <button
          type="button"
          onClick={() => {
            setBudgetInput(String(weeklyBudget));
            setIsEditOpen(true);
          }}
          aria-label="Edit weekly budget"
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 py-0.5 px-1.5 rounded-md hover:bg-zinc-800/60 transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
          <span>Edit limit</span>
        </button>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800/80">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Remaining Allowance Line */}
      <div className="flex items-center justify-between text-[11px]">
        {isOver ? (
          <span className="font-semibold text-rose-400">
            Over budget by Rp {Math.abs(remaining).toLocaleString("id-ID")}
          </span>
        ) : (
          <span className="text-zinc-400">
            <span className={`font-semibold ${textColor}`}>
              Rp {remaining.toLocaleString("id-ID")}
            </span>{" "}
            left
          </span>
        )}

        {!isOver && (
          <span className="text-zinc-500">
            ~Rp {dailyAllowance.toLocaleString("id-ID")}/day ({daysRemaining}d left)
          </span>
        )}
      </div>

      {/* Edit Budget Modal */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsEditOpen(false);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Weekly Budget Limit
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Set your maximum weekly spending goal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={handleFormSubmit} className="flex flex-col gap-3 pt-3">
              {/* Preset buttons */}
              <div>
                <p className="text-[10px] uppercase font-medium tracking-wider text-zinc-400 mb-1.5">
                  Quick Presets
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {presetBudgets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBudgetInput(String(preset.value))}
                      className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        budgetInput === String(preset.value)
                          ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 focus-within:border-zinc-500 mt-1">
                <span className="mr-2 text-sm font-semibold text-zinc-400">
                  Rp
                </span>
                <input
                  name="budget"
                  type="number"
                  inputMode="numeric"
                  step="1000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="e.g. 500000"
                  required
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500 text-zinc-100"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80 mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

