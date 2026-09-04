"use client";

import { useState } from "react";
import { ChevronDown, Calendar, Tag, Search, X } from "lucide-react";
import ExpenseList, { ExpenseItem } from "@/app/ExpenseList";
import { useTranslation } from "@/utils/i18n/context";

export interface ArchivedWeek {
  weekId: string;
  startDateStr: string;
  endDateStr: string;
  label: string;
  totalAmount: number;
  expenses: ExpenseItem[];
  topCategory: string;
}

interface ArchiveWeekListProps {
  weeks: ArchivedWeek[];
}

export default function ArchiveWeekList({ weeks }: ArchiveWeekListProps) {
  const { t, getCategoryLabel } = useTranslation();

  // Default open the most recent past week
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>(() => {
    if (weeks.length > 0) {
      return { [weeks[0].weekId]: true };
    }
    return {};
  });

  const [searchQuery, setSearchQuery] = useState("");

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekId]: !prev[weekId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    weeks.forEach((w) => {
      allExpanded[w.weekId] = true;
    });
    setExpandedWeeks(allExpanded);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  // Filter weeks and expenses if search query is present
  const filteredWeeks = weeks
    .map((week) => {
      if (!searchQuery.trim()) return week;

      const query = searchQuery.toLowerCase().trim();
      const matchingExpenses = week.expenses.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          (e.note && e.note.toLowerCase().includes(query))
      );

      return {
        ...week,
        expenses: matchingExpenses,
        totalAmount: matchingExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0),
      };
    })
    .filter((week) => week.expenses.length > 0);

  if (weeks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
        <Calendar className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">{t.archive.noArchivedWeeks}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {t.archive.noArchivedDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Bulk Toggle Controls */}
      <div className="flex flex-col gap-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.archive.searchPlaceholder}
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-8 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 shadow-2xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t.common.close}
              className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
          <span>
            {filteredWeeks.length} {filteredWeeks.length === 1 ? t.archive.weekCount : t.archive.weeksCount}
            {searchQuery && ` ${t.archive.weeksMatching} "${searchQuery}"`}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={expandAll}
              className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {t.archive.expandAll}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {t.archive.collapseAll}
            </button>
          </div>
        </div>
      </div>

      {/* Week Cards Accordion */}
      <div className="flex flex-col gap-3">
        {filteredWeeks.map((week) => {
          const isExpanded = !!expandedWeeks[week.weekId] || searchQuery.trim().length > 0;

          return (
            <div
              key={week.weekId}
              className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-sm"
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleWeek(week.weekId)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {week.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>{week.expenses.length} {week.expenses.length === 1 ? t.archive.entryCount : t.archive.entriesCount}</span>
                    {week.topCategory && week.topCategory !== "None" && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 truncate">
                          <Tag className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          {getCategoryLabel(week.topCategory)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Rp {week.totalAmount.toLocaleString("id-ID")}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-400">
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-zinc-900 dark:text-zinc-200" : "rotate-0"
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="border-t border-zinc-200/80 bg-zinc-50/50 p-3 pt-3 dark:border-zinc-800/60 dark:bg-zinc-950/40 animate-fade-in">
                  <ExpenseList expenses={week.expenses} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

