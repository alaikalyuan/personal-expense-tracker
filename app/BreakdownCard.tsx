"use client";

import { useState } from "react";
import { Calendar, CalendarRange, PieChart, ChevronDown } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

export interface DaySpend {
  dayName: string;
  dateStr: string;
  formattedDate: string;
  amount: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekSpend {
  weekLabel: string;
  dateRange: string;
  amount: number;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

interface BreakdownCardProps {
  period?: "week" | "month";
  dailyData?: DaySpend[];
  weeklyChunks?: WeekSpend[];
  categoryData: CategorySpend[];
  weeklyTotal: number;
}

const categoryBgColors: Record<string, string> = {
  "Food & Dining": "bg-green-500",
  Transportation: "bg-blue-500",
  Utilities: "bg-yellow-500",
  Academics: "bg-purple-500",
  Entertainment: "bg-pink-500",
  Others: "bg-zinc-500",
};

export default function BreakdownCard({
  period = "week",
  dailyData = [],
  weeklyChunks = [],
  categoryData,
  weeklyTotal,
}: BreakdownCardProps) {
  const { t, getCategoryLabel, formatCurrency } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"bar" | "category">("bar");
  const isMonth = period === "month";

  // For weekly mode: default selected day is today
  const todayIndex = dailyData.findIndex((d) => d.isToday);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayIndex !== -1 ? todayIndex : 0
  );

  // For monthly mode: default selected week is current week
  const currentWeekIndex = weeklyChunks.findIndex((w) => w.isCurrent);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(
    currentWeekIndex !== -1 ? currentWeekIndex : 0
  );

  const maxDailyAmount = Math.max(...dailyData.map((d) => d.amount), 0);
  const maxWeeklyAmount = Math.max(...weeklyChunks.map((w) => w.amount), 0);

  const selectedDay = dailyData[selectedDayIndex] || dailyData[0];
  const selectedWeek = weeklyChunks[selectedWeekIndex] || weeklyChunks[0];

  // Find peak day / week
  const peakDay =
    maxDailyAmount > 0
      ? dailyData.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev))
      : null;
  const peakWeek =
    maxWeeklyAmount > 0
      ? weeklyChunks.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev))
      : null;

  return (
    <section className="rounded-2xl border border-line bg-card">
      {/* The whole header row opens and closes the card. */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left hover:bg-paper active:bg-line"
      >
        <span className="min-w-0">
          <span className="block text-base font-bold text-ink">
            {isMonth ? t.home.insightsMonth : t.home.insightsWeek}
          </span>
          {!isExpanded && (
            <span className="block truncate text-xs text-ink-soft">
              {t.breakdown.totalAmount} {formatCurrency(weeklyTotal)}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink-soft transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div className="px-4">
          <div role="group" aria-label={t.breakdown.title} className="flex rounded-xl border border-line bg-paper p-1">
            <button
              type="button"
              aria-pressed={activeTab === "bar"}
              onClick={() => setActiveTab("bar")}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
                activeTab === "bar" ? "bg-card text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {isMonth ? (
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Calendar className="h-4 w-4" aria-hidden="true" />
              )}
              {isMonth ? t.breakdown.tabWeekly : t.breakdown.tabDaily}
            </button>
            <button
              type="button"
              aria-pressed={activeTab === "category"}
              onClick={() => setActiveTab("category")}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
                activeTab === "category" ? "bg-card text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <PieChart className="h-4 w-4" aria-hidden="true" />
              {t.breakdown.tabCategories}
            </button>
          </div>
        </div>
      )}

      {/* Content is only rendered while the card is open. */}
      <div className={isExpanded ? "px-4 pb-4" : "hidden"}>
        <div>
          <div className="pt-3">
            {/* Tab 1: Mini Bar Chart (Daily for week, Weekly for month) */}
            {activeTab === "bar" && (
              <div className="animate-fade-in">
                {isMonth ? (
                  /* Monthly Mode: Weekly Chunks Bar Chart */
                  <>
                    <div className="flex items-end justify-between gap-2 px-1">
                      {weeklyChunks.map((week, idx) => {
                        const heightPercent =
                          maxWeeklyAmount > 0
                            ? Math.max(Math.round((week.amount / maxWeeklyAmount) * 100), 6)
                            : 6;
                        const isSelected = selectedWeekIndex === idx;

                        return (
                          <button
                            type="button"
                            key={week.weekLabel}
                            onClick={() => setSelectedWeekIndex(idx)}
                            className={`flex-1 flex flex-col items-center cursor-pointer group focus:outline-hidden ${
                              week.isFuture ? "opacity-35" : "opacity-100"
                            }`}
                            aria-label={`${week.weekLabel}: ${formatCurrency(week.amount)}`}
                          >
                            <div className="h-5 flex items-center justify-center">
                              <span
                                className={`text-xs font-medium leading-none transition-all truncate ${
                                  isSelected
                                    ? "opacity-100 text-zinc-900 dark:text-zinc-200 font-semibold"
                                    : "opacity-0 group-hover:opacity-100 text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {week.amount > 0
                                  ? week.amount >= 1000
                                    ? `${Math.round(week.amount / 1000)}k`
                                    : `${week.amount}`
                                  : "0"}
                              </span>
                            </div>

                            <div className="w-full h-24 flex items-end my-1">
                              <div
                                style={{ height: `${week.amount > 0 ? heightPercent : 6}%` }}
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  week.isCurrent
                                    ? isSelected
                                      ? "bg-emerald-500 shadow-md shadow-emerald-500/30 dark:bg-emerald-400"
                                      : "bg-emerald-500/80 hover:bg-emerald-500"
                                    : isSelected
                                    ? "bg-blue-500 shadow-md shadow-blue-500/30 dark:bg-blue-400"
                                    : week.amount > 0
                                    ? "bg-blue-600/70 hover:bg-blue-500"
                                    : "bg-zinc-200 dark:bg-zinc-800"
                                }`}
                              />
                            </div>

                            <span
                              className={`text-xs pt-0.5 ${
                                week.isCurrent
                                  ? "font-bold text-emerald-600 dark:text-emerald-400"
                                  : isSelected
                                  ? "font-semibold text-zinc-900 dark:text-zinc-200"
                                  : "text-zinc-500"
                              }`}
                            >
                              {week.weekLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedWeek && (
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/60 pt-2.5 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {selectedWeek.weekLabel} ({selectedWeek.dateRange})
                          {selectedWeek.isCurrent && (
                            <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              ({t.dashboard.tabThisWeek})
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                          {formatCurrency(selectedWeek.amount)}
                        </span>
                      </div>
                    )}
                    {peakWeek && peakWeek.amount > 0 && (
                      <p className="mt-1 text-xs text-zinc-500 text-center">
                        {t.breakdown.peakDay}: {peakWeek.weekLabel} ({formatCurrency(peakWeek.amount)})
                      </p>
                    )}
                  </>
                ) : (
                  /* Weekly Mode: 7 Days Bar Chart */
                  <>
                    <div className="flex items-end justify-between gap-2 px-1">
                      {dailyData.map((day, idx) => {
                        const heightPercent =
                          maxDailyAmount > 0
                            ? Math.max(Math.round((day.amount / maxDailyAmount) * 100), 6)
                            : 6;

                        const isSelected = selectedDayIndex === idx;

                        return (
                          <button
                            type="button"
                            key={day.dateStr}
                            onClick={() => setSelectedDayIndex(idx)}
                            className={`flex-1 flex flex-col items-center cursor-pointer group focus:outline-hidden ${
                              day.isFuture ? "opacity-35" : "opacity-100"
                            }`}
                            aria-label={`${day.dayName}: ${formatCurrency(day.amount)}`}
                          >
                            <div className="h-5 flex items-center justify-center">
                              <span
                                className={`text-xs font-medium leading-none transition-all truncate ${
                                  isSelected
                                    ? "opacity-100 text-zinc-900 dark:text-zinc-200 font-semibold"
                                    : "opacity-0 group-hover:opacity-100 text-zinc-500 dark:text-zinc-400"
                                }`}
                              >
                                {day.amount > 0
                                  ? day.amount >= 1000
                                    ? `${Math.round(day.amount / 1000)}k`
                                    : `${day.amount}`
                                  : "0"}
                              </span>
                            </div>

                            <div className="w-full h-24 flex items-end my-1">
                              <div
                                style={{ height: `${day.amount > 0 ? heightPercent : 6}%` }}
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  day.isToday
                                    ? isSelected
                                      ? "bg-emerald-500 shadow-md shadow-emerald-500/30 dark:bg-emerald-400"
                                      : "bg-emerald-500/80 hover:bg-emerald-500"
                                    : isSelected
                                    ? "bg-blue-500 shadow-md shadow-blue-500/30 dark:bg-blue-400"
                                    : day.amount > 0
                                    ? "bg-blue-600/70 hover:bg-blue-500"
                                    : "bg-zinc-200 dark:bg-zinc-800"
                                }`}
                              />
                            </div>

                            <span
                              className={`text-xs pt-0.5 ${
                                day.isToday
                                  ? "font-bold text-emerald-600 dark:text-emerald-400"
                                  : isSelected
                                  ? "font-semibold text-zinc-900 dark:text-zinc-200"
                                  : "text-zinc-500"
                              }`}
                            >
                              {day.isToday ? t.common.today : day.dayName}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedDay && (
                      <div className="mt-3 flex items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/60 pt-2.5 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {selectedDay.formattedDate}
                          {selectedDay.isToday && (
                            <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              ({t.common.today})
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                          {formatCurrency(selectedDay.amount)}
                        </span>
                      </div>
                    )}
                    {peakDay && peakDay.amount > 0 && (
                      <p className="mt-1 text-xs text-zinc-500 text-center">
                        {t.breakdown.peakDay}: {peakDay.dayName} ({formatCurrency(peakDay.amount)})
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

          {/* Tab 2: Category Breakdown Progress Bars */}
          {activeTab === "category" && (
            <div className="space-y-3 animate-fade-in">
              {categoryData.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-500">
                  {t.breakdown.noCategories}
                </p>
              ) : (
                categoryData.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            categoryBgColors[item.category] || "bg-zinc-500"
                          }`}
                        />
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">
                        {formatCurrency(item.amount)}{" "}
                        <span className="text-zinc-500 text-xs">
                          ({item.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          categoryBgColors[item.category] || "bg-zinc-500"
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
