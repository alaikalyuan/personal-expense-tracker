"use client";

import { useState } from "react";
import { addExpense } from "@/app/actions";
import { X } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { CATEGORY_KEYS } from "@/utils/i18n/dictionaries";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  today: string;
}

export function QuickAddModal({ isOpen, onClose, today }: QuickAddModalProps) {
  const { t, getCategoryLabel } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addExpense(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToAdd);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <form
        action={handleSubmit}
        className="w-full max-w-md flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl animate-modal-in"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-zinc-100">{t.expenses.addTitle}</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t.common.close}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex w-1/2 items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-zinc-500">
            <span className="mr-2 text-sm font-semibold text-zinc-400">Rp</span>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              step="1"
              placeholder={t.expenses.amountPlaceholder}
              required
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500 text-zinc-100"
            />
          </div>
          <select
            name="category"
            className="w-1/2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
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
          defaultValue={today}
          required
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 scheme-dark outline-none focus:border-zinc-500"
        />

        <div className="flex flex-col gap-2">
          <input
            name="name"
            type="text"
            placeholder={t.expenses.namePlaceholder}
            required
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
          />
          <div className="flex gap-2">
            <input
              name="note"
              type="text"
              placeholder={t.expenses.notePlaceholder}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t.common.adding : t.common.add}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function QuickAddExpense({ today }: { today: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t.nav.addExpense}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-950 shadow-lg shadow-black/30 transition-colors hover:bg-zinc-200 cursor-pointer"
      >
        +
      </button>

      <QuickAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        today={today}
      />
    </>
  );
}