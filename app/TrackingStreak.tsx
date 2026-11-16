"use client";

import { useState } from "react";
import { Flame, CheckCircle2, Sparkles } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { StreakData } from "@/utils/streak";
import { logNoSpendDay } from "@/app/actions";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";

interface TrackingStreakProps {
  streakData: StreakData;
  isOverBudget?: boolean;
}

export default function TrackingStreak({
  streakData,
  isOverBudget = false,
}: TrackingStreakProps) {
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingZeroSpend, setIsLoggingZeroSpend] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const {
    currentStreak,
    hasLoggedToday,
    daysLoggedThisWeek,
    totalDaysThisWeekSoFar,
    weekDaysStatus,
  } = streakData;

  const handleNoSpendClick = async () => {
    if (isLoggingZeroSpend) return;
    try {
      setIsLoggingZeroSpend(true);
      await logNoSpendDay(undefined, locale);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error("Failed to log zero spend day", err);
    } finally {
      setIsLoggingZeroSpend(false);
    }
  };

  const streakBadgeLabel = `${currentStreak} ${
    currentStreak === 1 ? t.streak.dayStreak : t.streak.daysStreak
  }`;

  return (
    <>
      {/* Compact Top-Right Badge Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={streakBadgeLabel}
        aria-haspopup="dialog"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-sm font-bold text-ink hover:bg-paper active:bg-line"
      >
        {/* The flame fills in once today has an entry, so the icon itself says "done for today". */}
        <Flame
          className={`h-5 w-5 ${
            currentStreak > 0 ? (hasLoggedToday ? "fill-accent text-accent" : "text-accent") : "text-ink-soft"
          }`}
          aria-hidden="true"
        />
        <span aria-hidden="true">{currentStreak}</span>
      </button>

      {/* Streak details */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        busy={isLoggingZeroSpend}
        title={t.streak.title}
        description={`${daysLoggedThisWeek} / ${totalDaysThisWeekSoFar || 1} ${
          locale === "id" ? "hari aktif minggu ini" : "active days this week"
        }`}
        closeLabel={t.common.close}
      >
        <div className="flex flex-col items-center justify-center pb-5 pt-2 text-center">
          <div
            aria-hidden="true"
            className={`mb-3 flex h-16 w-16 items-center justify-center rounded-2xl ${
              currentStreak > 0
                ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                : "bg-paper text-ink-soft"
            }`}
          >
            <Flame className={`h-9 w-9 ${currentStreak > 0 ? "fill-white text-white motion-safe:animate-pulse" : ""}`} />
          </div>

          <p className="text-2xl font-extrabold tracking-tight text-ink">
            {currentStreak}{" "}
            <span className="text-lg font-bold text-ink-soft">
              {currentStreak === 1 ? t.streak.dayStreak : t.streak.daysStreak}
            </span>
          </p>

          <div className="mt-2">
            {hasLoggedToday ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                {t.streak.loggedToday}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange-500 motion-safe:animate-ping" />
                {t.streak.logTodayNudge}
              </span>
            )}
          </div>
        </div>

        {/* Monday to Sunday. Each day says its state in words; the circle is only a picture of it. */}
        <div className="rounded-xl border border-line bg-paper p-3.5">
          <h3 id="streak-week" className="mb-2 text-center text-xs font-semibold text-ink-soft">
            {t.streak.weekConsistency}
          </h3>
          <ol aria-labelledby="streak-week" className="grid grid-cols-7 gap-1 text-center">
            {weekDaysStatus.map((day) => {
              const isCompleted = day.isLogged;
              const isTodayPending = day.isToday && !day.isLogged;
              const state = isCompleted ? t.streak.dayLogged : day.isFuture ? t.streak.dayUpcoming : t.streak.dayNotLogged;

              return (
                <li key={day.dateStr} className="flex flex-col items-center gap-1 py-1">
                  <span
                    aria-hidden="true"
                    className={`text-xs font-semibold ${day.isToday ? "font-bold text-orange-700 dark:text-orange-400" : "text-ink-soft"}`}
                  >
                    {day.dayLabel}
                  </span>
                  <span className="sr-only">{`${day.dayName}, ${day.dateStr}: ${state}`}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isCompleted
                        ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs"
                        : isTodayPending
                        ? "border-2 border-dashed border-orange-500 bg-orange-50/50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                        : day.isFuture
                        ? "border border-dashed border-line bg-transparent text-transparent"
                        : "border border-line bg-line/60 text-ink-soft"
                    }`}
                  >
                    {isCompleted ? <Flame className="h-3.5 w-3.5 fill-white" /> : isTodayPending ? "•" : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {!hasLoggedToday && (
          <div className="mt-3">
            <Button block onClick={handleNoSpendClick} disabled={isLoggingZeroSpend} className="w-full">
              <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600" />
              {t.streak.noSpendButton}
            </Button>
            <p className="mt-1 text-center text-xs text-ink-soft">{t.streak.noSpendDescription}</p>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/60 p-2.5 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-200">
          <Sparkles aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            {isOverBudget
              ? t.streak.encouragementOverBudget
              : currentStreak > 0
              ? t.streak.encouragementActive
              : t.streak.encouragementStart}
          </p>
        </div>

        <p role="status" className={showSuccessToast ? "mt-3 rounded-xl bg-ink px-3 py-2.5 text-center text-xs font-medium text-card" : "sr-only"}>
          {showSuccessToast ? t.streak.noSpendToast : ""}
        </p>
      </Dialog>
    </>
  );
}
