"use client";

import { Sparkles, ArrowRight, MessageSquareCode } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

interface AiAdvisorCardProps {
  onOpenChat: () => void;
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

  // Dynamic context teaser calculation
  let teaserText = t.aiAdvisor.cardTeaserDefault;
  if (isOverBudget) {
    teaserText =
      locale === "id"
        ? "Pengeluaran telah melebihi batas anggaran. Tanya AI untuk saran penghematan."
        : "Spending has exceeded your budget. Ask AI for immediate cost-cutting tips.";
  } else if (activeBudget > 0 && (activePeriodTotal / activeBudget) > 0.8) {
    teaserText =
      locale === "id"
        ? "Sudah mencapai 80%+ dari batas anggaran. Cek rekomendasi menjaga sisa dana."
        : "Over 80% of budget consumed. Check AI recommendations to pace your spending.";
  } else if (topCategoryName && topCategoryName !== t.common.none) {
    teaserText =
      locale === "id"
        ? `Pengeluaran terbesar di ${topCategoryName}. Tanya AI untuk tinjauan alokasi.`
        : `Largest spend is in ${topCategoryName}. Ask AI for allocation insights.`;
  }

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
          onClick={onOpenChat}
          className="shrink-0 flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <span>{t.aiAdvisor.cardAction}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
