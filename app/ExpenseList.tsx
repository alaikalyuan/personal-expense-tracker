"use client";

import { useState, useMemo, useId } from "react";
import { Trash2, X, Search, Share2, Tag, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { updateExpense, deleteExpense } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";
import { isExpenseExempt, cleanNote, attachExemptTag } from "@/utils/exemptions";
import { CATEGORY_KEYS } from "@/utils/i18n/dictionaries";
import { getTodayString, getNowInTimezone } from "@/utils/date";
import { format, parseISO, subDays } from "date-fns";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField, SelectField, TextField } from "@/app/ui/Field";

// Loaded only when the share sheet is first opened.
const ExportShareModal = dynamic(() => import("./ExportShareModal"), { ssr: false });

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  note?: string | null;
  spent_at: string;
  is_exempt?: boolean | null;
  wallet_id?: string | null;
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  showPeriodToggle?: boolean;
  title?: string;
  weeklyBudget?: number;
  startDateStr?: string;
  endDateStr?: string;
  dashboardPeriod?: "week" | "month";
  wallets?: Array<{ id: string; name: string; emoji?: string }>;
}

const dateOf = (item: ExpenseItem) => (item.spent_at.includes("T") ? item.spent_at.split("T")[0] : item.spent_at);

export default function ExpenseList({
  expenses,
  showPeriodToggle = false,
  title,
  weeklyBudget,
  startDateStr,
  endDateStr,
  dashboardPeriod = "week",
  wallets = [],
}: ExpenseListProps) {
  const { t, formatDate, getCategoryLabel, formatCurrency, currencySymbol, currency } = useTranslation();
  const searchId = useId();
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editIsExempt, setEditIsExempt] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"today" | "week">("today");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportLoaded, setExportLoaded] = useState(false);

  const busy = isDeleting || isUpdating;
  const all = useMemo(() => expenses || [], [expenses]);

  const todayStr = useMemo(() => getTodayString(), []);
  const yesterdayStr = useMemo(() => format(subDays(getNowInTimezone(), 1), "yyyy-MM-dd"), []);
  const todayExpenses = useMemo(() => all.filter((item) => dateOf(item) === todayStr), [all, todayStr]);

  const hasActiveFilter = searchQuery.trim() !== "" || selectedCategory !== null;

  // A search always looks through the whole period, never only today.
  const baseExpenses = useMemo(() => {
    if (!showPeriodToggle || hasActiveFilter) return all;
    return period === "today" ? todayExpenses : all;
  }, [showPeriodToggle, hasActiveFilter, period, todayExpenses, all]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    all.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [all]);

  const filteredExpenses = useMemo(() => {
    let result = baseExpenses;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || (item.note && item.note.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }
    return result;
  }, [baseExpenses, searchQuery, selectedCategory]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0),
    [filteredExpenses]
  );

  const groups = useMemo(() => {
    const map = new Map<string, { dateStr: string; label: string; total: number; items: ExpenseItem[] }>();
    filteredExpenses.forEach((item) => {
      const dateStr = dateOf(item);
      if (!map.has(dateStr)) {
        const parsed = parseISO(dateStr);
        const label =
          dateStr === todayStr
            ? t.common.today
            : dateStr === yesterdayStr
            ? t.common.yesterday
            : `${formatDate(parsed, "EEEE")}, ${formatDate(parsed, "d MMM")}`;
        map.set(dateStr, { dateStr, label, total: 0, items: [] });
      }
      const group = map.get(dateStr)!;
      group.total += Number(item.amount);
      group.items.push(item);
    });
    return Array.from(map.values());
  }, [filteredExpenses, todayStr, yesterdayStr, formatDate, t.common.today, t.common.yesterday]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const openEdit = (item: ExpenseItem) => {
    setError(null);
    setConfirmingDelete(false);
    setEditingExpense(item);
    setEditAmount(String(item.amount));
    setEditIsExempt(isExpenseExempt(item));
  };

  const closeModal = () => {
    if (busy) return;
    setError(null);
    setConfirmingDelete(false);
    setEditingExpense(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteExpense(id);
      setConfirmingDelete(false);
      setEditingExpense(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsUpdating(true);
      setError(null);
      const rawNote = (formData.get("note") as string)?.trim() || "";
      formData.set("note", attachExemptTag(rawNote, editIsExempt));
      await updateExpense(formData);
      setEditingExpense(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToUpdate);
    } finally {
      setIsUpdating(false);
    }
  };

  // One line of the receipt: the whole row opens the edit dialog.
  const renderRow = (item: ExpenseItem, showDate: boolean) => {
    const isExempt = isExpenseExempt(item);
    const note = cleanNote(item.note);
    return (
      <li key={item.id} className="border-b border-dashed border-line last:border-b-0">
        <button
          type="button"
          onClick={() => openEdit(item)}
          aria-label={t.home.editAria.replace("{name}", item.name)}
          className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper active:bg-line"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-ink">{item.name}</span>
              {isExempt && (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent-strong">
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {t.expenses.oneOffBadge}
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-ink-soft">
              {getCategoryLabel(item.category)}
              {showDate && ` · ${formatDate(item.spent_at, "d MMM")}`}
              {note && ` · ${note}`}
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold text-ink">{formatCurrency(Number(item.amount))}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
        </button>
      </li>
    );
  };

  const emptyCard = (message: string, action?: { label: string; onClick: () => void }) => (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
      <p className="text-sm text-ink-soft">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 min-h-11 rounded-xl px-3 text-sm font-semibold text-accent-strong hover:bg-paper active:bg-line"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  const showingToday = showPeriodToggle && period === "today" && !hasActiveFilter;

  let body: React.ReactNode;
  if (filteredExpenses.length === 0) {
    if (hasActiveFilter) {
      body = emptyCard(t.expenses.noMatchingExpenses, { label: t.expenses.clearSearch, onClick: resetFilters });
    } else if (showingToday && all.length > 0) {
      body = emptyCard(t.dashboard.noExpensesToday, {
        label: `${t.dashboard.viewWeekExpenses} (${all.length})`,
        onClick: () => setPeriod("week"),
      });
    } else {
      body = emptyCard(t.dashboard.noExpenses);
    }
  } else if (showingToday) {
    body = (
      <ul className="overflow-hidden rounded-2xl border border-line bg-card">
        {filteredExpenses.map((item) => renderRow(item, false))}
      </ul>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section key={group.dateStr} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 text-xs">
              <h3 className="font-semibold text-ink-soft">{group.label}</h3>
              <span className="font-semibold text-ink-soft">{formatCurrency(group.total)}</span>
            </div>
            <ul className="overflow-hidden rounded-2xl border border-line bg-card">
              {group.items.map((item) => renderRow(item, false))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const iconButton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink-soft hover:bg-paper hover:text-ink active:bg-line";
  const segment = (active: boolean) =>
    `flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
      active ? "bg-card text-ink" : "text-ink-soft hover:text-ink"
    }`;

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title || t.dashboard.recentEntries}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-label={t.home.searchToggle}
              aria-expanded={isFilterOpen || hasActiveFilter}
              className={`${iconButton} ${isFilterOpen || hasActiveFilter ? "border-ink text-ink" : ""}`}
            >
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                setExportLoaded(true);
                setIsExportOpen(true);
              }}
              aria-label={t.expenses.shareExport}
              className={iconButton}
            >
              <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {showPeriodToggle && !hasActiveFilter && (
          <div role="group" aria-label={t.home.periodLabel} className="flex rounded-xl border border-line bg-paper p-1">
            <button type="button" aria-pressed={period === "today"} onClick={() => setPeriod("today")} className={segment(period === "today")}>
              {t.dashboard.tabToday}
              <span className="text-xs font-medium text-ink-soft">{todayExpenses.length}</span>
            </button>
            <button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")} className={segment(period === "week")}>
              {dashboardPeriod === "month" ? t.dashboard.tabThisMonth : t.dashboard.tabThisWeek}
              <span className="text-xs font-medium text-ink-soft">{all.length}</span>
            </button>
          </div>
        )}

        {(isFilterOpen || hasActiveFilter) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={searchId} className="text-sm font-semibold text-ink">
                {t.home.searchLabel}
              </label>
              <div className="relative">
                <input
                  id={searchId}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.expenses.searchPlaceholder}
                  className="min-h-11 w-full rounded-xl border border-line bg-paper px-3 pr-12 text-base text-ink placeholder:text-ink-soft/70 hover:border-ink-soft"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t.home.clearSearchAria}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div role="group" aria-label={t.expenses.categoryLabel} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {[null, ...CATEGORY_KEYS].map((catKey) => {
                const isSelected = selectedCategory === catKey;
                const count = catKey ? categoryCounts[catKey] || 0 : all.length;
                return (
                  <button
                    key={catKey ?? "all"}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(isSelected ? null : catKey)}
                    className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${
                      isSelected ? "border-ink bg-ink text-card" : "border-line bg-card text-ink hover:bg-paper active:bg-line"
                    }`}
                  >
                    <span>{catKey ? getCategoryLabel(catKey) : t.expenses.allCategories}</span>
                    <span className={`text-xs font-medium ${isSelected ? "text-card" : "text-ink-soft"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilter && (
              <div className="flex items-center justify-between gap-2 border-t border-line pt-2 text-sm text-ink-soft">
                <span aria-live="polite">
                  {t.expenses.showingFiltered
                    .replace("{count}", String(filteredExpenses.length))
                    .replace("{total}", String(all.length))}
                  {" · "}
                  <strong className="font-bold text-ink">{formatCurrency(filteredTotal)}</strong>
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-11 shrink-0 rounded-xl px-2 font-semibold text-accent-strong hover:bg-paper active:bg-line"
                >
                  {t.expenses.clearSearch}
                </button>
              </div>
            )}
          </div>
        )}

        {body}
      </section>

      <Dialog
        isOpen={editingExpense !== null}
        onClose={closeModal}
        busy={busy}
        title={t.expenses.editTitle}
        description={t.expenses.editSubtitle}
        closeLabel={t.common.close}
        footer={
          confirmingDelete ? (
            <>
              <Button block onClick={() => setConfirmingDelete(false)} disabled={busy}>
                {t.common.cancel}
              </Button>
              <Button block variant="danger" onClick={() => editingExpense && handleDelete(editingExpense.id)} disabled={busy}>
                {isDeleting ? t.common.deleting : t.home.deleteYes}
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" onClick={() => setConfirmingDelete(true)} disabled={busy} aria-label={t.common.delete}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button block onClick={closeModal} disabled={busy}>
                {t.common.cancel}
              </Button>
              <Button block variant="primary" type="submit" form="edit-expense-form" disabled={busy}>
                {isUpdating ? t.common.saving : t.common.save}
              </Button>
            </>
          )
        }
      >
        {editingExpense && (
          <form id="edit-expense-form" key={editingExpense.id} onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={editingExpense.id} />

            {confirmingDelete && (
              <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
                {t.home.deleteAsk}
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            {currency === "IDR" ? (
              <MoneyField
                label={t.home.amountLabel}
                name="amount"
                value={editAmount}
                onChange={setEditAmount}
                prefix={currencySymbol}
                required
                autoFocus
              />
            ) : (
              <TextField
                label={`${t.home.amountLabel} (${currencySymbol})`}
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={editingExpense.amount}
                required
              />
            )}

            <TextField
              label={t.home.nameLabel}
              name="name"
              type="text"
              defaultValue={editingExpense.name}
              placeholder={t.expenses.namePlaceholder}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField label={t.expenses.categoryLabel} name="category" defaultValue={editingExpense.category}>
                {CATEGORY_KEYS.map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {getCategoryLabel(catKey)}
                  </option>
                ))}
              </SelectField>
              <TextField
                label={t.home.dateLabel}
                name="spent_at"
                type="date"
                defaultValue={dateOf(editingExpense)}
                required
                className="scheme-light dark:scheme-dark"
              />
            </div>

            <TextField
              label={t.home.noteLabel}
              name="note"
              type="text"
              defaultValue={cleanNote(editingExpense.note)}
              placeholder={t.expenses.notePlaceholder}
            />

            <label className="flex min-h-11 items-start gap-3 rounded-xl border border-line p-3">
              <input
                type="checkbox"
                checked={editIsExempt}
                onChange={(e) => setEditIsExempt(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-(--accent)"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{t.expenses.oneOffCheckbox}</span>
                <span className="block text-xs text-ink-soft">{t.expenses.oneOffHelp}</span>
              </span>
            </label>
          </form>
        )}
      </Dialog>

      {exportLoaded && (
        <ExportShareModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          expenses={all}
          weeklyBudget={weeklyBudget}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
          wallets={wallets}
        />
      )}
    </>
  );
}
