"use client";

import { useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  LayoutList,
  BarChart3,
  Flame,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

export interface DayComparisonItem {
  dayName: string;
  fullDayName: string;
  dateFormatted: string;
  thisAmt: number;
  lastAmt: number;
  diff: number;
  diffPct: number | null;
  isToday: boolean;
  isFuture: boolean;
}

export interface DailyTrendStats {
  activeDays: number;
  daysLower: number;
  daysHigher: number;
  peakDay: { dayName: string; amount: number } | null;
  bestSavingDay: { dayName: string; amount: number } | null;
}

export interface DailyTrendComparisonProps {
  dayComparison: DayComparisonItem[];
  maxDayAmount: number;
  stats: DailyTrendStats;
  dict: {
    trendTitle: string;
    thisWeek: string;
    lastWeek: string;
    viewBreakdown: string;
    viewChart: string;
    daysLower: string;
    daysHigher: string;
    allDaysEven: string;
    highestSpend: string;
    biggestSaving: string;
    upcoming: string;
    today: string;
    noSpendDay: string;
    selectedDayDetails: string;
    vs: string;
    noChange: string;
  };
}

export default function DailyTrendComparison({
  dayComparison,
  maxDayAmount,
  stats,
  dict,
}: DailyTrendComparisonProps) {
  const { formatCurrency } = useTranslation();
  const [activeTab, setActiveTab] = useState<"breakdown" | "chart">("chart");

  // Select today by default in chart view, or first day if today not in current week
  const todayIndex = dayComparison.findIndex((d) => d.isToday);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayIndex !== -1 ? todayIndex : 0
  );

  const selectedDay = dayComparison[selectedDayIndex] || dayComparison[0];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-sm">
      {/* Header with Title and Segmented View Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            {dict.trendTitle}
          </h3>
        </div>

        {/* Segmented Toggle Buttons */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              activeTab === "chart"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{dict.viewChart}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("breakdown")}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              activeTab === "breakdown"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>{dict.viewBreakdown}</span>
          </button>
        </div>
      </div>

      {/* Legend & Quick Insight Pills */}
      <div className="pt-3 space-y-2.5">
        {/* Legend */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              {dict.thisWeek}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-zinc-300 dark:bg-zinc-700 inline-block" />
              {dict.lastWeek}
            </span>
          </div>

          {stats.activeDays > 0 && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {stats.activeDays}/7 active
            </span>
          )}
        </div>

        {/* Insight Badges Row */}
        <div className="flex flex-wrap gap-1.5">
          {stats.activeDays > 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                stats.daysLower > stats.daysHigher
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                  : stats.daysHigher > stats.daysLower
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {stats.daysLower > stats.daysHigher ? (
                <TrendingDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : stats.daysHigher > stats.daysLower ? (
                <TrendingUp className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              ) : (
                <Minus className="w-3 h-3 text-zinc-500" />
              )}
              {stats.daysLower > stats.daysHigher
                ? dict.daysLower
                    .replace("{count}", String(stats.daysLower))
                    .replace("{total}", String(stats.activeDays))
                : stats.daysHigher > stats.daysLower
                ? dict.daysHigher
                    .replace("{count}", String(stats.daysHigher))
                    .replace("{total}", String(stats.activeDays))
                : dict.allDaysEven}
            </span>
          )}

          {stats.peakDay && stats.peakDay.amount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              <Flame className="w-3 h-3 text-amber-500" />
              {dict.highestSpend
                .replace("{day}", stats.peakDay.dayName)
                .replace("{amount}", formatCurrency(stats.peakDay.amount))}
            </span>
          )}

          {stats.bestSavingDay && stats.bestSavingDay.amount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              {dict.biggestSaving
                .replace("{day}", stats.bestSavingDay.dayName)
                .replace("{amount}", formatCurrency(stats.bestSavingDay.amount))}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-4">
        {activeTab === "breakdown" ? (
          /* ========================================================================= */
          /* 1. READABLE DAY-BY-DAY BREAKDOWN LIST                                     */
          /* ========================================================================= */
          <div className="space-y-2.5">
            {dayComparison.map((day) => {
              const hasDecreased = day.diff < 0;
              const hasIncreased = day.diff > 0;
              const bothZero = day.thisAmt === 0 && day.lastAmt === 0;

              // Proportional width for visual bars
              const thisBarWidth =
                maxDayAmount > 0
                  ? Math.min(Math.max(Math.round((day.thisAmt / maxDayAmount) * 100), 0), 100)
                  : 0;
              const lastBarWidth =
                maxDayAmount > 0
                  ? Math.min(Math.max(Math.round((day.lastAmt / maxDayAmount) * 100), 0), 100)
                  : 0;

              return (
                <div
                  key={day.dayName}
                  className={`rounded-xl border p-3 transition-all ${
                    day.isToday
                      ? "border-emerald-400/60 bg-emerald-50/30 dark:border-emerald-600/40 dark:bg-emerald-950/20 shadow-2xs"
                      : "border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800/60 dark:bg-zinc-950/30"
                  } ${day.isFuture ? "opacity-60" : "opacity-100"}`}
                >
                  {/* Top Row: Day Name, Badges & Delta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {day.fullDayName}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {day.dateFormatted}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white dark:bg-emerald-600">
                          {dict.today}
                        </span>
                      )}
                      {day.isFuture && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {dict.upcoming}
                        </span>
                      )}
                    </div>

                    {/* Delta Badge */}
                    <div className="text-right shrink-0">
                      {day.isFuture ? (
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                          {dict.upcoming}
                        </span>
                      ) : bothZero ? (
                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                          {dict.noSpendDay}
                        </span>
                      ) : hasDecreased ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          -{formatCurrency(Math.abs(day.diff))}
                          {day.diffPct !== null && (
                            <span className="text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90 ml-0.5">
                              ({day.diffPct}%)
                            </span>
                          )}
                        </span>
                      ) : hasIncreased ? (
                        <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          +{formatCurrency(day.diff)}
                          {day.diffPct !== null && (
                            <span className="text-[10px] font-medium text-rose-600/90 dark:text-rose-400/90 ml-0.5">
                              (+{day.diffPct}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-500">
                          {dict.noChange}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Progress Track & Amounts */}
                  <div className="mt-2.5 space-y-1.5">
                    {/* This Week Row */}
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                        {dict.thisWeek}
                      </span>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${day.isFuture ? 0 : thisBarWidth}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            day.isToday
                              ? "bg-emerald-500"
                              : day.thisAmt > 0
                              ? "bg-emerald-500/80 dark:bg-emerald-400/80"
                              : "bg-transparent"
                          }`}
                        />
                      </div>
                      <span
                        className={`w-24 text-right text-[11px] font-bold tabular-nums shrink-0 ${
                          day.isFuture
                            ? "text-zinc-400 dark:text-zinc-600 font-normal"
                            : day.thisAmt > 0
                            ? "text-zinc-900 dark:text-white"
                            : "text-zinc-400 dark:text-zinc-500 font-normal"
                        }`}
                      >
                        {day.isFuture ? "—" : formatCurrency(day.thisAmt)}
                      </span>
                    </div>

                    {/* Last Week Row */}
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                        {dict.lastWeek}
                      </span>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${lastBarWidth}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            day.lastAmt > 0
                              ? "bg-zinc-300 dark:bg-zinc-700"
                              : "bg-transparent"
                          }`}
                        />
                      </div>
                      <span
                        className={`w-24 text-right text-[11px] tabular-nums shrink-0 font-medium ${
                          day.lastAmt > 0
                            ? "text-zinc-600 dark:text-zinc-300"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {formatCurrency(day.lastAmt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. ENHANCED INTERACTIVE CHART WITH TAP-TO-INSPECT                          */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Paired Bar Chart */}
            <div className="flex items-end justify-between gap-1.5 h-32 px-1 pt-2">
              {dayComparison.map((day, idx) => {
                const thisHeight =
                  maxDayAmount > 0
                    ? Math.max(Math.round((day.thisAmt / maxDayAmount) * 100), 4)
                    : 4;
                const lastHeight =
                  maxDayAmount > 0
                    ? Math.max(Math.round((day.lastAmt / maxDayAmount) * 100), 4)
                    : 4;
                const isSelected = selectedDayIndex === idx;

                return (
                  <button
                    type="button"
                    key={day.dayName}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end rounded-lg p-1 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800/80 ring-1 ring-zinc-300 dark:ring-zinc-700"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    } ${day.isFuture ? "opacity-40" : "opacity-100"}`}
                  >
                    {/* Paired vertical bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-20">
                      {/* Last Week Bar (Zinc) */}
                      <div
                        style={{ height: `${day.lastAmt > 0 ? lastHeight : 4}%` }}
                        className="w-1/2 rounded-t-xs bg-zinc-300 dark:bg-zinc-700 transition-all"
                      />
                      {/* This Week Bar (Emerald) */}
                      <div
                        style={{ height: `${day.thisAmt > 0 ? thisHeight : 4}%` }}
                        className={`w-1/2 rounded-t-xs transition-all ${
                          day.isToday
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-emerald-500/80 dark:bg-emerald-500/70"
                        }`}
                      />
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-[10px] ${
                        day.isToday
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : isSelected
                          ? "font-semibold text-zinc-800 dark:text-zinc-200"
                          : "text-zinc-500 font-medium"
                      }`}
                    >
                      {day.isToday ? dict.today : day.dayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Detailed Card */}
            {selectedDay && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/60 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedDay.fullDayName}, {selectedDay.dateFormatted}
                    </p>
                    {selectedDay.isToday && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
                        {dict.today}
                      </span>
                    )}
                    {selectedDay.isFuture && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {dict.upcoming}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    {dict.selectedDayDetails}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-white dark:bg-zinc-900 p-2.5 border border-zinc-200/60 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {dict.thisWeek}
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedDay.isFuture
                        ? "—"
                        : formatCurrency(selectedDay.thisAmt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-zinc-900 p-2.5 border border-zinc-200/60 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {dict.lastWeek}
                    </p>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {formatCurrency(selectedDay.lastAmt)}
                    </p>
                  </div>
                </div>

                {!selectedDay.isFuture && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {dict.thisWeek} {dict.vs} {dict.lastWeek}:
                    </span>
                    {selectedDay.diff < 0 ? (
                      <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        -{formatCurrency(Math.abs(selectedDay.diff))}
                        {selectedDay.diffPct !== null && ` (${selectedDay.diffPct}%)`}
                      </span>
                    ) : selectedDay.diff > 0 ? (
                      <span className="inline-flex items-center font-bold text-rose-600 dark:text-rose-400 gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{formatCurrency(selectedDay.diff)}
                        {selectedDay.diffPct !== null && ` (+${selectedDay.diffPct}%)`}
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-medium">
                        {dict.noChange}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
