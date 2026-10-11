"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";

interface AiAdvisorCardProps {
  onOpenChat?: () => void;
  activePeriodTotal: number;
  activeBudget: number;
  topCategoryName?: string;
  isOverBudget?: boolean;
}

export default function AiAdvisorCard({
  onOpenChat,
  activePeriodTotal,
  activeBudget,
  topCategoryName,
  isOverBudget = false,
}: AiAdvisorCardProps) {
  const { t, locale } = useTranslation();
  const { openAi, isAiEnabled } = useAiAssistant();

  if (!isAiEnabled) return null;

  const handleOpen = (prompt?: string) => {
    if (onOpenChat && !prompt) {
      onOpenChat();
    } else {
      openAi(prompt);
    }
  };

  // Dynamic context teaser and smart chips calculation
  let teaserText = t.aiAdvisor.cardTeaserDefault;
  const chips: string[] = [];

  const ratio = activeBudget > 0 ? activePeriodTotal / activeBudget : 0;

  if (isOverBudget) {
    teaserText =
      locale === "id"
        ? "Pengeluaran telah melebihi batas anggaran."
        : "Spending has exceeded your budget.";
    chips.push(
      locale === "id"
        ? "Gimana cara balik ke jalur minggu ini?"
        : "How do I get back on track this week?"
    );
  } else if (ratio > 0.8) {
    teaserText =
      locale === "id"
        ? "Sudah mencapai 80%+ dari batas anggaran."
        : "Over 80% of your budget consumed.";
    chips.push(
      locale === "id"
        ? "Berapa batas belanja harian biar aman?"
        : "What is my safe daily spending limit?"
    );
  } else if (topCategoryName && topCategoryName !== t.common.none) {
    teaserText =
      locale === "id"
        ? `Pengeluaran terbesar di ${topCategoryName}.`
        : `Largest spend is in ${topCategoryName}.`;
    chips.push(
      locale === "id"
        ? `Tips hemat pos ${topCategoryName}`
        : `Tips to cut down on ${topCategoryName}`
    );
  } else if (ratio > 0 && ratio < 0.4) {
    teaserText =
      locale === "id"
        ? "Laju pengeluaran sangat hemat dan terjaga."
        : "Spending pace is well below budget.";
    chips.push(
      locale === "id"
        ? "Pindahkan sisa ke tabungan?"
        : "Sweep remainder to savings?"
    );
  }

  // Always offer quick natural input chip
  chips.push(
    locale === "id"
      ? "Catat pengeluaran lewat chat"
      : "Log an expense via chat"
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-linear-to-br from-teal-500/5 via-teal-500/10 to-emerald-500/5 p-4 dark:border-teal-500/30 dark:from-teal-950/30 dark:via-zinc-900 dark:to-zinc-950 shadow-xs transition-all hover:border-teal-500/40">
      {/* Decorative Glow */}
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-500/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {t.aiAdvisor.cardTitle}
              </h4>
              <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[9px] font-semibold text-teal-600 dark:bg-teal-500/25 dark:text-teal-400">
                {t.aiAdvisor.cardBadge}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
              {teaserText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpen()}
          className="shrink-0 flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <span>{t.aiAdvisor.cardAction}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Smart Contextual Action Chips */}
      {chips.length > 0 && (
        <div className="relative mt-3 pt-2.5 border-t border-teal-500/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {chips.slice(0, 2).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleOpen(chip)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 border border-teal-500/20 hover:border-teal-500/40 text-[11px] font-medium text-teal-700 dark:text-teal-300 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
