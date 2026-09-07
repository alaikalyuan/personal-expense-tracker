"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { addExpense } from "@/app/actions";
import {
  X,
  Plus,
  SlidersHorizontal,
  Zap,
  Utensils,
  Car,
  GraduationCap,
  Gamepad2,
  Package,
  Calendar,
  Settings2,
  Trash2,
  Check,
  CheckCircle2,
  RotateCcw,
  FileText,
  Pencil,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { CATEGORY_KEYS, CategoryKey } from "@/utils/i18n/dictionaries";
import {
  QuickChip,
  getStoredQuickChips,
  saveQuickChips,
  resetQuickChips,
  getStoredInputMode,
  saveInputMode,
  getStoredKeepBatch,
  saveKeepBatch,
} from "@/utils/quickChips";
import { parseQuickExpenseInput } from "@/utils/expenseParser";
import { subDays, format, parseISO } from "date-fns";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  today: string;
}

const CATEGORY_ICONS: Record<CategoryKey, typeof Utensils> = {
  "Food & Dining": Utensils,
  Transportation: Car,
  Utilities: Zap,
  Academics: GraduationCap,
  Entertainment: Gamepad2,
  Others: Package,
};

const CATEGORY_STYLES: Record<
  CategoryKey,
  {
    activeBg: string;
    activeText: string;
    border: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  "Food & Dining": {
    activeBg: "bg-emerald-500 text-white shadow-xs",
    activeText: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  Transportation: {
    activeBg: "bg-blue-500 text-white shadow-xs",
    activeText: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40",
    badgeText: "text-blue-700 dark:text-blue-300",
  },
  Utilities: {
    activeBg: "bg-amber-500 text-white shadow-xs",
    activeText: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  Academics: {
    activeBg: "bg-purple-500 text-white shadow-xs",
    activeText: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40",
    badgeText: "text-purple-700 dark:text-purple-300",
  },
  Entertainment: {
    activeBg: "bg-pink-500 text-white shadow-xs",
    activeText: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500",
    badgeBg: "bg-pink-50 dark:bg-pink-950/40",
    badgeText: "text-pink-700 dark:text-pink-300",
  },
  Others: {
    activeBg: "bg-zinc-700 text-white shadow-xs dark:bg-zinc-600",
    activeText: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800",
    badgeText: "text-zinc-700 dark:text-zinc-300",
  },
};

function QuickAddModalContent({ onClose, today }: { onClose: () => void; today: string }) {
  const { t, getCategoryLabel } = useTranslation();

  // Mode: "standard" vs "quick_type" (lazy initialization from localStorage)
  const [inputMode, setInputMode] = useState<"standard" | "quick_type">(() => getStoredInputMode());
  const [chips, setChips] = useState<QuickChip[]>(() => getStoredQuickChips());
  const [keepBatch, setKeepBatch] = useState<boolean>(() => getStoredKeepBatch());

  // Form states (Standard mode)
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<CategoryKey>("Food & Dining");
  const [name, setName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showNote, setShowNote] = useState<boolean>(false);
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>(today);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);

  // Quick Type state
  const [quickInput, setQuickInput] = useState<string>("");
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // Chip Manager state
  const [isManagingChips, setIsManagingChips] = useState(false);
  const [chipToEdit, setChipToEdit] = useState<QuickChip | null>(null);
  const [newChipName, setNewChipName] = useState("");
  const [newChipCategory, setNewChipCategory] = useState<CategoryKey>("Food & Dining");
  const [newChipAmount, setNewChipAmount] = useState("");
  const [newChipEmoji, setNewChipEmoji] = useState("");

  // Submitting / Error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const quickInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Yesterday date string
  const yesterdayStr = useMemo(() => {
    try {
      return format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    } catch {
      return today;
    }
  }, [today]);

  // Handle mode switch with persistence
  const handleModeChange = (mode: "standard" | "quick_type") => {
    setInputMode(mode);
    saveInputMode(mode);
    setError(null);
  };

  // Handle batch keep toggle
  const handleKeepBatchToggle = (checked: boolean) => {
    setKeepBatch(checked);
    saveKeepBatch(checked);
  };

  // Live parsed expense for Quick Type mode
  const parsedExpense = useMemo(() => {
    return parseQuickExpenseInput(quickInput, today, chips);
  }, [quickInput, today, chips]);

  // Auto focus input on mount or mode switch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputMode === "quick_type") {
        quickInputRef.current?.focus();
      } else {
        if (!name) {
          nameInputRef.current?.focus();
        } else {
          amountInputRef.current?.focus();
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [inputMode, name]);

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setBatchFeedback(null);
    setIsManagingChips(false);
    onClose();
  };

  // Quick Amount incremental shortcuts (+10k, +20k, +50k, +100k)
  const addQuickAmount = (increment: number) => {
    setAmount((prev) => prev + increment);
  };

  const clearAmount = () => {
    setAmount(0);
  };

  // Quick Chip click handler
  const handleChipClick = (chip: QuickChip) => {
    setActiveChipId(chip.id);
    setName(chip.name);
    setCategory(chip.category);
    if (chip.defaultAmount && chip.defaultAmount > 0) {
      setAmount(chip.defaultAmount);
    }
    amountInputRef.current?.focus();
  };

  // Standard Mode Submission
  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (amount < 0) {
      setError(t.expenses.amountPositiveError);
      amountInputRef.current?.focus();
      return;
    }
    if (!name.trim()) {
      setError(t.expenses.nameRequiredError);
      nameInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const spentAt =
        dateMode === "today"
          ? today
          : dateMode === "yesterday"
          ? yesterdayStr
          : customDate;

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("amount", String(amount));
      formData.set("category", category);
      formData.set("spent_at", spentAt);
      if (note.trim()) {
        formData.set("note", note.trim());
      }

      await addExpense(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToAdd);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Type Submission
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!parsedExpense.isValid || !parsedExpense.amount || parsedExpense.amount <= 0) {
      setError(t.expenses.quickTypeParseError);
      quickInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.set("name", parsedExpense.name);
      formData.set("amount", String(parsedExpense.amount));
      formData.set("category", parsedExpense.category);
      formData.set("spent_at", parsedExpense.spentAt);

      await addExpense(formData);

      if (keepBatch) {
        const feedback = `${parsedExpense.name} (Rp ${parsedExpense.amount.toLocaleString("id-ID")})`;
        setBatchFeedback(feedback);
        setQuickInput("");
        quickInputRef.current?.focus();

        setTimeout(() => {
          setBatchFeedback((prev) => (prev === feedback ? null : prev));
        }, 3000);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.expenses.failedToAdd);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chip Management Functions
  const handleOpenAddChip = () => {
    setChipToEdit(null);
    setNewChipName("");
    setNewChipCategory("Food & Dining");
    setNewChipAmount("");
    setNewChipEmoji("");
  };

  const handleOpenEditChip = (chip: QuickChip) => {
    setChipToEdit(chip);
    setNewChipName(chip.name);
    setNewChipCategory(chip.category);
    setNewChipAmount(chip.defaultAmount ? String(chip.defaultAmount) : "");
    setNewChipEmoji(chip.emoji || "");
  };

  const handleSaveChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChipName.trim()) return;

    const parsedAmt = newChipAmount ? parseInt(newChipAmount.replace(/\D/g, ""), 10) : undefined;
    const cleanAmt = parsedAmt && !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : undefined;

    let updatedList: QuickChip[];

    if (chipToEdit) {
      updatedList = chips.map((c) =>
        c.id === chipToEdit.id
          ? {
              ...c,
              name: newChipName.trim(),
              category: newChipCategory,
              defaultAmount: cleanAmt,
              emoji: newChipEmoji.trim() || undefined,
            }
          : c
      );
    } else {
      const newChip: QuickChip = {
        id: `chip-${Date.now()}`,
        name: newChipName.trim(),
        category: newChipCategory,
        defaultAmount: cleanAmt,
        emoji: newChipEmoji.trim() || undefined,
      };
      updatedList = [...chips, newChip];
    }

    setChips(updatedList);
    saveQuickChips(updatedList);
    handleOpenAddChip();
  };

  const handleDeleteChip = (id: string) => {
    const updatedList = chips.filter((c) => c.id !== id);
    setChips(updatedList);
    saveQuickChips(updatedList);
    if (chipToEdit?.id === id) {
      handleOpenAddChip();
    }
  };

  const handleResetChips = () => {
    const defaultChips = resetQuickChips();
    setChips(defaultChips);
    handleOpenAddChip();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border-t sm:border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 shrink-0" />

        {/* Modal Header: Title, Segmented Mode Tabs, Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80 gap-2 shrink-0">
          {/* Segmented Mode Selector */}
          <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleModeChange("standard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                inputMode === "standard"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.expenses.standardTab}</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("quick_type")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                inputMode === "quick_type"
                  ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.expenses.quickTypeTab}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t.common.close}
            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-300 shrink-0">
            {error}
          </div>
        )}

        {/* Continuous Batch Feedback Toast */}
        {batchFeedback && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>{batchFeedback}</strong> {t.expenses.expenseLoggedBatch}
              </span>
            </div>
          </div>
        )}

        {/* MODE 1: STANDARD FORM */}
        {inputMode === "standard" && (
          <form onSubmit={handleStandardSubmit} className="flex flex-col gap-4 pt-3.5">
            {/* Quick-Fill Chips Shelf */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                  {t.expenses.quickShortcuts}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsManagingChips(true);
                    handleOpenAddChip();
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 py-0.5 px-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>{t.expenses.manageChips}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-1 px-1">
                {chips.map((chip) => {
                  const isSelected = activeChipId === chip.id && name === chip.name;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-xs dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                          : "border-zinc-200/90 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {chip.emoji && <span className="text-sm">{chip.emoji}</span>}
                      <span>{chip.name}</span>
                      {chip.defaultAmount && (
                        <span className="text-[10px] opacity-75 font-normal">
                          {(chip.defaultAmount / 1000).toFixed(0)}k
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero Amount Input with live IDR thousands display */}
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center rounded-2xl border-2 border-zinc-200 bg-zinc-50/70 p-3 focus-within:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-200 transition-all">
                <span className="text-base font-bold text-zinc-400 dark:text-zinc-500 mr-2 select-none">
                  Rp
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  value={amount > 0 ? amount.toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setAmount(digits ? parseInt(digits, 10) : 0);
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-2xl font-extrabold tracking-tight outline-none placeholder:text-zinc-300 text-zinc-900 dark:placeholder:text-zinc-600 dark:text-zinc-50"
                />
                {amount > 0 && (
                  <button
                    type="button"
                    onClick={clearAmount}
                    aria-label={t.expenses.clearAmount}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Amount Pills (+10k, +20k, +50k, +100k, Clear) */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "+10k", val: 10000 },
                  { label: "+20k", val: 20000 },
                  { label: "+50k", val: 50000 },
                  { label: "+100k", val: 100000 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => addQuickAmount(item.val)}
                    className="py-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 text-[11px] font-semibold text-zinc-700 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAmount}
                  className="py-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 text-[11px] font-semibold text-zinc-500 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                >
                  C
                </button>
              </div>
            </div>

            {/* 1-Tap Category Grid */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                {t.expenses.categoryLabel}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_KEYS.map((catKey) => {
                  const Icon = CATEGORY_ICONS[catKey] || Package;
                  const isSelected = category === catKey;
                  const style = CATEGORY_STYLES[catKey];

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all text-left cursor-pointer active:scale-95 ${
                        isSelected
                          ? `${style.activeBg} border-transparent`
                          : "border-zinc-200/90 bg-zinc-50/60 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : style.activeText}`} />
                      <span className="truncate">{getCategoryLabel(catKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setActiveChipId(null);
                }}
                placeholder={t.expenses.namePlaceholder}
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:text-zinc-100"
              />
            </div>

            {/* Smart Date Selector (Today / Yesterday / Custom) */}
            <div className="flex items-center gap-1.5 select-none">
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mr-1">
                {t.expenses.whenLabel}:
              </span>
              <button
                type="button"
                onClick={() => setDateMode("today")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  dateMode === "today"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {t.common.today}
              </button>
              <button
                type="button"
                onClick={() => setDateMode("yesterday")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  dateMode === "yesterday"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {t.common.yesterday}
              </button>
              <button
                type="button"
                onClick={() => setDateMode("custom")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  dateMode === "custom"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{t.expenses.customDate}</span>
              </button>
            </div>

            {/* Custom Date Input if selected */}
            {dateMode === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 scheme-light dark:scheme-dark outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-300 animate-fade-in"
              />
            )}

            {/* Collapsible Note Section */}
            {!showNote && !note ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="self-start text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {t.expenses.addNote}
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.expenses.notePlaceholder}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:text-zinc-100"
                />
                {!note && (
                  <button
                    type="button"
                    onClick={() => setShowNote(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 p-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Primary Submit Button */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-3 text-sm font-bold shadow-md shadow-zinc-950/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t.common.adding}</span>
                ) : (
                  <span>
                    {t.expenses.addTitle}
                    {amount > 0 ? ` (Rp ${amount.toLocaleString("id-ID")})` : ""}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: ⚡ QUICK TYPE / SMART SINGLE BAR */}
        {inputMode === "quick_type" && (
          <form onSubmit={handleQuickSubmit} className="flex flex-col gap-4 pt-3.5">
            {/* Command Input Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="relative flex items-center rounded-2xl border-2 border-zinc-200 bg-zinc-50/70 p-3.5 focus-within:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-200 transition-all">
                <Zap className="w-5 h-5 text-amber-500 mr-2.5 shrink-0" />
                <input
                  ref={quickInputRef}
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={t.expenses.quickBarPlaceholder}
                  className="w-full bg-transparent text-sm sm:text-base font-semibold outline-none placeholder:text-zinc-400 text-zinc-900 dark:placeholder:text-zinc-600 dark:text-zinc-100"
                />
                {quickInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickInput("");
                      quickInputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pl-1">
                {t.expenses.quickBarHint}
              </p>
            </div>

            {/* Live Parsing Preview Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/60 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.expenses.detectedPreview}
                </span>
                {parsedExpense.isValid && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>

              {parsedExpense.isValid ? (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {parsedExpense.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          CATEGORY_STYLES[parsedExpense.category].badgeBg
                        } ${CATEGORY_STYLES[parsedExpense.category].badgeText}`}
                      >
                        {getCategoryLabel(parsedExpense.category)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {parsedExpense.spentAt === today
                          ? t.common.today
                          : parsedExpense.spentAt === yesterdayStr
                          ? t.common.yesterday
                          : parsedExpense.spentAt}
                      </span>
                    </div>
                  </div>

                  <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Rp {parsedExpense.amount?.toLocaleString("id-ID")}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-1">
                  {quickInput.trim()
                    ? t.expenses.quickTypeParseError
                    : "e.g. 'Makan siang 25k', 'Kopi 18rb kemarin', 'Bensin 20000'"}
                </p>
              )}
            </div>

            {/* Keep Open for Batch Consecutive Logging Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 p-3 bg-white dark:bg-zinc-900/60 select-none">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t.expenses.keepOpenBatch}
                </span>
              </div>
              <input
                type="checkbox"
                checked={keepBatch}
                onChange={(e) => handleKeepBatchToggle(e.target.checked)}
                className="h-4 w-4 rounded accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
              />
            </div>

            {/* Quick-Type Submit CTA */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                type="submit"
                disabled={isSubmitting || !parsedExpense.isValid}
                className="w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-3 text-sm font-bold shadow-md shadow-zinc-950/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t.common.adding}</span>
                ) : (
                  <span>
                    {t.expenses.addTitle}
                    {parsedExpense.amount ? ` (Rp ${parsedExpense.amount.toLocaleString("id-ID")})` : ""}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* CHIP MANAGER MODAL OVERLAY */}
        {isManagingChips && (
          <div className="absolute inset-0 z-20 rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3.5 animate-modal-in overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t.expenses.manageChipsTitle}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t.expenses.manageChipsSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManagingChips(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of existing chips */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {chips.map((chip) => (
                <div
                  key={chip.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center gap-2">
                    {chip.emoji && <span className="text-base">{chip.emoji}</span>}
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{chip.name}</p>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {getCategoryLabel(chip.category)}
                        {chip.defaultAmount ? ` • Rp ${chip.defaultAmount.toLocaleString("id-ID")}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditChip(chip)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChip(chip.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Chip Form */}
            <form onSubmit={handleSaveChip} className="flex flex-col gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {chipToEdit ? t.expenses.editChip : t.expenses.addChip}
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChipEmoji}
                  onChange={(e) => setNewChipEmoji(e.target.value)}
                  placeholder="Emoji"
                  className="w-16 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-center text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <input
                  type="text"
                  value={newChipName}
                  onChange={(e) => setNewChipName(e.target.value)}
                  placeholder={t.expenses.chipNamePlaceholder}
                  required
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newChipCategory}
                  onChange={(e) => setNewChipCategory(e.target.value as CategoryKey)}
                  className="w-1/2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {CATEGORY_KEYS.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newChipAmount}
                  onChange={(e) => setNewChipAmount(e.target.value)}
                  placeholder={t.expenses.defaultAmountOptional}
                  className="w-1/2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetChips}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.expenses.resetDefaults}</span>
                </button>

                <div className="flex gap-2">
                  {chipToEdit && (
                    <button
                      type="button"
                      onClick={handleOpenAddChip}
                      className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {t.common.cancel}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    {t.expenses.saveChip}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickAddModal({ isOpen, onClose, today }: QuickAddModalProps) {
  if (!isOpen) return null;
  return <QuickAddModalContent onClose={onClose} today={today} />;
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
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-2xl font-semibold shadow-lg shadow-black/30 transition-colors cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>

      <QuickAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        today={today}
      />
    </>
  );
}