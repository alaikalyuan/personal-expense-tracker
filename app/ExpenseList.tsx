"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { updateExpense, deleteExpense } from "@/app/actions";
import { useTranslation } from "@/utils/i18n/context";
import { CATEGORY_KEYS } from "@/utils/i18n/dictionaries";

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

export default function ExpenseList({ expenses }: { expenses: ExpenseItem[] }) {
  const { t, formatDate, getCategoryLabel } = useTranslation();
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm(t.expenses.deleteConfirm)) {
      return;
    }
    try {
      setIsDeleting(true);
      await deleteExpense(id);
      setEditingExpense(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      setIsUpdating(true);
      await updateExpense(formData);
      setEditingExpense(null);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        {t.dashboard.noExpenses}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {expenses.map((item) => (
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
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Rp {Number(item.amount).toLocaleString("id-ID")}
              </span>

              {/* Accessible, Non-Distracting Edit Button */}
              <button
                type="button"
                onClick={() => setEditingExpense(item)}
                aria-label={`Edit ${item.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit & Delete Modal */}
      {editingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeleting && !isUpdating) {
              setEditingExpense(null);
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
                onClick={() => setEditingExpense(null)}
                aria-label={t.common.close}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={handleUpdate} className="flex flex-col gap-3 pt-3">
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
                    onClick={() => setEditingExpense(null)}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
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
    </>
  );
}

