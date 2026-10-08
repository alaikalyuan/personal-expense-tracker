"use client";

import Link from "next/link";
import {
  Pencil,
  Archive,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { WalletBalance } from "@/utils/wallets/server";

interface SakuCardProps {
  wallet: WalletBalance;
  currentSpendThisWeek?: number;
  onEdit: (w: WalletBalance) => void;
  onArchive: (id: string) => void;
}

export default function SakuCard({
  wallet,
  currentSpendThisWeek = 0,
  onEdit,
  onArchive,
}: SakuCardProps) {
  const { t, formatCurrency } = useTranslation();

  const isSpending = wallet.kind === "spending";
  const weeklyBudget = Number(wallet.weekly_budget || 0);
  const percentSpent = weeklyBudget > 0 ? Math.min(100, Math.round((currentSpendThisWeek / weeklyBudget) * 100)) : 0;
  const isOverBudget = weeklyBudget > 0 && currentSpendThisWeek > weeklyBudget;

  const detailHref = isSpending ? `/saku/${wallet.id}` : wallet.is_primary ? `/savings` : `/saku/${wallet.id}`;

  return (
    <div className="group rounded-3xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
      {/* Accent Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: wallet.color || (isSpending ? "#10b981" : "#0d9488") }}
      />

      <div>
        {/* Header: Emoji, Name, Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs"
              style={{
                backgroundColor: `${wallet.color || (isSpending ? "#10b981" : "#0d9488")}18`,
                border: `1px solid ${wallet.color || (isSpending ? "#10b981" : "#0d9488")}30`,
              }}
            >
              {wallet.emoji || (isSpending ? "👛" : "🏦")}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {wallet.name}
                </h3>
                {wallet.is_primary && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    {t.saku.primaryBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {isSpending ? "Saku Belanja" : "Saku Tabungan"}
              </p>
            </div>
          </div>

          {/* Quick Edit Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(wallet)}
              title={t.saku.editSaku}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {!wallet.is_primary && (
              <button
                type="button"
                onClick={() => onArchive(wallet.id)}
                title={t.saku.archive}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        {isSpending ? (
          <div className="space-y-3 my-2">
            {/* Live Balance if tracked */}
            {wallet.track_balance && (
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  {t.saku.currentBalance}
                </span>
                <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(wallet.current_balance)}
                </div>
              </div>
            )}

            {/* Weekly Budget Progress */}
            {weeklyBudget > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {t.saku.spentThisWeek}: {formatCurrency(currentSpendThisWeek)}
                  </span>
                  <span className={isOverBudget ? "text-rose-600 font-bold" : "text-zinc-700 dark:text-zinc-300"}>
                    {percentSpent}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget ? "bg-rose-500" : percentSpent > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentSpent}%` }}
                  />
                </div>

                <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Target: {formatCurrency(weeklyBudget)} / mgg</span>
                  {weeklyBudget - currentSpendThisWeek > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Sisa {formatCurrency(weeklyBudget - currentSpendThisWeek)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 italic py-1">
                Belum ada batasan anggaran
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 my-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                {t.saku.currentBalance}
              </span>
              <div className="text-xl font-black tracking-tight text-teal-600 dark:text-teal-400">
                {formatCurrency(wallet.current_balance)}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Pos simpanan & target impian Anda
            </p>
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
        <Link
          href={detailHref}
          className="flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors group-hover:translate-x-0.5"
        >
          <span>{isSpending ? "Buka Catatan Belanja" : "Kelola Tabungan & Target"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
