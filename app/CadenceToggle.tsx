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

  const segment = (active: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
      active ? "bg-card text-ink" : "text-ink-soft hover:text-ink"
    }`;

  return (
    <div role="group" aria-label={t.home.periodLabel} className="flex rounded-xl border border-line bg-paper p-1">
      <button type="button" onClick={() => handleSwitch("week")} aria-pressed={currentCadence === "week"} className={segment(currentCadence === "week")}>
        <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.dashboard.cadenceWeek}</span>
      </button>
      <button type="button" onClick={() => handleSwitch("month")} aria-pressed={currentCadence === "month"} className={segment(currentCadence === "month")}>
        <CalendarRange className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.dashboard.cadenceMonth}</span>
      </button>
    </div>
  );
}
