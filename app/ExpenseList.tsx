"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, X, Search, Share2, RotateCcw } from "lucide-react";
import { updateExpense, deleteExpense } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";
import { CATEGORY_KEYS } from "@/utils/i18n/dictionaries";
import { getTodayString, getNowInTimezone } from "@/utils/date";
import { format, parseISO, subDays } from "date-fns";
import ExportShareModal from "./ExportShareModal";

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  note?: string | null;
  spent_at: string;
}

const categoryColors: Record<string, string> = {
  "Food & Dining": "border-l-green-500 dark:border-l-green-500",
  Transportation: "border-l-blue-500 dark:border-l-blue-500",
  Utilities: "border-l-yellow-500 dark:border-l-yellow-500",
  Academics: "border-l-purple-500 dark:border-l-purple-500",
  Entertainment: "border-l-pink-500 dark:border-l-pink-500",
  Others: "border-l-zinc-500 dark:border-l-zinc-500",
};

interface ExpenseListProps {
  expenses: ExpenseItem[];
  showPeriodToggle?: boolean;
  title?: string;
  weeklyBudget?: number;
  startDateStr?: string;
  endDateStr?: string;
}

export default function ExpenseList({
  expenses,
  showPeriodToggle = false,
  title,
  weeklyBudget,
  startDateStr,
  endDateStr,
}: ExpenseListProps) {
  const { t, formatDate, getCategoryLabel } = useTranslation();
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"today" | "week">("today");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const closeModal = () => {
    if (isDeleting || isUpdating) return;
    setError(null);
    setEditingExpense(null);
  };

  const todayStr = useMemo(() => getTodayString(), []);
  const yesterdayStr = useMemo(
    () => format(subDays(getNowInTimezone(), 1), "yyyy-MM-dd"),
    []
  );

  const getItemDateStr = (item: ExpenseItem) => {
    return item.spent_at.includes("T")
      ? item.spent_at.split("T")[0]
      : item.spent_at;
  };

  const todayExpenses = useMemo(() => {
    return (expenses || []).filter((item) => getItemDateStr(item) === todayStr);
  }, [expenses, todayStr]);

  // Base set of expenses for the active period
  const baseExpenses = useMemo(() => {
    if (!showPeriodToggle) return expenses || [];
    return period === "today" ? todayExpenses : expenses || [];
  }, [showPeriodToggle, period, todayExpenses, expenses]);

  // Category counts within current period
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseExpenses.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [baseExpenses]);

  // Filtered expenses based on search query and category
  const filteredExpenses = useMemo(() => {
    let result = baseExpenses;
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    return result;
  }, [baseExpenses, searchQuery, selectedCategory]);

  const hasActiveFilter = searchQuery.trim() !== "" || selectedCategory !== null;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filteredExpenses]);

  const groupedWeekExpenses = useMemo(() => {
    const groups: {
      dateStr: string;
      dayName: string;
      formattedDate: string;
      isToday: boolean;
      isYesterday: boolean;
      totalAmount: number;
      items: ExpenseItem[];
    }[] = [];

    const groupMap = new Map<string, (typeof groups)[0]>();

    filteredExpenses.forEach((item) => {
      const dateStr = getItemDateStr(item);
      if (!groupMap.has(dateStr)) {
        const isToday = dateStr === todayStr;
        const isYesterday = dateStr === yesterdayStr;
        const parsedDate = parseISO(dateStr);
        const dayName = formatDate(parsedDate, "EEEE");
        const formattedDate = formatDate(parsedDate, "d MMM");

        const group = {
          dateStr,
          dayName,
          formattedDate,
          isToday,
          isYesterday,
          totalAmount: 0,
          items: [],
        };
        groupMap.set(dateStr, group);
        groups.push(group);
      }

      const group = groupMap.get(dateStr)!;
      group.totalAmount += Number(item.amount);
      group.items.push(item);
    });

    return groups;
  }, [filteredExpenses, todayStr, yesterdayStr, formatDate]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.expenses.deleteConfirm)) {
      return;
    }
    try {
      setIsDeleting(true);
      setError(null);
      await deleteExpense(id);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      setIsUpdating(true);
      setError(null);
      await updateExpense(formData);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToUpdate);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderExpenseCard = (item: ExpenseItem) => (
    <div
      key={item.id}
      className={`flex items-center justify-between rounded-xl border border-zinc-200/80 border-l-4 bg-white p-3.5 shadow-2xs transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 ${
        categoryColors[item.category] || "border-l-zinc-500"
      }`}
    >
      <div className="flex-1 pr-3">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.category && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{getCategoryLabel(item.category)}</span>
          )}
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
          <span className="text-xs text-zinc-500">
            {formatDate(item.spent_at, "MMM d, yyyy")}
          </span>
        </div>
        {item.note && (
          <p className="text-[11px] text-zinc-500 italic mt-0.5 line-clamp-1">
            &ldquo;{item.note}&rdquo;
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {Number(item.amount) === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Rp 0 🎉
          </span>
        ) : (
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rp {Number(item.amount).toLocaleString("id-ID")}
          </span>
        )}

        {/* Accessible, Non-Distracting Edit Button */}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setEditingExpense(item);
          }}
          aria-label={`Edit ${item.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Header: Title + Action Buttons (Search Toggle, Export/Share, Segmented Period Toggle) */}
        <div className="flex items-center justify-between select-none gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title || t.dashboard.recentEntries}
          </h2>

          <div className="flex items-center gap-1.5">
            {/* Filter & Search Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-label="Toggle search and filters"
              aria-expanded={isFilterOpen}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-all cursor-pointer relative ${
                isFilterOpen || hasActiveFilter
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              {hasActiveFilter && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>

            {/* Export & Share Button */}
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              aria-label={t.expenses.shareExport}
              title={t.expenses.shareExport}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Segmented Period Toggle */}
            {showPeriodToggle && (
              <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 text-xs shrink-0 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setPeriod("today")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    period === "today"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.dashboard.tabToday}
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      period === "today"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                        : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {todayExpenses.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("week")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    period === "week"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.dashboard.tabThisWeek}
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      period === "week"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                        : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {(expenses || []).length}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Search & Category Filter Bar */}
        {(isFilterOpen || hasActiveFilter) && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200/90 bg-white/90 p-3 shadow-2xs backdrop-blur-xs dark:border-zinc-800/90 dark:bg-zinc-900/70 animate-fade-in">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.expenses.searchPlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-8.5 pr-8 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === null
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                }`}
              >
                <span>{t.expenses.allCategories}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    selectedCategory === null
                      ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900"
                      : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {baseExpenses.length}
                </span>
              </button>

              {CATEGORY_KEYS.map((catKey) => {
                const count = categoryCounts[catKey] || 0;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isSelected ? null : catKey)
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <span>{getCategoryLabel(catKey)}</span>
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                          isSelected
                            ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900"
                            : "bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Filter Summary Bar */}
            {hasActiveFilter && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                <span>
                  {t.expenses.showingFiltered
                    .replace("{count}", String(filteredExpenses.length))
                    .replace("{total}", String(baseExpenses.length))}
                  {" • "}
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Rp {filteredTotal.toLocaleString("id-ID")}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.expenses.clearSearch}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content: Either Mode-based or Plain List */}
        {!showPeriodToggle ? (
          // Plain list for archive / simple contexts
          filteredExpenses.length === 0 ? (
            hasActiveFilter ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 text-center animate-fade-in">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.expenses.noMatchingExpenses}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.expenses.clearSearch}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 py-8 text-center">
                {t.dashboard.noExpenses}
              </p>
            )
          ) : (
            <div className="flex flex-col gap-2">
              {filteredExpenses.map((item) => renderExpenseCard(item))}
            </div>
          )
        ) : period === "today" ? (
          // Today view
          filteredExpenses.length > 0 ? (
            <div className="flex flex-col gap-2 animate-fade-in">
              {filteredExpenses.map((item) => renderExpenseCard(item))}
            </div>
          ) : hasActiveFilter ? (
            <div className="rounded-2xl border border-dashed border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 text-center animate-fade-in">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.expenses.noMatchingExpenses}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.expenses.clearSearch}</span>
              </button>
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              {t.dashboard.noExpenses}
            </p>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 text-center animate-fade-in">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.dashboard.noExpensesToday}
              </p>
              <button
                type="button"
                onClick={() => setPeriod("week")}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                <span>
                  {t.dashboard.viewWeekExpenses} ({expenses.length})
                </span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          )
        ) : (
          // This Week view (Non-collapsible date-grouped)
          filteredExpenses.length === 0 ? (
            hasActiveFilter ? (
              <div className="rounded-2xl border border-dashed border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 text-center animate-fade-in">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.expenses.noMatchingExpenses}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.expenses.clearSearch}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 py-8 text-center">
                {t.dashboard.noExpenses}
              </p>
            )
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in">
              {groupedWeekExpenses.map((group) => (
                <div key={group.dateStr} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {group.isToday ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {t.common.today}
                        </span>
                      ) : group.isYesterday ? (
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                          {t.common.yesterday}
                        </span>
                      ) : (
                        <span>{group.dayName}</span>
                      )}
                      <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                      <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        {group.formattedDate}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Rp {group.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.items.map((item) => renderExpenseCard(item))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit & Delete Modal */}
      {editingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.expenses.editTitle}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.expenses.editSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting || isUpdating}
                aria-label={t.common.close}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <form
              key={editingExpense.id}
              action={handleUpdate}
              className="flex flex-col gap-3 pt-3"
            >
              <input type="hidden" name="id" value={editingExpense.id} />

              <div className="flex gap-2">
                <div className="flex w-1/2 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-500">
                  <span className="mr-2 text-sm font-semibold text-zinc-400">
                    Rp
                  </span>
                  <input
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    defaultValue={editingExpense.amount}
                    required
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-400 text-zinc-900 dark:placeholder:text-zinc-500 dark:text-zinc-100"
                  />
                </div>

                <select
                  name="category"
                  defaultValue={editingExpense.category}
                  className="w-1/2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:text-zinc-100"
                >
                  {CATEGORY_KEYS.map((catKey) => (
                    <option key={catKey} value={catKey}>
                      {getCategoryLabel(catKey)}
                    </option>
                  ))}
                </select>
              </div>

              <input
                name="spent_at"
                type="date"
                defaultValue={
                  editingExpense.spent_at.includes("T")
                    ? editingExpense.spent_at.split("T")[0]
                    : editingExpense.spent_at
                }
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 scheme-light dark:scheme-dark outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
              />

              <input
                name="name"
                type="text"
                defaultValue={editingExpense.name}
                placeholder={t.expenses.namePlaceholder}
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:text-zinc-100"
              />

              <input
                name="note"
                type="text"
                defaultValue={editingExpense.note || ""}
                placeholder={t.expenses.notePlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:text-zinc-100"
              />

              {/* Action Buttons: Delete & Save */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 mt-1">
                <button
                  type="button"
                  disabled={isDeleting || isUpdating}
                  onClick={() => handleDelete(editingExpense.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? t.common.deleting : t.common.delete}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isDeleting || isUpdating}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || isUpdating}
                    className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-4 py-2 text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? t.common.saving : t.expenses.saveChanges}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export & Share Modal */}
      <ExportShareModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        expenses={expenses || []}
        weeklyBudget={weeklyBudget}
        startDateStr={startDateStr}
        endDateStr={endDateStr}
      />
    </>
  );
}

