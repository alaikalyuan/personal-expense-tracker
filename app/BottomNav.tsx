"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, Plus, PiggyBank, Layers } from "lucide-react";
import { QuickAddModal } from "./QuickAddExpense";
import { getTodayString } from "@/utils/date";
import { useTranslation } from "@/utils/i18n/context";

interface BottomNavProps {
  initialMultiSaku?: boolean;
}

export default function BottomNav({ initialMultiSaku = false }: BottomNavProps) {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const multiSaku = initialMultiSaku;
  const today = getTodayString();
  const { t } = useTranslation();

  // Do not show bottom nav on login page or split bill pages
  if (pathname === "/login" || pathname.startsWith("/split")) {
    return null;
  }

  const isTracker = pathname === "/";
  const isCompare = pathname.startsWith("/compare");
  const isSavings = pathname.startsWith("/savings");
  const isSaku = pathname.startsWith("/saku");

  return (
    <>
      {/* Soft Bottom Gradient to prevent scrolling content from clashing */}
      <div
        className="fixed bottom-0 inset-x-0 h-36 bg-linear-to-t from-zinc-100 via-zinc-100/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent pointer-events-none z-30"
        aria-hidden="true"
      />

      {/* Floating Quick-Add Button */}
      <div className="fixed bottom-20 inset-x-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)] px-4 max-w-md mx-auto flex justify-end">
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          aria-label={t.nav.addExpense}
          className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold px-4 py-2.5 text-xs sm:text-sm active:scale-95 transition-all shadow-lg shadow-zinc-950/20 dark:shadow-xl dark:shadow-black/50 cursor-pointer border border-zinc-700/20 dark:border-zinc-200/20"
        >
          <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          <span>{t.common.add}</span>
        </button>
      </div>

      {/* Floating Island Navigation Bar */}
      <div className="fixed bottom-5 inset-x-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)] px-4 max-w-md mx-auto">
        <nav
          aria-label="Bottom Navigation"
          className="pointer-events-auto w-full flex items-center gap-1.5 sm:gap-2 rounded-full border border-zinc-200/90 bg-white/95 p-1.5 sm:p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:shadow-2xl dark:shadow-black/60"
        >
          {/* Tracker Link */}
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2 px-2.5 sm:px-3 text-xs font-semibold transition-all ${
              isTracker
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Wallet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isTracker ? "text-emerald-500 dark:text-emerald-400" : ""}`} />
            <span className="truncate">{t.nav.tracker}</span>
          </Link>

          {/* Saku (if multi-saku enabled) or Savings (if single wallet) Link */}
          {multiSaku ? (
            <Link
              href="/saku"
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2 px-2.5 sm:px-3 text-xs font-semibold transition-all ${
                isSaku || isSavings
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
              }`}
            >
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSaku || isSavings ? "text-teal-500 dark:text-teal-400" : ""}`} />
              <span className="truncate">{t.saku.title}</span>
            </Link>
          ) : (
            <Link
              href="/savings"
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2 px-2.5 sm:px-3 text-xs font-semibold transition-all ${
                isSavings
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
              }`}
            >
              <PiggyBank className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSavings ? "text-teal-500 dark:text-teal-400" : ""}`} />
              <span className="truncate">{t.nav.savings}</span>
            </Link>
          )}

          {/* Compare Link */}
          <Link
            href="/compare"
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2 px-2.5 sm:px-3 text-xs font-semibold transition-all ${
              isCompare
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
            }`}
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isCompare ? "text-blue-500 dark:text-blue-400" : ""}`} />
            <span className="truncate">{t.nav.compare}</span>
          </Link>
        </nav>
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        today={today}
        multiSakuEnabled={multiSaku}
      />
    </>
  );
}
