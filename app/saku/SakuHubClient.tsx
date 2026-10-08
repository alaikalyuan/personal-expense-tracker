"use client";

import { useState } from "react";
import {
  Plus,
  ArrowLeftRight,
  Coins,
  Layers,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { WalletBalance } from "@/utils/wallets/server";
import SakuCard from "./SakuCard";
import SakuFormModal from "./SakuFormModal";
import TransferModal from "./TransferModal";
import IncomeModal from "./IncomeModal";
import { archiveWallet } from "./actions";
import UserMenu from "@/app/UserMenu";

interface SakuHubClientProps {
  wallets: WalletBalance[];
  weeklySpendingMap: Record<string, number>;
  isGuest?: boolean;
}

export default function SakuHubClient({
  wallets,
  weeklySpendingMap,
  isGuest = false,
}: SakuHubClientProps) {
  const { t, formatCurrency } = useTranslation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<WalletBalance | null>(null);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState<string | undefined>(undefined);

  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [incomeTargetId, setIncomeTargetId] = useState<string | undefined>(undefined);

  const spendingWallets = wallets.filter((w) => w.kind === "spending");
  const stashWallets = wallets.filter((w) => w.kind === "stash");

  // Net Worth: All stash balances + any spending balances that track balance
  const totalNetWorth = wallets.reduce((sum, w) => {
    if (w.kind === "stash" || w.track_balance) {
      return sum + Number(w.current_balance || 0);
    }
    return sum;
  }, 0);

  const handleEdit = (w: WalletBalance) => {
    setSelectedWalletForEdit(w);
    setIsFormOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin mengarsipkan saku ini?")) {
      try {
        await archiveWallet(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : t.common.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 pb-32">
      {/* Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Top Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Layers className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {t.saku.title}
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.saku.subtitle}
            </p>
          </div>

          <UserMenu isGuest={isGuest} multiSakuEnabled={true} />
        </header>

        {/* Hero Card: Total Net Worth */}
        <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm relative overflow-hidden backdrop-blur-md">
          <div className="relative z-10">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-400">
              {t.saku.netWorth}
            </span>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              {formatCurrency(totalNetWorth)}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span>👛</span> {spendingWallets.length} Belanja
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
                <span>🏦</span> {stashWallets.length} Tabungan
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedWalletForEdit(null);
              setIsFormOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-2xs active:scale-95 transition-all cursor-pointer text-center"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
              {t.saku.addSaku}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransferFromId(wallets[0]?.id);
              setIsTransferOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-2xs active:scale-95 transition-all cursor-pointer text-center"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
              {t.saku.transfer}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIncomeTargetId(wallets[0]?.id);
              setIsIncomeOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-2xs active:scale-95 transition-all cursor-pointer text-center"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
              {t.saku.recordIncome}
            </span>
          </button>
        </div>

        {/* Section 1: Saku Belanja */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t.saku.spendingSakus} ({spendingWallets.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {spendingWallets.map((wallet) => (
              <SakuCard
                key={wallet.id}
                wallet={wallet}
                currentSpendThisWeek={weeklySpendingMap[wallet.id] || 0}
                onEdit={handleEdit}
                onArchive={handleArchive}
              />
            ))}
          </div>
        </section>

        {/* Section 2: Saku Tabungan */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t.saku.stashSakus} ({stashWallets.length})
            </h2>
          </div>

          <div className="grid gap-3">
            {stashWallets.map((wallet) => (
              <SakuCard
                key={wallet.id}
                wallet={wallet}
                onEdit={handleEdit}
                onArchive={handleArchive}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      <SakuFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        wallet={selectedWalletForEdit}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        wallets={wallets}
        defaultFromId={transferFromId}
      />

      <IncomeModal
        isOpen={isIncomeOpen}
        onClose={() => setIsIncomeOpen(false)}
        wallets={wallets}
        defaultWalletId={incomeTargetId}
      />
    </div>
  );
}
