"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { setSelectedSaku } from "@/app/saku/actions";
import { WalletBalance } from "@/utils/wallets/server";

interface SakuSwitcherProps {
  wallets: WalletBalance[];
  selectedSakuId: string;
  multiSakuEnabled: boolean;
}

export default function SakuSwitcher({
  wallets,
  selectedSakuId,
  multiSakuEnabled,
}: SakuSwitcherProps) {
  const { t, formatCurrency } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // If multi-saku is disabled, don't show the switcher
  if (!multiSakuEnabled || wallets.length <= 1) {
    return null;
  }

  const isAll = selectedSakuId === "all" || !selectedSakuId;
  const currentWallet = !isAll ? wallets.find((w) => w.id === selectedSakuId) : null;

  const handleSelect = (id: string) => {
    setIsOpen(false);
    startTransition(async () => {
      await setSelectedSaku(id);
    });
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
      >
        <span className="text-sm shrink-0">
          {isAll ? "🌐" : currentWallet?.emoji || "👛"}
        </span>
        <span className="max-w-[110px] sm:max-w-[130px] truncate">
          {isAll ? t.saku.allSakus : currentWallet?.name || t.saku.title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-11 z-50 w-60 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-1.5 shadow-xl shadow-zinc-950/10 dark:shadow-black/70 backdrop-blur-md animate-modal-in"
        >
          {/* All Sakus Option */}
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
              isAll
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🌐</span>
              <span>{t.saku.allSakus}</span>
            </div>
            {isAll && <Check className="w-3.5 h-3.5 text-emerald-500" />}
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {/* Individual Sakus */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {wallets.map((w) => {
              const isSelected = selectedSakuId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSelect(w.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{w.emoji || "👛"}</span>
                    <div className="min-w-0">
                      <div className="truncate text-zinc-900 dark:text-zinc-100">
                        {w.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-normal">
                        {w.kind === "spending"
                          ? w.weekly_budget
                            ? `Budget: ${formatCurrency(w.weekly_budget)}`
                            : "Saku Belanja"
                          : `Saldo: ${formatCurrency(w.current_balance)}`}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
