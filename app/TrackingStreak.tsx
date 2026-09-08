"use client";

import { useState, useEffect } from "react";
import { Flame, CheckCircle2, Sparkles, X } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { StreakData } from "@/utils/streak";
import { logNoSpendDay } from "@/app/actions";

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

  // Handle Escape key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
        aria-label={`Open ${streakBadgeLabel}`}
        className={`group flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer ${
          currentStreak > 0
            ? hasLoggedToday
              ? "border-amber-200/90 bg-amber-50/80 text-amber-900 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
              : "border-orange-200 bg-orange-50/90 text-orange-900 hover:bg-orange-100 hover:border-orange-300 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70"
            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <Flame
          className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
            currentStreak > 0
              ? hasLoggedToday
                ? "fill-amber-500 text-amber-500"
                : "fill-orange-500 text-orange-500 animate-pulse"
              : "text-zinc-400"
          }`}
        />
        <span className="tracking-tight">{streakBadgeLabel}</span>
        {!hasLoggedToday && currentStreak > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
        )}
      </button>

      {/* Streak Screen / Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isLoggingZeroSpend) {
              setIsOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in overflow-hidden">
            {/* Ambient decorative glow */}
            <div
              className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-linear-to-bl from-orange-400/20 via-amber-400/10 to-transparent blur-2xl dark:from-orange-500/20"
              aria-hidden="true"
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <Flame className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.streak.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {daysLoggedThisWeek} / {totalDaysThisWeekSoFar || 1}{" "}
                    {locale === "id" ? "hari aktif minggu ini" : "active days this week"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Streak Counter Hero */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-3 transition-transform ${
                  currentStreak > 0
                    ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                <Flame
                  className={`w-9 h-9 ${
                    currentStreak > 0 ? "fill-white text-white animate-pulse" : ""
                  }`}
                />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                {currentStreak}{" "}
                <span className="text-lg font-bold text-zinc-600 dark:text-zinc-400">
                  {currentStreak === 1 ? t.streak.dayStreak : t.streak.daysStreak}
                </span>
              </h2>

              <div className="mt-2">
                {hasLoggedToday ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {t.streak.loggedToday}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/80 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/40 dark:border-orange-800/60 dark:text-orange-300">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                    {t.streak.logTodayNudge}
                  </span>
                )}
              </div>
            </div>

            {/* 7-Day Consistency Tracker (Monday to Sunday) */}
            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3.5 dark:border-zinc-800/70 dark:bg-zinc-950/40">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 text-center">
                {t.streak.weekConsistency}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDaysStatus.map((day) => {
                  const isCompleted = day.isLogged;
                  const isTodayPending = day.isToday && !day.isLogged;

                  return (
                    <div
                      key={day.dateStr}
                      className="flex flex-col items-center gap-1 py-1"
                      title={`${day.dayName} (${day.dateStr}): ${
                        isCompleted
                          ? "Tercatat / Logged"
                          : day.isFuture
                          ? "Mendatang / Upcoming"
                          : "Belum dicatat / Not logged"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold ${
                          day.isToday
                            ? "text-orange-600 dark:text-orange-400 font-bold"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {day.dayLabel}
                      </span>

                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          isCompleted
                            ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs"
                            : isTodayPending
                            ? "border-2 border-dashed border-orange-400 bg-orange-50/50 text-orange-600 dark:border-orange-500 dark:bg-orange-950/20 dark:text-orange-400 animate-pulse"
                            : day.isFuture
                            ? "border border-dashed border-zinc-200 bg-transparent text-transparent dark:border-zinc-800"
                            : "border border-zinc-200/80 bg-zinc-200/60 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-600"
                        }`}
                      >
                        {isCompleted ? (
                          <Flame className="w-3.5 h-3.5 fill-white" />
                        ) : isTodayPending ? (
                          <span className="text-[10px] font-bold">•</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick 1-tap "No-Spend Day" Action */}
            {!hasLoggedToday && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleNoSpendClick}
                  disabled={isLoggingZeroSpend}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 active:scale-98 transition-all dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.streak.noSpendButton}</span>
                </button>
                <p className="text-[10px] text-zinc-500 text-center mt-1">
                  {t.streak.noSpendDescription}
                </p>
              </div>
            )}

            {/* Motivational Affirmation */}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50/60 p-2.5 text-[11px] text-amber-900 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-800/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isOverBudget
                  ? t.streak.encouragementOverBudget
                  : currentStreak > 0
                  ? t.streak.encouragementActive
                  : t.streak.encouragementStart}
              </p>
            </div>

            {/* Toast feedback for No-Spend logging */}
            {showSuccessToast && (
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-zinc-900 py-2.5 px-3 text-center text-xs font-medium text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-950 animate-modal-in">
                {t.streak.noSpendToast}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
