"use client";

import { useState } from "react";
import {
  Target,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import UserMenu from "@/app/UserMenu";
import AiHeaderButton from "@/app/ai/AiHeaderButton";
import { useTranslation } from "@/utils/i18n/context";
import {
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  allocateSavingsToGoal,
  withdrawSavingsFromGoal,
  sweepSurplusToSavings,
  recordManualSavingsAdjustment,
  SavingsHistoryItem,
} from "@/app/actions";
import SavingsBalanceHistory from "./SavingsBalanceHistory";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField, SelectField, TextField } from "@/app/ui/Field";
import { SegmentedControl, ToggleChip } from "@/app/ui/Toggle";
import { parseRupiahInput, toRupiahFieldValue } from "@/utils/money";

export interface CompletedWeekData {
  weekId: string;
  startDateStr: string;
  endDateStr: string;
  label: string;
  budget: number;
  regularSpend: number;
  totalSpend: number;
  isSurplus: boolean;
  surplus: number;
  deficit: number;
  expensesCount: number;
}

export interface SavingsGoalItem {
  id: string;
  name: string;
  targetAmount: number;
  allocatedAmount: number;
  emoji?: string;
  createdAt: string;
}

interface SavingsClientProps {
  weeklyBudget: number;
  completedWeeks: CompletedWeekData[];
  goals: SavingsGoalItem[];
  coreSavings: number;
  availableCoreSavings: number;
  totalAllocatedToGoals: number;
  unspentSurplusTotal: number;
  sweptSurplus: number;
  availableSurplus: number;
  ongoingSpend: number;
  ongoingProjectedSurplus: number;
  isGuest?: boolean;
  savingsHistory?: SavingsHistoryItem[];
}

const EMOJI_PRESETS = ["🎯", "🏖️", "🛡️", "💻", "📚", "🚗", "🏠", "🎁"];

/** A whole-rupiah amount as MoneyField text. */
const toAmountInput = (value: number) => String(Math.max(0, Math.floor(value)));

