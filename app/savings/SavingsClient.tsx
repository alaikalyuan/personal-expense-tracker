"use client";

import { useState } from "react";
import {
  PiggyBank,
  Target,
  Sparkles,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  HeartHandshake,
  Coins,
  ArrowUpRight,
  History,
} from "lucide-react";
import confetti from "canvas-confetti";
import UserMenu from "@/app/UserMenu";
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
  const { t, formatCurrency, currencySymbol, currency } = useTranslation();

  // Mindful quote index
  const [quoteIndex, setQuoteIndex] = useState(0);

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
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Surplus weeks that contributed to unspent budget
  const surplusWeeks = completedWeeks.filter((w) => w.isSurplus && w.surplus > 0);

  // Shuffle quote
  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % t.savings.quotes.length);
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore if canvas unavailable
    }
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
    if (!goalName.trim() || !goalTarget || Number(goalTarget) <= 0) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.set("name", goalName.trim());
      formData.set("target_amount", goalTarget);
      formData.set("emoji", goalEmoji);

      if (editingGoal) {
        formData.set("id", editingGoal.id);
        await updateSavingsGoal(formData);
      } else {
        await createSavingsGoal(formData);
      }
      setIsGoalModalOpen(false);
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
    if (!allocatingGoal || !allocationAmount) return;
    const amountNum = Number(allocationAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Withdrawal Handler
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawingGoal || !withdrawingAmount) return;
    const amountNum = Number(withdrawingAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      setIsSubmitting(true);
      await withdrawSavingsFromGoal(withdrawingGoal.id, amountNum);
      setWithdrawingGoal(null);
      setWithdrawingAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sweep Surplus Handler (Transfer to Core Savings or Goal)
  const handleSweep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sweepAmount) return;
    const amountNum = Number(sweepAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > availableSurplus) return;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Core Savings Adjustment Handler
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentAmount) return;
    const amountNum = Number(adjustmentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="font-bold tracking-tight text-lg flex items-center gap-1.5 text-zinc-900 dark:text-white">
            <PiggyBank className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
            {t.savings.title}
          </h1>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {t.savings.subtitle}
          </p>
        </div>

        <UserMenu isGuest={isGuest} />
      </div>

      {/* Two Pillars Financial Health Overview */}
      <div className="flex flex-col gap-3">
        {/* Pillar 1: Tabungan Pokok (Core Vault) */}
        <div className="rounded-3xl border border-teal-200/90 bg-linear-to-b from-teal-50/70 via-white to-white p-5 shadow-xs dark:border-teal-900/60 dark:bg-linear-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 inline-block" />
                {t.savings.coreSavingsTitle}
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  {formatCurrency(coreSavings)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t.savings.coreSavingsSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const section = document.getElementById("savings-history-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                aria-label={t.savings.viewHistoryButton}
                title={t.savings.viewHistoryButton}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-200/80 bg-white text-teal-700 hover:bg-teal-50 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
              >
                <History className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentAmount("");
                  setAdjustmentNote("");
                  setIsAdjustmentModalOpen(true);
                }}
                aria-label={t.savings.manualAdjustmentButton}
                title={t.savings.manualAdjustmentButton}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-200/80 bg-white text-teal-700 hover:bg-teal-50 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Breakdown Metrics Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3.5 border-t border-teal-100/80 dark:border-zinc-800/80">
            <div className="rounded-2xl border border-teal-100/70 bg-white/80 p-3 dark:border-zinc-800/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {t.savings.availableForGoals}
              </span>
              <p className="mt-0.5 text-sm font-bold text-teal-700 dark:text-teal-300">
                {formatCurrency(availableCoreSavings)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {t.savings.allocatedToGoals}
              </span>
              <p className="mt-0.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {formatCurrency(totalAllocatedToGoals)}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Sisa Anggaran Mingguan (Budget Surplus Buffer) */}
        <div className="rounded-3xl border border-amber-200/80 bg-linear-to-b from-amber-50/40 via-white to-white p-5 shadow-xs dark:border-amber-900/40 dark:bg-linear-to-b dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {t.savings.budgetSurplusTitle}
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  +{formatCurrency(availableSurplus)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t.savings.budgetSurplusSubtitle}
              </p>
            </div>

            {availableSurplus > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSweepAmount(String(availableSurplus));
                  setSweepTargetGoalId(goals[0]?.id || "");
                  setIsSweepModalOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{t.savings.sweepSurplusButton}</span>
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3.5 border-t border-amber-100/70 dark:border-zinc-800/80">
            <div className="rounded-2xl border border-amber-100/60 bg-white/80 p-2.5 dark:border-zinc-800/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {t.savings.totalSurplusEarned}
              </span>
              <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                +{formatCurrency(unspentSurplusTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800/50 dark:bg-zinc-900/40">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {t.savings.sweptSurplusTotal}
              </span>
              <p className="mt-0.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {formatCurrency(sweptSurplus)}
              </p>
            </div>
          </div>

          {/* Ongoing Week Estimator */}
          {ongoingSpend < weeklyBudget && ongoingProjectedSurplus > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-100/50 dark:bg-amber-950/30 px-3 py-2 text-[11px] border border-amber-200/60 dark:border-amber-900/40">
              <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t.savings.ongoingWeekLabel}</span>
              </span>
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                ~{formatCurrency(ongoingProjectedSurplus)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Supportive Mindset Banner (Never flashing red; encouraging and calm) */}
      <div className="rounded-2xl border border-zinc-200/80 bg-linear-to-r from-stone-50 via-zinc-50 to-emerald-50/40 p-4 shadow-2xs dark:border-zinc-800/80 dark:bg-linear-to-r dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-teal-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100/80 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 shrink-0">
              <HeartHandshake className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-200">
                {t.savings.supportiveTitle}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 italic leading-relaxed">
                &ldquo;{t.savings.quotes[quoteIndex]}&rdquo;
              </p>
              {coreSavings === 0 && (
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {t.savings.zeroSavingsEncouragement}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextQuote}
            aria-label={t.savings.nextQuote}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Savings Goals Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              {t.savings.goalsTitle}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t.savings.goalsSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateGoal}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{goals.length === 0 ? t.savings.createGoalButton : t.savings.addGoalButton}</span>
          </button>
        </div>

        {/* State A: No goal set yet */}
        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-center shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 mb-2.5">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {t.savings.noGoalTitle}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {t.savings.noGoalDescription}
            </p>
            <button
              type="button"
              onClick={openCreateGoal}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-3.5 py-1.5 text-xs font-medium hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.savings.createGoalButton}
            </button>
          </div>
        ) : (
          /* State B: One or more goals */
          <div className="flex flex-col gap-3">
            {goals.map((goal) => {
              const allocated = Number(goal.allocatedAmount || 0);
              const target = Number(goal.targetAmount);
              const rawPercent = target > 0 ? Math.round((allocated / target) * 100) : 0;
              const isReached = allocated >= target;
              const barWidth = Math.min(rawPercent, 100);
              const canAllocate = availableCoreSavings > 0 || availableSurplus > 0;

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl shrink-0 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/50">
                        {goal.emoji || "🎯"}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {goal.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Target: {formatCurrency(target)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditGoal(goal)}
                        aria-label={t.savings.editGoalTitle}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        aria-label={t.common.delete}
                        className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(allocated)}{" "}
                        <span className="text-zinc-500 font-normal">
                          ({rawPercent}%)
                        </span>
                      </span>
                      {isReached ? (
                        <button
                          type="button"
                          onClick={triggerConfetti}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          {t.savings.goalReached}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500">
                          {formatCurrency(Math.max(0, target - allocated))} {t.budget.left}
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-200/70 dark:border-zinc-800/80">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isReached
                            ? "bg-emerald-500 shadow-xs shadow-emerald-500/30"
                            : "bg-teal-500 shadow-xs shadow-teal-500/20"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions: Allocate & Withdraw */}
                  <div className="mt-3.5 flex items-center justify-end gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
                    {allocated > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawingGoal(goal);
                          setWithdrawingAmount(String(allocated));
                        }}
                        className="text-[10px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
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
                        setAllocationAmount(String(suggested > 0 ? suggested : maxPool));
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                        canAllocate
                          ? "bg-teal-600 text-white hover:bg-teal-700 shadow-2xs active:scale-95"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.savings.allocateButton}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
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
              <p className="text-[11px] text-zinc-500 text-center py-3">
                {t.savings.noSurplusWeeksDesc}
              </p>
            ) : (
              surplusWeeks.map((week) => (
                <div
                  key={week.weekId}
                  className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-zinc-200/60 dark:bg-zinc-900/70 dark:border-zinc-800 text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                      {week.label}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {t.savings.weekPacingLabel}: {formatCurrency(week.regularSpend)} / {formatCurrency(week.budget)}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    +{formatCurrency(week.surplus)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
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
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
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

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {t.savings.goalTargetLabel}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder={t.savings.targetAmountPlaceholder}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

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
        </div>
      )}

      {/* Modal: Allocate to Goal */}
      {allocatingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    Sumber Dana
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAllocationSource("core");
                        const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                        setAllocationAmount(String(Math.min(maxNeeded, availableCoreSavings)));
                      }}
                      className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
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
                        setAllocationAmount(String(Math.min(maxNeeded, availableSurplus)));
                      }}
                      className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
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

              <div>
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                  <span>{t.savings.allocationAmountLabel}</span>
                  <span>
                    {t.savings.maxAvailable}: {formatCurrency(allocationSource === "core" ? availableCoreSavings : availableSurplus)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  max={allocationSource === "core" ? availableCoreSavings : availableSurplus}
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                    setAllocationAmount(String(Math.round(maxPool * 0.5)));
                  }}
                  className="flex-1 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  {t.savings.quickHalf}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const maxPool = allocationSource === "core" ? availableCoreSavings : availableSurplus;
                    const maxNeeded = Math.max(0, allocatingGoal.targetAmount - allocatingGoal.allocatedAmount);
                    setAllocationAmount(String(Math.min(maxNeeded, maxPool)));
                  }}
                  className="flex-1 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
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
                  disabled={isSubmitting || Number(allocationAmount) <= 0}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmAllocate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw from Goal */}
      {withdrawingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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
              <div>
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                  <span>{t.savings.allocationAmountLabel}</span>
                  <span>
                    {t.savings.maxAllocated}: {formatCurrency(withdrawingGoal.allocatedAmount)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  max={withdrawingGoal.allocatedAmount}
                  value={withdrawingAmount}
                  onChange={(e) => setWithdrawingAmount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

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
                  disabled={isSubmitting || Number(withdrawingAmount) <= 0}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmWithdraw}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alirkan Sisa Anggaran (Sweep Surplus) */}
      {isSweepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
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
              <div>
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                  <span>Nominal yang Dialirkan ({currencySymbol})</span>
                  <span>
                    {t.savings.maxAvailable}: {formatCurrency(availableSurplus)}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  max={availableSurplus}
                  value={sweepAmount}
                  onChange={(e) => setSweepAmount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSweepAmount(String(Math.round(availableSurplus * 0.5)))}
                  className="flex-1 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  50% ({formatCurrency(Math.round(availableSurplus * 0.5))})
                </button>
                <button
                  type="button"
                  onClick={() => setSweepAmount(String(availableSurplus))}
                  className="flex-1 py-1 text-[11px] font-medium rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Semua ({formatCurrency(availableSurplus)})
                </button>
              </div>

              {/* Destination Selection */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
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
                      <span className="text-[10px] text-zinc-500">
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
                  disabled={isSubmitting || Number(sweepAmount) <= 0 || Number(sweepAmount) > availableSurplus}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.savings.confirmSweep}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Core Savings Adjustment */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
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

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
                  {t.savings.adjustmentAmountLabel}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder={currency === "IDR" ? "cth. 250000" : "cth. 50"}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1 block">
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
                  disabled={isSubmitting || Number(adjustmentAmount) <= 0}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}
