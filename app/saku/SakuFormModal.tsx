"use client";

import { useState, useTransition } from "react";
import { X, Check } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { createWallet, updateWallet } from "./actions";
import { WalletBalance } from "@/utils/wallets/server";

interface SakuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletBalance | null;
}

const EMOJI_PRESETS = ["👛", "🏦", "💵", "☕", "🚗", "✈️", "💻", "🎮", "🛡️", "🏠", "🎁", "🎯"];

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#0d9488", // Teal
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#71717a", // Zinc
];

export default function SakuFormModal({
  isOpen,
  onClose,
  wallet,
}: SakuFormModalProps) {
  if (!isOpen) return null;

  return (
    <SakuFormModalContent
      key={wallet ? wallet.id : "new"}
      wallet={wallet}
      onClose={onClose}
    />
  );
}

function SakuFormModalContent({
  onClose,
  wallet,
}: {
  onClose: () => void;
  wallet?: WalletBalance | null;
}) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(wallet);

  const [name, setName] = useState(wallet?.name || "");
  const [kind, setKind] = useState<"spending" | "stash">(wallet?.kind || "spending");
  const [emoji, setEmoji] = useState(wallet?.emoji || (wallet?.kind === "stash" ? "🏦" : "👛"));
  const [color, setColor] = useState(wallet?.color || (wallet?.kind === "stash" ? "#0d9488" : "#10b981"));
  const [trackBalance, setTrackBalance] = useState(Boolean(wallet?.track_balance));
  const [openingBalance, setOpeningBalance] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState(wallet?.weekly_budget ? String(wallet.weekly_budget) : "");
  const [monthlyBudget, setMonthlyBudget] = useState(wallet?.monthly_budget ? String(wallet.monthly_budget) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.saku.name + " tidak boleh kosong.");
      return;
    }

    setError(null);
    const formData = new FormData();
    if (wallet) {
      formData.append("id", wallet.id);
    }
    formData.append("name", name.trim());
    formData.append("kind", kind);
    formData.append("emoji", emoji);
    formData.append("color", color);
    formData.append("track_balance", String(kind === "stash" ? true : trackBalance));

    if (!isEditing && openingBalance) {
      formData.append("opening_balance", openingBalance);
    }
    if (kind === "spending") {
      if (weeklyBudget) formData.append("weekly_budget", weeklyBudget);
      if (monthlyBudget) formData.append("monthly_budget", monthlyBudget);
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateWallet(formData);
        } else {
          await createWallet(formData);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isEditing ? t.saku.editSaku : t.saku.addSaku}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isEditing ? t.saku.details : t.saku.subtitle}
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
          {/* Kind Selector (Only when creating) */}
          {!isEditing ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Jenis Saku
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setKind("spending");
                    if (emoji === "🏦") setEmoji("👛");
                    if (color === "#0d9488") setColor("#10b981");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    kind === "spending"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span>👛</span>
                    <span>Saku Belanja</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">
                    Untuk jajan & anggaran rutin
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKind("stash");
                    if (emoji === "👛") setEmoji("🏦");
                    if (color === "#10b981") setColor("#0d9488");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    kind === "stash"
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 text-teal-900 dark:text-teal-100 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span>🏦</span>
                    <span>Saku Tabungan</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">
                    Untuk simpanan & target
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold">Tipe:</span>
              <span>{kind === "spending" ? "👛 Saku Belanja" : "🏦 Saku Tabungan"}</span>
            </div>
          )}

          {/* Name & Emoji */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t.saku.name}
            </label>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  className="w-11 h-11 flex items-center justify-center text-xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {emoji}
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === "spending" ? "Contoh: Jajan & Kopi, Bensin" : "Contoh: Dana Darurat, Liburan"}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Emoji Preset Chips */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Pilih Emoji
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEmoji(item)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-transform active:scale-90 ${
                    emoji === item
                      ? "bg-zinc-200 dark:bg-zinc-700 ring-2 ring-emerald-500"
                      : "bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Pilih Warna Tema
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                    color === preset ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white dark:ring-offset-zinc-900" : ""
                  }`}
                >
                  {color === preset && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Opening Balance (Only on create) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t.saku.openingBalance} <span className="text-zinc-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Spending Saku Specific Fields */}
          {kind === "spending" && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
              {/* Track Balance Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {t.saku.trackBalance}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {t.saku.trackBalanceDesc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={trackBalance}
                  onChange={(e) => setTrackBalance(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Budgets */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.saku.weeklyBudget}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                    placeholder="Contoh: 300000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.saku.monthlyBudget}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    placeholder="Contoh: 1200000"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              {isPending ? t.common.saving : isEditing ? t.common.save : t.saku.addSaku}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