export default function SavingsClient({
  weeklyBudget,
  completedWeeks,
  goals,
  coreSavings,
  availableCoreSavings,
  totalAllocatedToGoals,
  unspentSurplusTotal,
  sweptSurplus,
  availableSurplus,
  ongoingSpend,
  ongoingProjectedSurplus,
  isGuest = false,
  savingsHistory = [],
}: SavingsClientProps) {
  const { t, formatCurrency, currencySymbol } = useTranslation();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalItem | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalEmoji, setGoalEmoji] = useState("🎯");

  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoalItem | null>(null);
  const [allocationAmount, setAllocationAmount] = useState("");
  const [allocationSource, setAllocationSource] = useState<"core" | "surplus">("core");

  const [withdrawingGoal, setWithdrawingGoal] = useState<SavingsGoalItem | null>(null);
  const [withdrawingAmount, setWithdrawingAmount] = useState("");

  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
  const [sweepAmount, setSweepAmount] = useState("");
  const [sweepTargetGoalId, setSweepTargetGoalId] = useState("");

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"deposit" | "withdraw">("deposit");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Money actions must never fail silently: say so, and keep the form open.
  const showActionError = (err: unknown) => {
    setActionError(err instanceof Error && err.message ? err.message : t.home.saveFailed);
    setTimeout(() => setActionError(null), 6000);
  };
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Surplus weeks that contributed to unspent budget
  const surplusWeeks = completedWeeks.filter((w) => w.isSurplus && w.surplus > 0);

  // Upper bounds for the money fields; the server checks the same limits.
  const allocationMax = allocationSource === "core" ? availableCoreSavings : availableSurplus;
  const withdrawableSavings = Math.max(0, coreSavings);
  const adjustmentLimit =
    adjustmentType === "withdraw"
      ? {
          max: withdrawableSavings,
          maxError: `Saldo tabungan tidak cukup. Saldo tersedia ${formatCurrency(withdrawableSavings)}.`,
        }
      : {};

  // Loaded on demand: the confetti library is only needed after a goal is reached.
  const triggerConfetti = () => {
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true })
      )
      .catch(() => {
        // Ignore if canvas unavailable
      });
  };

  // Goal Form Open Handlers
  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalName("");
    setGoalTarget("");
    setGoalEmoji("🎯");
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: SavingsGoalItem) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(toRupiahFieldValue(goal.targetAmount));
    setGoalEmoji(goal.emoji || "🎯");
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseRupiahInput(goalTarget);
    if (!goalName.trim() || !target.ok) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.set("name", goalName.trim());
      formData.set("target_amount", String(target.value));
      formData.set("emoji", goalEmoji);

      if (editingGoal) {
        formData.set("id", editingGoal.id);
        await updateSavingsGoal(formData);
      } else {
        await createSavingsGoal(formData);
      }
      setIsGoalModalOpen(false);
    } catch (err) {
      showActionError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goal: SavingsGoalItem) => {
    if (confirm(t.savings.deleteGoalConfirm)) {
      try {
        setIsSubmitting(true);
        await deleteSavingsGoal(goal.id);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Allocation Handler (from Core Savings or Sisa Anggaran)
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingGoal) return;
    const parsed = parseRupiahInput(allocationAmount, { max: allocationMax });
    if (!parsed.ok) return;
    const amountNum = parsed.value;

    try {
      setIsSubmitting(true);
      if (allocationSource === "surplus") {
        await sweepSurplusToSavings(amountNum, allocatingGoal.id);
      } else {
        await allocateSavingsToGoal(allocatingGoal.id, amountNum);
      }

      if (allocatingGoal.allocatedAmount + amountNum >= allocatingGoal.targetAmount) {
        triggerConfetti();
      }
      setAllocatingGoal(null);
      setAllocationAmount("");
    } catch (err) {
      showActionError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdrawal Handler
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingGoal) return;
    const parsed = parseRupiahInput(withdrawingAmount, { max: withdrawingGoal.allocatedAmount });
    if (!parsed.ok) return;
    const amountNum = parsed.value;

    try {
      setIsSubmitting(true);
      await withdrawSavingsFromGoal(withdrawingGoal.id, amountNum);
      setWithdrawingGoal(null);
      setWithdrawingAmount("");
    } catch (err) {
      showActionError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sweep Surplus Handler (Transfer to Core Savings or Goal)
  const handleSweep = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiahInput(sweepAmount, { max: availableSurplus });
    if (!parsed.ok) return;
    const amountNum = parsed.value;

    try {
      setIsSubmitting(true);
      await sweepSurplusToSavings(amountNum, sweepTargetGoalId || undefined);

      if (sweepTargetGoalId) {
        const targetGoal = goals.find((g) => g.id === sweepTargetGoalId);
        if (targetGoal && targetGoal.allocatedAmount + amountNum >= targetGoal.targetAmount) {
          triggerConfetti();
        }
      }

      setIsSweepModalOpen(false);
      setSweepAmount("");
      setSweepTargetGoalId("");
    } catch (err) {
      showActionError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Core Savings Adjustment Handler
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiahInput(adjustmentAmount, adjustmentLimit);
    if (!parsed.ok) return;
    const amountNum = parsed.value;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.set("type", adjustmentType);
      formData.set("amount", String(amountNum));
      if (adjustmentNote.trim()) {
        formData.set("note", adjustmentNote.trim());
      }
      await recordManualSavingsAdjustment(formData);
      setIsAdjustmentModalOpen(false);
      setAdjustmentAmount("");
      setAdjustmentNote("");
    } catch (err) {
      showActionError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-4 pb-48">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t.savings.title}</h1>
          <p className="text-sm text-ink-soft">{t.savings.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <AiHeaderButton />
          <UserMenu isGuest={isGuest} />
        </div>
      </header>

      {/* One focal number: what is saved. Its two parts sit on one line under it. */}
      <section aria-labelledby="core-title" className="receipt rounded-2xl bg-card p-5">
        <h2 id="core-title" className="text-sm font-semibold text-ink-soft">
          {t.savings.coreSavingsTitle}
        </h2>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink tabular-nums">
          {formatCurrency(coreSavings)}
        </p>
        {coreSavings === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{t.savings.zeroSavingsEncouragement}</p>
        ) : (
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-ink-soft">{t.savings.availableForGoals}</dt>
              <dd className="font-bold text-ink tabular-nums">{formatCurrency(availableCoreSavings)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-ink-soft">{t.savings.allocatedToGoals}</dt>
              <dd className="font-bold text-ink tabular-nums">{formatCurrency(totalAllocatedToGoals)}</dd>
            </div>
          </dl>
        )}
        <button
          type="button"
          onClick={() => {
            setAdjustmentAmount("");
            setAdjustmentNote("");
            setIsAdjustmentModalOpen(true);
          }}
          className="mt-4 min-h-11 w-full rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink hover:bg-line"
        >
          {t.savings.manualAdjustmentButton}
        </button>
      </section>

      {/* Weekly surplus: one number, one action. Running totals become one quiet line. */}
      <section aria-labelledby="surplus-title" className="rounded-2xl border border-line bg-card p-5">
        <h2 id="surplus-title" className="text-sm font-semibold text-ink-soft">
          {t.savings.budgetSurplusTitle}
        </h2>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink tabular-nums">
          {formatCurrency(availableSurplus)}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {weeklyBudget > 0 ? t.savings.budgetSurplusSubtitle : t.savings.budgetSurplusNoBudget}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {t.savings.totalSurplusEarned}{" "}
          <span className="whitespace-nowrap font-semibold text-ink tabular-nums">{formatCurrency(unspentSurplusTotal)}</span>
          {" · "}
          {t.savings.sweptSurplusTotal}{" "}
          <span className="whitespace-nowrap font-semibold text-ink tabular-nums">{formatCurrency(sweptSurplus)}</span>
        </p>
        {ongoingSpend < weeklyBudget && ongoingProjectedSurplus > 0 && (
          <p className="mt-1 text-sm text-ink-soft">
            {t.savings.ongoingWeekLabel}{" "}
            <span className="whitespace-nowrap font-semibold text-ink tabular-nums">~{formatCurrency(ongoingProjectedSurplus)}</span>
          </p>
        )}
        {availableSurplus > 0 && (
          <button
            type="button"
            onClick={() => {
              setSweepAmount(toAmountInput(availableSurplus));
              setSweepTargetGoalId(goals[0]?.id || "");
              setIsSweepModalOpen(true);
            }}
            className="mt-4 min-h-11 w-full rounded-xl bg-accent px-4 text-sm font-bold text-on-accent hover:brightness-95 active:brightness-90"
          >
            {t.savings.sweepSurplusButton}
          </button>
        )}
      </section>

      {/* Savings Goals Section */}
      <section aria-labelledby="goals-title" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="goals-title" className="text-lg font-bold text-ink">
              {t.savings.goalsTitle}
            </h2>
            <p className="text-sm text-ink-soft">{t.savings.goalsSubtitle}</p>
          </div>
          {goals.length > 0 && (
            <button
              type="button"
              onClick={openCreateGoal}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink hover:bg-line"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t.savings.addGoalButton}</span>
            </button>
          )}
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-card p-6 text-center">
            <Target className="mx-auto h-6 w-6 text-ink-soft" aria-hidden="true" />
            <p className="mt-2 text-base font-semibold text-ink">{t.savings.noGoalTitle}</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">{t.savings.noGoalDescription}</p>
            <button
              type="button"
              onClick={openCreateGoal}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-bold text-on-accent hover:brightness-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.savings.createGoalButton}
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {goals.map((goal) => {
              const allocated = Number(goal.allocatedAmount || 0);
              const target = Number(goal.targetAmount);
              const rawPercent = target > 0 ? Math.round((allocated / target) * 100) : 0;
              const isReached = allocated >= target;
              const barWidth = Math.min(rawPercent, 100);
              const canAllocate = availableCoreSavings > 0 || availableSurplus > 0;

              return (
                <li key={goal.id} className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-2xl" aria-hidden="true">
                        {goal.emoji || "🎯"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-ink">{goal.name}</h3>
                        <p className="text-sm text-ink-soft tabular-nums">
                          {formatCurrency(allocated)} / {formatCurrency(target)}
                        </p>
                      </div>
                    </div>
                    <div className="-mr-2 -mt-2 flex shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditGoal(goal)}
                        aria-label={`${t.savings.editGoalTitle}: ${goal.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-paper hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        aria-label={`${t.common.delete}: ${goal.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-paper hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-paper"
                    role="progressbar"
                    aria-label={goal.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={barWidth}
                  >
                    <div
                      className={`h-full rounded-full ${isReached ? "bg-ok" : "bg-accent"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-sm">
                    <span className="whitespace-nowrap font-semibold text-ink tabular-nums">{rawPercent}%</span>
                    {isReached ? (
                      <button
                        type="button"
                        onClick={triggerConfetti}
                        className="flex items-center gap-1 font-bold text-ok"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        {t.savings.goalReached}
                      </button>
                    ) : (
                      <span className="text-ink-soft tabular-nums">
                        {formatCurrency(Math.max(0, target - allocated))} {t.budget.left}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {allocated > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawingGoal(goal);
                          setWithdrawingAmount(toAmountInput(allocated));
                        }}
                        className="min-h-11 flex-1 rounded-xl border border-line bg-card px-3 text-sm font-semibold text-ink hover:bg-paper"
                      >
                        {t.savings.withdrawButton}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canAllocate}
                      onClick={() => {
                        setAllocatingGoal(goal);
                        const defaultSource = availableCoreSavings > 0 ? "core" : "surplus";
                        setAllocationSource(defaultSource);
                        const maxPool = defaultSource === "core" ? availableCoreSavings : availableSurplus;
                        const maxNeeded = Math.max(0, target - allocated);
                        const suggested = Math.min(maxNeeded, maxPool);
                        setAllocationAmount(toAmountInput(suggested > 0 ? suggested : maxPool));
                      }}
                      className="min-h-11 flex-1 rounded-xl bg-accent px-3 text-sm font-bold text-on-accent hover:brightness-95 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
                    >
                      {t.savings.allocateButton}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Savings Balance History (Riwayat Mutasi Saldo) */}
      <SavingsBalanceHistory
        history={savingsHistory}
        coreSavings={coreSavings}
        onOpenAdjustmentModal={() => {
          setAdjustmentAmount("");
          setAdjustmentNote("");
          setIsAdjustmentModalOpen(true);
        }}
      />

      {/* Unspent Weekly Rollover History Accordion */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          aria-expanded={isHistoryExpanded}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
        >
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
              {t.savings.historyTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.savings.historySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              +{formatCurrency(unspentSurplusTotal)}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                isHistoryExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isHistoryExpanded && (
          <div className="border-t border-zinc-200/80 p-3 pt-2 bg-zinc-50/50 dark:border-zinc-800/60 dark:bg-zinc-950/40 flex flex-col gap-2">
            {surplusWeeks.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-3">
                {t.savings.noSurplusWeeksDesc}
              </p>
            ) : (
              surplusWeeks.map((week) => (
                <div
                  key={week.weekId}
                  className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-zinc-200/60 dark:bg-zinc-900/70 dark:border-zinc-800 text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      {week.label}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t.savings.weekPacingLabel}: {formatCurrency(week.regularSpend)} / {formatCurrency(week.budget)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    +{formatCurrency(week.surplus)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Goal */}
      {actionError && (
        <p
          role="alert"
          className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-md rounded-xl bg-danger px-4 py-3 text-sm font-semibold text-card"
        >
          {actionError}
        </p>
      )}

      <Dialog
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        busy={isSubmitting}
        title={editingGoal ? t.savings.editGoalTitle : t.savings.createGoalTitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setIsGoalModalOpen(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button block variant="primary" type="submit" form="savings-goal-form" disabled={isSubmitting}>
              {isSubmitting ? t.common.saving : t.common.save}
            </Button>
          </>
        }
      >
        <form id="savings-goal-form" onSubmit={handleSaveGoal} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span id="goal-emoji-label" className="text-sm font-semibold text-ink">
              {t.savings.goalEmojiLabel}
            </span>
            <div role="group" aria-labelledby="goal-emoji-label" className="flex flex-wrap items-center gap-1.5">
              {EMOJI_PRESETS.map((emoji) => (
                <ToggleChip
                  key={emoji}
                  variant="swatch"
                  pressed={goalEmoji === emoji}
                  onClick={() => setGoalEmoji(emoji)}
                  aria-label={`${t.savings.goalEmojiLabel} ${emoji}`}
                  className="bg-paper"
                >
                  <span aria-hidden="true">{emoji}</span>
                </ToggleChip>
              ))}
            </div>
          </div>

          <TextField
            label={t.savings.goalNameLabel}
            type="text"
            required
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder={t.savings.goalNamePlaceholder}
          />

          <MoneyField
            label={t.savings.goalTargetLabel}
            value={goalTarget}
            onChange={setGoalTarget}
            prefix={currencySymbol}
            placeholder={t.savings.targetAmountPlaceholder}
            required
          />
        </form>
      </Dialog>

      <Dialog
        isOpen={allocatingGoal !== null}
        onClose={() => setAllocatingGoal(null)}
        busy={isSubmitting}
        title={allocatingGoal ? `${allocatingGoal.emoji || "🎯"} ${t.savings.allocateModalTitle}` : t.savings.allocateModalTitle}
        description={allocatingGoal ? `${t.savings.allocateModalSubtitle} (${allocatingGoal.name})` : undefined}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setAllocatingGoal(null)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button
              block
              variant="primary"
              type="submit"
              form="savings-allocate-form"
              disabled={isSubmitting || !parseRupiahInput(allocationAmount, { max: allocationMax }).ok}
            >
              {isSubmitting ? t.common.saving : t.savings.confirmAllocate}
            </Button>
          </>
        }
      >
        {allocatingGoal && (
          <form id="savings-allocate-form" onSubmit={handleAllocate} className="flex flex-col gap-4">
            {availableSurplus > 0 && availableCoreSavings > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink" aria-hidden="true">
                  {t.savings.fundingSourceLabel}
                </span>
                <SegmentedControl
                  ariaLabel={t.savings.fundingSourceLabel}
                  value={allocationSource}
                  onChange={(source) => {
                    setAllocationSource(source);
                    const pool = source === "core" ? availableCoreSavings : availableSurplus;
                    const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                    setAllocationAmount(toAmountInput(Math.min(maxNeeded, pool)));
                  }}
                  options={[
                    { value: "core", label: t.savings.fundingCore },
                    { value: "surplus", label: t.savings.fundingSurplus },
                  ]}
                />
              </div>
            )}

            <MoneyField
              label={t.savings.allocationAmountLabel}
              hint={`${t.savings.maxAvailable}: ${formatCurrency(allocationMax)}`}
              value={allocationAmount}
              onChange={setAllocationAmount}
              prefix={currencySymbol}
              max={allocationMax}
              required
            />

            <div className="flex items-center gap-2">
              <Button
                block
                onClick={() => {
                  const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                  setAllocationAmount(toAmountInput(maxPool * 0.5));
                }}
              >
                {t.savings.quickHalf}
              </Button>
              <Button
                block
                onClick={() => {
                  const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                  const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                  setAllocationAmount(toAmountInput(Math.min(maxNeeded, maxPool)));
                }}
              >
                {t.savings.quickAll}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        isOpen={withdrawingGoal !== null}
        onClose={() => setWithdrawingGoal(null)}
        busy={isSubmitting}
        title={withdrawingGoal ? `${withdrawingGoal.emoji || "🎯"} ${t.savings.withdrawModalTitle}` : t.savings.withdrawModalTitle}
        description={t.savings.withdrawModalSubtitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setWithdrawingGoal(null)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button
              block
              variant="primary"
              type="submit"
              form="savings-withdraw-form"
              disabled={
                isSubmitting ||
                !withdrawingGoal ||
                !parseRupiahInput(withdrawingAmount, { max: withdrawingGoal.allocatedAmount }).ok
              }
            >
              {isSubmitting ? t.common.saving : t.savings.confirmWithdraw}
            </Button>
          </>
        }
      >
        {withdrawingGoal && (
          <form id="savings-withdraw-form" onSubmit={handleWithdraw} className="flex flex-col gap-4">
            <MoneyField
              label={t.savings.allocationAmountLabel}
              hint={`${t.savings.maxAllocated}: ${formatCurrency(withdrawingGoal.allocatedAmount)}`}
              value={withdrawingAmount}
              onChange={setWithdrawingAmount}
              prefix={currencySymbol}
              max={withdrawingGoal.allocatedAmount}
              required
            />
          </form>
        )}
      </Dialog>

      <Dialog
        isOpen={isSweepModalOpen}
        onClose={() => setIsSweepModalOpen(false)}
        busy={isSubmitting}
        title={t.savings.sweepModalTitle}
        description={t.savings.sweepModalSubtitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setIsSweepModalOpen(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button
              block
              variant="primary"
              type="submit"
              form="savings-sweep-form"
              disabled={isSubmitting || !parseRupiahInput(sweepAmount, { max: availableSurplus }).ok}
            >
              {isSubmitting ? t.common.saving : t.savings.confirmSweep}
            </Button>
          </>
        }
      >
        <form id="savings-sweep-form" onSubmit={handleSweep} className="flex flex-col gap-4">
          <MoneyField
            label={t.savings.sweepAmountLabel}
            hint={`${t.savings.maxAvailable}: ${formatCurrency(availableSurplus)}`}
            value={sweepAmount}
            onChange={setSweepAmount}
            prefix={currencySymbol}
            max={availableSurplus}
            required
          />

          <div className="flex items-center gap-2">
            <Button block onClick={() => setSweepAmount(toAmountInput(availableSurplus * 0.5))}>
              50% ({formatCurrency(Math.round(availableSurplus * 0.5))})
            </Button>
            <Button block onClick={() => setSweepAmount(toAmountInput(availableSurplus))}>
              Semua ({formatCurrency(availableSurplus)})
            </Button>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold text-ink">{t.savings.sweepDestinationLabel}</legend>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-field-line p-3 hover:bg-paper">
              <input
                type="radio"
                name="sweepDestination"
                checked={sweepTargetGoalId === ""}
                onChange={() => setSweepTargetGoalId("")}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-sm">
                <span className="block font-bold text-ink">🏦 {t.savings.sweepToCoreSavings}</span>
                <span className="block text-xs text-ink-soft">{t.savings.sweepCoreHint}</span>
              </span>
            </label>

            {goals.length > 0 && (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-field-line p-3 hover:bg-paper">
                <input
                  type="radio"
                  name="sweepDestination"
                  checked={sweepTargetGoalId !== ""}
                  onChange={() => setSweepTargetGoalId(goals[0]?.id || "")}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                <span className="text-sm font-bold text-ink">🎯 {t.savings.sweepToGoal}</span>
              </label>
            )}
          </fieldset>

          {sweepTargetGoalId !== "" && (
            <SelectField
              label={t.savings.sweepGoalSelectLabel}
              value={sweepTargetGoalId}
              onChange={(e) => setSweepTargetGoalId(e.target.value)}
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name} (Terkumpul {formatCurrency(g.allocatedAmount)} / {formatCurrency(g.targetAmount)})
                </option>
              ))}
            </SelectField>
          )}
        </form>
      </Dialog>

      <Dialog
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        busy={isSubmitting}
        title={t.savings.manualAdjustmentTitle}
        description={t.savings.manualAdjustmentSubtitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setIsAdjustmentModalOpen(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button
              block
              variant="primary"
              type="submit"
              form="savings-adjust-form"
              disabled={isSubmitting || !parseRupiahInput(adjustmentAmount, adjustmentLimit).ok}
            >
              {isSubmitting ? t.common.saving : t.common.save}
            </Button>
          </>
        }
      >
        <form id="savings-adjust-form" onSubmit={handleManualAdjustment} className="flex flex-col gap-4">
          <SegmentedControl
            ariaLabel={t.savings.adjustmentTypeLabel}
            value={adjustmentType}
            onChange={setAdjustmentType}
            options={[
              { value: "deposit", label: t.savings.adjustmentTypeDeposit },
              { value: "withdraw", label: t.savings.adjustmentTypeWithdraw },
            ]}
          />

          <MoneyField
            label={t.savings.adjustmentAmountLabel}
            hint={adjustmentType === "withdraw" ? `Saldo tersedia: ${formatCurrency(withdrawableSavings)}` : undefined}
            value={adjustmentAmount}
            onChange={setAdjustmentAmount}
            prefix={currencySymbol}
            placeholder="250.000"
            {...adjustmentLimit}
            required
          />

          <TextField
            label={t.savings.adjustmentNoteLabel}
            type="text"
            value={adjustmentNote}
            onChange={(e) => setAdjustmentNote(e.target.value)}
            placeholder={
              adjustmentType === "deposit"
                ? "cth. Gaji bulanan, Setoran awal, Bonus"
                : "cth. Keperluan mendadak, Beli obat, Tarik tunai"
            }
          />
        </form>
      </Dialog>

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}
