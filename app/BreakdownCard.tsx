"use client";

import { useState } from "react";
import { Calendar, PieChart, ChevronDown } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

export interface DaySpend {
  dayName: string;
  dateStr: string;
  formattedDate: string;
  amount: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

interface BreakdownCardProps {
  dailyData: DaySpend[];
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
  dailyData,
  categoryData,
  weeklyTotal,
}: BreakdownCardProps) {
  const { t, getCategoryLabel } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "category">("daily");

  // Default selected day is today, or the first day with an expense, or 0
  const todayIndex = dailyData.findIndex((d) => d.isToday);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayIndex !== -1 ? todayIndex : 0
  );

  const maxDailyAmount = Math.max(...dailyData.map((d) => d.amount), 0);
  const selectedDay = dailyData[selectedDayIndex] || dailyData[0];

  // Find peak day
  const peakDay =
    maxDailyAmount > 0
      ? dailyData.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev))
      : null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-xs transition-all duration-300">
      {/* Header with Retract / Expand Controls */}
      <div className="flex items-center justify-between select-none gap-2">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer group flex-1 min-w-0 pr-1"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 group-hover:text-zinc-100 transition-colors">
              {t.breakdown.title}
            </h3>
            <span className="text-[10px] text-zinc-500 rounded-md bg-zinc-800/60 px-1.5 py-0.5">
              {isExpanded ? t.breakdown.hide : t.breakdown.show}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {isExpanded
              ? activeTab === "daily"
                ? t.breakdown.pastSevenDays
                : `${t.breakdown.totalAmount} Rp ${weeklyTotal.toLocaleString("id-ID")}`
              : t.breakdown.summarySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Segmented Toggle */}
          {isExpanded && (
            <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs animate-fade-in">
              <button
                type="button"
                onClick={() => setActiveTab("daily")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "daily"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {t.breakdown.tabDaily}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("category")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "category"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                {t.breakdown.tabCategories}
              </button>
            </div>
          )}

          {/* Collapse / Expand Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? t.breakdown.hideBreakdownAria : t.breakdown.showBreakdownAria}
            className={`flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0 ${
              isExpanded
                ? "h-7 w-7 p-1.5"
                : "gap-1.5 py-1 px-2.5 text-xs font-medium"
            }`}
          >
            {!isExpanded && <span>{t.breakdown.show}</span>}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Retractable Content with Smooth Height Animation */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3 mt-3 border-t border-zinc-800/80">
            {/* Tab 1: Daily Mini Bar Chart */}
            {activeTab === "daily" && (
              <div className="animate-fade-in">
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
                      aria-label={`${day.dayName}: Rp ${day.amount.toLocaleString("id-ID")}`}
                    >
                      {/* Amount label above bar with dedicated height so it never clips */}
                      <div className="h-5 flex items-center justify-center">
                        <span
                          className={`text-[10px] font-medium leading-none transition-all truncate ${
                            isSelected
                              ? "opacity-100 text-zinc-200 font-semibold"
                              : "opacity-0 group-hover:opacity-100 text-zinc-400"
                          }`}
                        >
                          {day.amount > 0
                            ? day.amount >= 1000
                              ? `${Math.round(day.amount / 1000)}k`
                              : `${day.amount}`
                            : "0"}
                        </span>
                      </div>

                      {/* Vertical bar container with fixed height */}
                      <div className="w-full h-24 flex items-end my-1">
                        <div
                          style={{ height: `${day.amount > 0 ? heightPercent : 6}%` }}
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            day.isToday
                              ? isSelected
                                ? "bg-emerald-400 shadow-md shadow-emerald-500/30"
                                : "bg-emerald-500/80 hover:bg-emerald-400"
                              : isSelected
                              ? "bg-blue-400 shadow-md shadow-blue-500/30"
                              : day.amount > 0
                              ? "bg-blue-600/70 hover:bg-blue-500"
                              : "bg-zinc-800"
                          }`}
                        />
                      </div>

                      {/* Day label */}
                      <span
                        className={`text-[10px] pt-0.5 ${
                          day.isToday
                            ? "font-bold text-emerald-400"
                            : isSelected
                            ? "font-semibold text-zinc-200"
                            : "text-zinc-500"
                        }`}
                      >
                        {day.isToday ? t.common.today : day.dayName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected day summary line */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 text-[11px]">
                <span className="text-zinc-400">
                  {selectedDay.formattedDate}
                  {selectedDay.isToday && (
                    <span className="ml-1 text-[10px] text-emerald-400 font-medium">
                      ({t.common.today})
                    </span>
                  )}
                </span>
                <span className="font-semibold text-zinc-200">
                  Rp {selectedDay.amount.toLocaleString("id-ID")}
                </span>
              </div>
              {peakDay && peakDay.amount > 0 && (
                <p className="mt-1 text-[10px] text-zinc-500 text-center">
                  {t.breakdown.peakDay}: {peakDay.dayName} (Rp {peakDay.amount.toLocaleString("id-ID")})
                </p>
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
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            categoryBgColors[item.category] || "bg-zinc-500"
                          }`}
                        />
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="font-medium text-zinc-200">
                        Rp {item.amount.toLocaleString("id-ID")}{" "}
                        <span className="text-zinc-500 text-[10px]">
                          ({item.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
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
    </div>
  );
}
