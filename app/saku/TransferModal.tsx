"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { transferBetweenWallets } from "./actions";
import { WalletBalance } from "@/utils/wallets/server";
import { getTodayString } from "@/utils/date";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletBalance[];
  defaultFromId?: string;
}

export default function TransferModal({
  isOpen,
  onClose,
  wallets,
  defaultFromId,
}: TransferModalProps) {
  const { t, formatCurrency } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialFrom = defaultFromId || wallets[0]?.id || "";
  const initialTo = wallets.find((w) => w.id !== initialFrom)?.id || "";

  const [fromWalletId, setFromWalletId] = useState(initialFrom);
  const [toWalletId, setToWalletId] = useState(initialTo);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayString());

  if (!isOpen) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Nominal transfer harus lebih besar dari 0.");
      return;
    }

    if (fromWalletId === toWalletId) {
      setError("Saku asal dan saku tujuan tidak boleh sama.");
      return;
    }

    if (fromWallet && fromWallet.track_balance && numAmount > fromWallet.current_balance) {
      setError(`Saldo saku ${fromWallet.name} tidak mencukupi (${formatCurrency(fromWallet.current_balance)}).`);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("from_wallet_id", fromWalletId);
    formData.append("to_wallet_id", toWalletId);
    formData.append("amount", String(numAmount));
    formData.append("note", note.trim() || `Transfer dari ${fromWallet?.name || "Saku"} ke ${toWallet?.name || "Saku"}`);
    formData.append("date", date);

    startTransition(async () => {
      try {
        await transferBetweenWallets(formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t.saku.transfer}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pindahkan dana antar pos saku Anda
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source and Destination Pickers */}
          <div className="grid grid-cols-2 gap-2 relative">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t.saku.fromSaku}
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === toWalletId}>
                    {w.emoji} {w.name} {w.track_balance ? `(${formatCurrency(w.current_balance)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t.saku.toSaku}
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                    {w.emoji} {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t.saku.amount}
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 150000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t.saku.note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pindah jajan ke tabungan darurat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t.saku.date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isPending ? t.common.saving : t.saku.transfer}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
