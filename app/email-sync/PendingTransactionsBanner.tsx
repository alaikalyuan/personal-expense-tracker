"use client";

import { useState, useTransition } from "react";
import {
  PendingEmailTransaction,
  approveEmailTransaction,
  dismissEmailTransaction,
} from "./actions";
import { formatMoney } from "@/utils/money";
import {
  Check,
  X,
  Mail,
  SlidersHorizontal,
  Wallet,
  Tag,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import type { CategoryKey } from "@/utils/i18n/dictionaries";

interface PendingTransactionsBannerProps {
  initialTransactions: PendingEmailTransaction[];
  spendingWallets?: Array<{ id: string; name: string; emoji: string; is_primary: boolean }>;
  onCountChange?: (count: number) => void;
}

export default function PendingTransactionsBanner({
  initialTransactions,
  spendingWallets = [],
  onCountChange,
}: PendingTransactionsBannerProps) {
  const [transactions, setTransactions] = useState<PendingEmailTransaction[]>(initialTransactions);
  const [selectedTx, setSelectedTx] = useState<PendingEmailTransaction | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("primary");
  const [selectedCategory, setSelectedCategory] = useState<string>("Food & Dining");
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { t, currency } = useTranslation();

  if (transactions.length === 0) return null;

  const currentTx = transactions[0];
  const targetWallet = spendingWallets.find((w) => w.id === currentTx.target_wallet_id);

  const handleQuickApprove = (tx: PendingEmailTransaction) => {
    setActionLoadingId(tx.id);
    startTransition(async () => {
      try {
        await approveEmailTransaction(tx.id);
        const remaining = transactions.filter((item) => item.id !== tx.id);
        setTransactions(remaining);
        if (onCountChange) onCountChange(remaining.length);
      } catch (err) {
        console.error("Failed to approve transaction:", err);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const handleDismiss = (txId: string) => {
    setActionLoadingId(txId);
    startTransition(async () => {
      try {
        await dismissEmailTransaction(txId);
        const remaining = transactions.filter((item) => item.id !== txId);
        setTransactions(remaining);
        if (onCountChange) onCountChange(remaining.length);
        if (selectedTx?.id === txId) setSelectedTx(null);
      } catch (err) {
        console.error("Failed to dismiss transaction:", err);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  const openReviewModal = (tx: PendingEmailTransaction) => {
    setSelectedTx(tx);
    setSelectedCategory(tx.suggested_category || "Food & Dining");
    setSelectedWalletId(tx.target_wallet_id || "primary");
  };

  const handleModalConfirm = () => {
    if (!selectedTx) return;
    setActionLoadingId(selectedTx.id);
    startTransition(async () => {
      try {
        await approveEmailTransaction(selectedTx.id, {
          category: selectedCategory,
          walletId: selectedWalletId === "primary" ? null : selectedWalletId,
        });
        const remaining = transactions.filter((item) => item.id !== selectedTx.id);
        setTransactions(remaining);
        if (onCountChange) onCountChange(remaining.length);
        setSelectedTx(null);
      } catch (err) {
        console.error("Failed to approve transaction in modal:", err);
      } finally {
        setActionLoadingId(null);
      }
    });
  };

  return (
    <>
      <div className="mb-4 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 p-4 shadow-xs dark:border-amber-900/40 dark:from-amber-950/25 dark:via-zinc-900 dark:to-amber-950/20">
        {/* Row 1: Header (Source badge, Merchant & Amount) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
                  {t.emailSync.bannerTitle}
                </span>
                {transactions.length > 1 && (
                  <span className="shrink-0 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                    {t.emailSync.bannerMore.replace("{count}", String(transactions.length - 1))}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {currentTx.merchant_name}
              </h4>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formatMoney(currentTx.amount, (currentTx.currency as any) || "IDR")}
            </span>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {currentTx.transaction_date}
              {currentTx.transaction_time ? ` • ${currentTx.transaction_time.slice(0, 5)}` : ""}
            </div>
          </div>
        </div>

        {/* Row 2: Metadata (Category & Destination Saku) */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-amber-200/60 pt-2.5 dark:border-amber-900/30">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 min-w-0 truncate">
            <Tag className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate rounded-md bg-white/70 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {t.categories[currentTx.suggested_category as CategoryKey] || currentTx.suggested_category}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            <Wallet className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {targetWallet?.name || t.emailSync.primarySakuDefault}
            </span>
          </div>
        </div>

        {/* Row 3: Dedicated Action Buttons (Zero overflow, thumb-friendly 3-column layout) */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDismiss(currentTx.id)}
            disabled={isPending && actionLoadingId === currentTx.id}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/60 py-2 px-2 text-xs font-semibold text-zinc-600 hover:bg-white hover:text-zinc-900 active:scale-97 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.emailSync.bannerDismiss}</span>
          </button>

          <button
            type="button"
            onClick={() => openReviewModal(currentTx)}
            className="flex items-center justify-center gap-1 rounded-xl border border-zinc-200/80 bg-white/90 py-2 px-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-white active:scale-97 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <span className="truncate">{t.emailSync.bannerEdit}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickApprove(currentTx)}
            disabled={isPending && actionLoadingId === currentTx.id}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 px-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-97 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600 cursor-pointer"
          >
            {isPending && actionLoadingId === currentTx.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <Check className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{t.emailSync.bannerRecord}</span>
          </button>
        </div>
      </div>

      {/* Review & Edit Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t.emailSync.reviewModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.emailSync.merchantLabel}
                </label>
                <div className="mt-1 font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {selectedTx.merchant_name}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.emailSync.amountLabel}
                </label>
                <div className="mt-1 font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                  {formatMoney(selectedTx.amount, (selectedTx.currency as any) || "IDR")}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.emailSync.categoryLabel}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <option value="Food & Dining">🍔 {t.categories["Food & Dining"]}</option>
                  <option value="Transportation">🛵 {t.categories["Transportation"]}</option>
                  <option value="Utilities">💡 {t.categories["Utilities"]}</option>
                  <option value="Academics">📚 {t.categories["Academics"]}</option>
                  <option value="Entertainment">🎬 {t.categories["Entertainment"]}</option>
                  <option value="Others">📦 {t.categories["Others"]}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.emailSync.sakuLabel}
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <option value="primary">👛 {t.emailSync.primarySakuDefault}</option>
                  {spendingWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.emoji} {wallet.name} {wallet.is_primary ? `(${t.emailSync.primarySakuDefault})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-zinc-50 p-2.5 text-[11px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 space-y-1">
                <div>📅 {t.emailSync.dateLabel}: {selectedTx.transaction_date}</div>
                {selectedTx.reference_id && (
                  <div className="font-mono text-[10px] truncate">
                    {t.emailSync.refLabel}: {selectedTx.reference_id}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDismiss(selectedTx.id)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {t.emailSync.dismissBtn}
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 cursor-pointer"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{t.emailSync.approveBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
