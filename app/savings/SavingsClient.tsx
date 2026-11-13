"use client";

import { useState } from "react";
import {
  Target,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
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
import ModalOverlay from "@/app/ui/ModalOverlay";
import { MoneyField } from "@/app/ui/Field";
import { parseRupiahInput } from "@/utils/money";

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
    setGoalTarget(String(goal.targetAmount));
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
        <p className="mt-1 text-sm text-ink-soft">{t.savings.budgetSurplusSubtitle}</p>
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

      {isGoalModalOpen && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {editingGoal ? t.savings.editGoalTitle : t.savings.createGoalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {t.savings.goalEmojiLabel}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setGoalEmoji(emoji)}
                      className={`h-8 w-8 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                        goalEmoji === emoji
                          ? "bg-teal-100 border-2 border-teal-500 dark:bg-teal-950/60 dark:border-teal-400"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {t.savings.goalNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder={t.savings.goalNamePlaceholder}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

              <MoneyField
                label={t.savings.goalTargetLabel}
                value={goalTarget}
                onChange={setGoalTarget}
                prefix={currencySymbol}
                placeholder={t.savings.targetAmountPlaceholder}
                required
              />

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {isSubmitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Allocate to Goal */}
      {allocatingGoal && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>{allocatingGoal.emoji}</span>
                <span>{t.savings.allocateModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAllocatingGoal(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t.savings.allocateModalSubtitle} ({allocatingGoal.name})
            </p>

            <form onSubmit={handleAllocate} className="mt-4 flex flex-col gap-3.5">
              {/* Funding Source Selector (if surplus is available) */}
              {availableSurplus > 0 && availableCoreSavings > 0 && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500 block mb-1">
                    Sumber Dana
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAllocationSource("core");
                        const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                        setAllocationAmount(toAmountInput(Math.min(maxNeeded, availableCoreSavings)));
                      }}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        allocationSource === "core"
                          ? "bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      Tabungan Pokok
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAllocationSource("surplus");
                        const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                        setAllocationAmount(toAmountInput(Math.min(maxNeeded, availableSurplus)));
                      }}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        allocationSource === "surplus"
                          ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      Sisa Anggaran
                    </button>
                  </div>
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

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                    setAllocationAmount(toAmountInput(maxPool * 0.5));
                  }}
                  className="flex-1 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  {t.savings.quickHalf}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                    const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                    setAllocationAmount(toAmountInput(Math.min(maxNeeded, maxPool)));
                  }}
                  className="flex-1 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  {t.savings.quickAll}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAllocatingGoal(null)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parseRupiahInput(allocationAmount, { max: allocationMax }).ok}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmAllocate}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Withdraw from Goal */}
      {withdrawingGoal && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>{withdrawingGoal.emoji}</span>
                <span>{t.savings.withdrawModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setWithdrawingGoal(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t.savings.withdrawModalSubtitle}
            </p>

            <form onSubmit={handleWithdraw} className="mt-4 flex flex-col gap-3">
              <MoneyField
                label={t.savings.allocationAmountLabel}
                hint={`${t.savings.maxAllocated}: ${formatCurrency(withdrawingGoal.allocatedAmount)}`}
                value={withdrawingAmount}
                onChange={setWithdrawingAmount}
                prefix={currencySymbol}
                max={withdrawingGoal.allocatedAmount}
                required
              />

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawingGoal(null)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parseRupiahInput(withdrawingAmount, { max: withdrawingGoal.allocatedAmount }).ok}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmWithdraw}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Alirkan Sisa Anggaran (Sweep Surplus) */}
      {isSweepModalOpen && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>{t.savings.sweepModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSweepModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.savings.sweepModalSubtitle}
            </p>

            <form onSubmit={handleSweep} className="mt-4 flex flex-col gap-3.5">
              <MoneyField
                label="Nominal yang Dialirkan"
                hint={`${t.savings.maxAvailable}: ${formatCurrency(availableSurplus)}`}
                value={sweepAmount}
                onChange={setSweepAmount}
                prefix={currencySymbol}
                max={availableSurplus}
                required
              />

              {/* Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSweepAmount(toAmountInput(availableSurplus * 0.5))}
                  className="flex-1 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  50% ({formatCurrency(Math.round(availableSurplus * 0.5))})
                </button>
                <button
                  type="button"
                  onClick={() => setSweepAmount(toAmountInput(availableSurplus))}
                  className="flex-1 py-1 text-xs font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Semua ({formatCurrency(availableSurplus)})
                </button>
              </div>

              {/* Destination Selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                  {t.savings.sweepDestinationLabel}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                    <input
                      type="radio"
                      name="sweepDestination"
                      checked={sweepTargetGoalId === ""}
                      onChange={() => setSweepTargetGoalId("")}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                        🏦 {t.savings.sweepToCoreSavings}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Disatukan ke saldo tabungan pokok yang bebas dialokasikan kapan saja
                      </span>
                    </div>
                  </label>

                  {goals.length > 0 && (
                    <label className="flex items-start gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <input
                        type="radio"
                        name="sweepDestination"
                        checked={sweepTargetGoalId !== ""}
                        onChange={() => setSweepTargetGoalId(goals[0]?.id || "")}
                        className="mt-0.5 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                          🎯 {t.savings.sweepToGoal}
                        </span>
                        {sweepTargetGoalId !== "" && (
                          <select
                            value={sweepTargetGoalId}
                            onChange={(e) => setSweepTargetGoalId(e.target.value)}
                            className="w-full mt-1 rounded-lg border border-zinc-200 bg-white p-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            {goals.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.emoji} {g.name} (Terkumpul {formatCurrency(g.allocatedAmount)} / {formatCurrency(g.targetAmount)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSweepModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parseRupiahInput(sweepAmount, { max: availableSurplus }).ok}
                  className="px-4 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-semibold hover:brightness-95 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmSweep}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Manual Core Savings Adjustment */}
      {isAdjustmentModalOpen && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {t.savings.manualAdjustmentTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.savings.manualAdjustmentSubtitle}
            </p>

            <form onSubmit={handleManualAdjustment} className="mt-4 flex flex-col gap-3.5">
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("deposit")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    adjustmentType === "deposit"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.savings.adjustmentTypeDeposit}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("withdraw")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    adjustmentType === "withdraw"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.savings.adjustmentTypeWithdraw}
                </button>
              </div>

              <MoneyField
                label={t.savings.adjustmentAmountLabel}
                hint={
                  adjustmentType === "withdraw"
                    ? `Saldo tersedia: ${formatCurrency(withdrawableSavings)}`
                    : undefined
                }
                value={adjustmentAmount}
                onChange={setAdjustmentAmount}
                prefix={currencySymbol}
                placeholder="250.000"
                {...adjustmentLimit}
                required
              />

              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {t.savings.adjustmentNoteLabel}
                </label>
                <input
                  type="text"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder={
                    adjustmentType === "deposit"
                      ? "cth. Gaji bulanan, Setoran awal, Bonus"
                      : "cth. Keperluan mendadak, Beli obat, Tarik tunai"
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parseRupiahInput(adjustmentAmount, adjustmentLimit).ok}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}
