"use client";

import { CalendarRange, Calendar } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

interface CadenceToggleProps {
  currentCadence: "week" | "month";
  onChange: (cadence: "week" | "month") => void;
}

export default function CadenceToggle({
  currentCadence,
  onChange,
}: CadenceToggleProps) {
  const { t } = useTranslation();

  const handleSwitch = (cadence: "week" | "month") => {
    if (cadence === currentCadence) return;

    // 1. Instant UI update (0ms, no network delay)
    onChange(cadence);

    // 2. Silently update URL without triggering Next.js server roundtrip
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("period", cadence);
      window.history.replaceState(null, "", url.toString());

      // 3. Silently persist preference in cookie on client (0ms)
      document.cookie = `dashboard_cadence=${cadence}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  return (
    <div
      role="group"
      aria-label="Dashboard Period Switcher"
      className="flex items-center rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 dark:bg-zinc-900/90 dark:border-zinc-800"
    >
      {/* Weekly Pill */}
      <button
        type="button"
        onClick={() => handleSwitch("week")}
        aria-pressed={currentCadence === "week"}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          currentCadence === "week"
            ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white dark:shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{t.dashboard.cadenceWeek}</span>
      </button>

      {/* Monthly Pill */}
      <button
        type="button"
        onClick={() => handleSwitch("month")}
        aria-pressed={currentCadence === "month"}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          currentCadence === "month"
            ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white dark:shadow-sm"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <CalendarRange className="w-3.5 h-3.5 shrink-0" />
        <span>{t.dashboard.cadenceMonth}</span>
      </button>
    </div>
  );
}
