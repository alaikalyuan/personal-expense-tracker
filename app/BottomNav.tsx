"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, Plus } from "lucide-react";
import { QuickAddModal } from "./QuickAddExpense";
import { getTodayString } from "@/utils/date";
import { useTranslation } from "@/utils/i18n/context";

export default function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const today = getTodayString();
  const { t } = useTranslation();

  // Do not show bottom nav on login page
  if (pathname === "/login") {
    return null;
  }

  const isTracker = pathname === "/";
  const isCompare = pathname.startsWith("/compare");

  return (
    <>
      {/* Soft Bottom Gradient to prevent scrolling content from clashing */}
      <div
        className="fixed bottom-0 inset-x-0 h-32 bg-linear-to-t from-zinc-100 via-zinc-100/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent pointer-events-none z-30"
        aria-hidden="true"
      />

      {/* Floating Island Navigation Bar */}
      <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)] px-4">
        <nav
          aria-label="Bottom Navigation"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:shadow-2xl dark:shadow-black/60"
        >
          {/* Tracker Link */}
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
              isTracker
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Wallet className={`w-4 h-4 ${isTracker ? "text-emerald-500 dark:text-emerald-400" : ""}`} />
            {t.nav.tracker}
          </Link>

          {/* Center Quick-Add Button */}
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            aria-label={t.nav.quickAddAria || t.nav.addExpense}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold active:scale-95 transition-all shadow-md shadow-zinc-900/20 dark:shadow-lg dark:shadow-black/40 cursor-pointer mx-1"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Compare Link */}
          <Link
            href="/compare"
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
              isCompare
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
            }`}
          >
            <ArrowLeftRight className={`w-4 h-4 ${isCompare ? "text-blue-500 dark:text-blue-400" : ""}`} />
            {t.nav.compare}
          </Link>
        </nav>
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        today={today}
      />
    </>
  );
}
