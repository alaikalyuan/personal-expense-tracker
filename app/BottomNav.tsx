"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowLeftRight, Plus } from "lucide-react";
import { QuickAddModal } from "./QuickAddExpense";
import { getTodayString } from "@/utils/date";

export default function BottomNav() {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const today = getTodayString();

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
        className="fixed bottom-0 inset-x-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-30"
        aria-hidden="true"
      />

      {/* Floating Island Navigation Bar */}
      <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)] px-4">
        <nav
          aria-label="Bottom Navigation"
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-800/90 bg-zinc-900/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-md"
        >
          {/* Tracker Link */}
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
              isTracker
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Wallet className={`w-4 h-4 ${isTracker ? "text-emerald-400" : ""}`} />
            Tracker
          </Link>

          {/* Center Quick-Add Button */}
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            aria-label="Add expense"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-lg shadow-black/40 cursor-pointer mx-1"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Compare Link */}
          <Link
            href="/compare"
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
              isCompare
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <ArrowLeftRight className={`w-4 h-4 ${isCompare ? "text-blue-400" : ""}`} />
            Compare
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
