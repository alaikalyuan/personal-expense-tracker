"use client";

import { useState, useEffect, useId, useRef, useMemo } from "react";
import { addExpense, addExpensesBatch } from "@/app/actions";
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
  Tag,
  Sparkles,
  Camera,
  AlertTriangle,
  Loader2,
  Layers,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { detectOneOffAnomaly, attachExemptTag } from "@/utils/exemptions";
import { CATEGORY_KEYS, CategoryKey } from "@/utils/i18n/dictionaries";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";
import { useImageExtract } from "@/utils/ai/useImageExtract";
import { checkDuplicatesAction } from "@/app/ai/duplicateActions";
import { DuplicateMatch } from "@/utils/ai/duplicates";
import { ExtractedDocument } from "@/utils/ai/vision";
import { ImageUploadModal } from "@/app/ai/ImageUploadModal";
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
import { getActiveWallets } from "@/app/saku/actions";
import { Wallet } from "@/utils/wallets/server";
import ModalOverlay from "@/app/ui/ModalOverlay";
import { deleteAcrossSeparator, formatRupiahInput, parseMoneyInput, parseMoneyTyping, toRupiahFieldValue } from "@/utils/money";
import { CheckboxField, MoneyField, SelectField, TextField } from "@/app/ui/Field";
import { SegmentedControl, ToggleChip } from "@/app/ui/Toggle";
import { useGroupedCaret } from "@/app/ui/useGroupedCaret";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  today: string;
  multiSakuEnabled?: boolean;
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
    activeBg: "bg-emerald-600 text-white shadow-xs",
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
    activeBg: "bg-accent text-on-accent shadow-xs",
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

interface ScannedRow {
  id: string;
  name: string;
  amount: number;
  category: CategoryKey;
  spentAt: string;
  selected: boolean;
  duplicate?: DuplicateMatch | null;
}

function QuickAddModalContent({
  onClose,
  today,
  multiSakuEnabled = false,
}: {
  onClose: () => void;
  today: string;
  multiSakuEnabled?: boolean;
}) {
  const { t, locale, getCategoryLabel, formatDate, currency, currencySymbol, formatCurrency } = useTranslation();

  // AI Mode & Vision Extractor
  const { isAiEnabled } = useAiAssistant();
  const {
    extract,
    isExtracting,
    statusMessage: extractStatus,
    error: extractError,
    clearError: clearExtractError,
  } = useImageExtract();
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scannedDoc, setScannedDoc] = useState<ExtractedDocument | null>(null);
  const [scannedRows, setScannedRows] = useState<ScannedRow[]>([]);
  const [receiptBreakdownMode, setReceiptBreakdownMode] = useState<"summary" | "itemized">("summary");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Mode: "standard" vs "quick_type" (lazy initialization from localStorage)
  const [inputMode, setInputMode] = useState<"standard" | "quick_type">(() => getStoredInputMode());
  const [chips, setChips] = useState<QuickChip[]>(() => getStoredQuickChips());
  const [keepBatch, setKeepBatch] = useState<boolean>(() => getStoredKeepBatch());

  // Multi-saku wallets state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");

  useEffect(() => {
    if (!multiSakuEnabled) return;
    let isMounted = true;
    getActiveWallets().then((loadedWallets) => {
      if (!isMounted) return;
      const active = loadedWallets.filter((w) => !w.archived_at);
      setWallets(active);

      let preselected = "";
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)SELECTED_SAKU=([^;]+)/);
        if (match && match[1] && match[1] !== "all") {
          preselected = match[1];
        }
      }
      if (preselected && active.some((w) => w.id === preselected)) {
        setSelectedWalletId(preselected);
      } else {
        const primary =
          active.find((w) => w.is_primary && w.kind === "spending") ||
          active.find((w) => w.kind === "spending") ||
          active[0];
        if (primary) setSelectedWalletId(primary.id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [multiSakuEnabled]);

  // Form states (Standard mode)
  const [amount, setAmount] = useState<number>(0);
  // Text typed into the amount field that the number alone can't show: input
  // that doesn't parse, or decimals still being typed. Ignored once `amount`
  // is changed by anything else (a chip, a quick-amount pill).
  const [amountDraft, setAmountDraft] = useState<{ text: string; value: number; error: string | null } | null>(null);
  const [showAmountError, setShowAmountError] = useState(false);
  const [category, setCategory] = useState<CategoryKey>("Food & Dining");
  const [name, setName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [showNote, setShowNote] = useState<boolean>(false);
  const [dateMode, setDateMode] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>(today);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);

  // One-off exemption states
  const [isExempt, setIsExempt] = useState(false);
  const [openDetail, setOpenDetail] = useState<"date" | "saku" | null>(null);
  const [dismissedAnomalySuggestion, setDismissedAnomalySuggestion] = useState(false);

  // Proactive anomaly detection
  const isAnomaly = useMemo(() => {
    if (dismissedAnomalySuggestion || isExempt) return false;
    return detectOneOffAnomaly(name, amount);
  }, [name, amount, isExempt, dismissedAnomalySuggestion]);

  // Quick Type state
  const [quickInput, setQuickInput] = useState<string>("");
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // Quick Mode Interactive Overrides
  const [overrideCategory, setOverrideCategory] = useState<CategoryKey | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [overrideDate, setOverrideDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [overrideExempt, setOverrideExempt] = useState<boolean | null>(null);
  const [overrideWalletId, setOverrideWalletId] = useState<string | null>(null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  // Chip Manager state
  const [isManagingChips, setIsManagingChips] = useState(false);
  const [chipToEdit, setChipToEdit] = useState<QuickChip | null>(null);
  const [newChipName, setNewChipName] = useState("");
  const [newChipCategory, setNewChipCategory] = useState<CategoryKey>("Food & Dining");
  const [newChipAmount, setNewChipAmount] = useState("");
  const [chipAmountError, setChipAmountError] = useState<string | null>(null);
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

  // Live parsed expense for Quick Type mode
  const parsedExpense = useMemo(() => {
    return parseQuickExpenseInput(quickInput, today, chips, currency, wallets);
  }, [quickInput, today, chips, currency, wallets]);

  // Effective values for Quick Type mode (respecting manual 1-tap overrides)
  const effectiveCategory = overrideCategory ?? parsedExpense.category;
  const effectiveSpentAt = overrideDate ?? parsedExpense.spentAt;
  const effectiveIsExempt = overrideExempt !== null ? overrideExempt : Boolean(parsedExpense.isExempt);
  // A Saku picked from the badge beats one named in the typed text.
  const effectiveWalletId = overrideWalletId || parsedExpense.walletId || selectedWalletId;
  const effectiveWallet = wallets.find((w) => w.id === effectiveWalletId);

  // Proactive anomaly/splurge detection in Quick Mode
  const isQuickAnomaly = useMemo(() => {
    if (dismissedAnomalySuggestion || effectiveIsExempt) return false;
    if (!parsedExpense.isValid || !parsedExpense.amount) return false;
    return detectOneOffAnomaly(parsedExpense.name, parsedExpense.amount);
  }, [parsedExpense.name, parsedExpense.amount, parsedExpense.isValid, effectiveIsExempt, dismissedAnomalySuggestion]);

  // Handle mode switch with bidirectional state synchronization
  const handleModeChange = (mode: "standard" | "quick_type") => {
    if (mode === "standard") {
      // Sync parsed / overridden values into standard form
      if (parsedExpense.isValid) {
        setName(parsedExpense.name);
        if (parsedExpense.amount && parsedExpense.amount > 0) {
          setAmount(parsedExpense.amount);
        }
        setCategory(effectiveCategory);
        if (effectiveSpentAt === today) {
          setDateMode("today");
        } else if (effectiveSpentAt === yesterdayStr) {
          setDateMode("yesterday");
        } else {
          setDateMode("custom");
          setCustomDate(effectiveSpentAt);
        }
        setIsExempt(effectiveIsExempt);
        if (effectiveWalletId) {
          setSelectedWalletId(effectiveWalletId);
        }
      }
    } else {
      // Sync standard form inputs into quick input bar if bar is empty
      if (!quickInput.trim() && (name.trim() || amount > 0)) {
        let prefill = name.trim();
        if (amount > 0) {
          const amtStr = amount >= 1000 && amount % 1000 === 0 ? `${amount / 1000}k` : `${amount}`;
          prefill = prefill ? `${prefill} ${amtStr}` : amtStr;
        }
        if (dateMode === "yesterday") {
          prefill += " semalam";
        } else if (dateMode === "custom" && customDate !== today) {
          prefill += ` ${customDate}`;
        }
        if (isExempt) {
          prefill += " #one-off";
        }
        setQuickInput(prefill.trim());
        setOverrideCategory(category);
        setOverrideExempt(isExempt);
      }
    }
    setInputMode(mode);
    saveInputMode(mode);
    setError(null);
  };

  const handleQuickInputChange = (val: string) => {
    setQuickInput(val);
    if (!val.trim()) {
      setOverrideCategory(null);
      setOverrideDate(null);
      setOverrideWalletId(null);
      setShowWalletPicker(false);
      setOverrideExempt(null);
      setShowCategoryPicker(false);
      setShowDatePicker(false);
      setDismissedAnomalySuggestion(false);
    }
  };

  const handleQuickChipInQuickMode = (chip: QuickChip) => {
    const amt = chip.defaultAmount && chip.defaultAmount > 0
      ? (chip.defaultAmount >= 1000 && chip.defaultAmount % 1000 === 0 ? `${chip.defaultAmount / 1000}k` : `${chip.defaultAmount}`)
      : "";
    setQuickInput(amt ? `${chip.name} ${amt}` : `${chip.name} `);
    setOverrideCategory(chip.category);
    quickInputRef.current?.focus();
  };

  const handleKeepBatchToggle = (checked: boolean) => {
    setKeepBatch(checked);
    saveKeepBatch(checked);
  };

  // Auto focus input on mount or mode switch, unless the user is moving
  // through the mode radios with the arrow keys.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.activeElement?.closest('[role="radiogroup"]')) return;
      if (inputMode === "quick_type") {
        quickInputRef.current?.focus();
      } else {
        amountInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [inputMode]);

  const handleApplyScannedDoc = async (doc: ExtractedDocument) => {
    clearExtractError();
    setError(null);

    setScannedDoc(doc);
    const docDate = doc.date || today;

    // Build initial candidate rows
    let initialRows: ScannedRow[] = [];

    if (doc.kind === "receipt" && doc.items.length > 0) {
      // Default summary: merchant name & grand total
      const receiptTotal = doc.total || doc.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      initialRows = [
        {
          id: `scan-${Date.now()}`,
          name: doc.merchant || "Belanja Struk",
          amount: receiptTotal,
          category: doc.suggestedCategory,
          spentAt: docDate,
          selected: true,
        },
      ];
      setReceiptBreakdownMode("summary");
    } else if (doc.transactions.length > 0) {
      // Bank statement / mutation screenshot
      initialRows = doc.transactions
        .filter((t) => t.direction === "out")
        .map((t, idx) => ({
          id: `scan-tx-${Date.now()}-${idx}`,
          name: t.name,
          amount: t.amount,
          category: t.category || doc.suggestedCategory,
          spentAt: t.date || docDate,
          selected: true,
        }));
    } else {
      // Single fallback row
      initialRows = [
        {
          id: `scan-${Date.now()}`,
          name: doc.merchant || "Pengeluaran",
          amount: doc.total || 0,
          category: doc.suggestedCategory,
          spentAt: docDate,
          selected: true,
        },
      ];
    }

    // Check duplicates try-catch
    try {
      const dupMatches = await checkDuplicatesAction(
        initialRows.map((r) => ({
          name: r.name,
          amount: r.amount,
          spentAt: r.spentAt,
          category: r.category,
        }))
      );

      initialRows = initialRows.map((row, idx) => {
        const dup = dupMatches[idx];
        return {
          ...row,
          duplicate: dup,
          selected: dup ? false : true, // Pre-uncheck duplicate rows (soft warning)
        };
      });
    } catch (dupErr) {
      console.warn("Try-catch duplicate detection failed:", dupErr);
    }

    setScannedRows(initialRows);

    if (initialRows.length === 1) {
      setName(initialRows[0].name);
      setAmount(initialRows[0].amount);
      setCategory(initialRows[0].category);
      if (initialRows[0].spentAt === today) {
        setDateMode("today");
      } else if (initialRows[0].spentAt === yesterdayStr) {
        setDateMode("yesterday");
      } else {
        setDateMode("custom");
        setCustomDate(initialRows[0].spentAt);
      }
      setInputMode("standard");
    }
  };

  const handleToggleReceiptBreakdown = async (mode: "summary" | "itemized") => {
    if (!scannedDoc) return;
    setReceiptBreakdownMode(mode);
    const docDate = scannedDoc.date || today;

    let newRows: ScannedRow[] = [];
    if (mode === "summary") {
      const receiptTotal = scannedDoc.total || scannedDoc.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      newRows = [
        {
          id: `scan-${Date.now()}`,
          name: scannedDoc.merchant || "Belanja Struk",
          amount: receiptTotal,
          category: scannedDoc.suggestedCategory,
          spentAt: docDate,
          selected: true,
        },
      ];
    } else {
      newRows = scannedDoc.items.map((it, idx) => ({
        id: `scan-item-${Date.now()}-${idx}`,
        name: it.quantity > 1 ? `${it.name} (${it.quantity}x)` : it.name,
        amount: it.unitPrice * it.quantity,
        category: scannedDoc.suggestedCategory,
        spentAt: docDate,
        selected: true,
      }));
    }

    try {
      const dupMatches = await checkDuplicatesAction(
        newRows.map((r) => ({
          name: r.name,
          amount: r.amount,
          spentAt: r.spentAt,
          category: r.category,
        }))
      );
      newRows = newRows.map((row, idx) => {
        const dup = dupMatches[idx];
        return {
          ...row,
          duplicate: dup,
          selected: dup ? false : true,
        };
      });
    } catch (dupErr) {
      console.warn("Try-catch duplicate detection failed:", dupErr);
    }

    setScannedRows(newRows);
  };

  const handleToggleRowSelected = (rowId: string) => {
    setScannedRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleDismissScan = () => {
    setScannedDoc(null);
    setScannedRows([]);
  };

  const handleApplyScanToForm = () => {
    const candidate = scannedRows.find((r) => r.selected) || scannedRows[0];
    if (!candidate) return;

    setName(candidate.name);
    setAmount(candidate.amount);
    setCategory(candidate.category);
    if (candidate.spentAt === today) {
      setDateMode("today");
    } else if (candidate.spentAt === yesterdayStr) {
      setDateMode("yesterday");
    } else {
      setDateMode("custom");
      setCustomDate(candidate.spentAt);
    }

    handleDismissScan();
    setInputMode("standard");
  };

  const handleLogScannedRows = async () => {
    const selected = scannedRows.filter((r) => r.selected);
    if (selected.length === 0) {
      setError(locale === "id" ? "Pilih minimal 1 transaksi untuk dicatat." : "Select at least 1 transaction to log.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await addExpensesBatch(
        selected.map((r) => ({
          name: r.name,
          amount: r.amount,
          category: r.category,
          spentAt: r.spentAt,
          walletId: selectedWalletId || null,
        }))
      );

      const feedback = `${selected.length} ${locale === "id" ? "transaksi berhasil dicatat" : "expenses recorded"}`;
      setBatchFeedback(feedback);
      handleDismissScan();

      if (!keepBatch) {
        onClose();
      } else {
        setTimeout(() => {
          setBatchFeedback((prev) => (prev === feedback ? null : prev));
        }, 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.expenses.failedToAdd);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setBatchFeedback(null);
    setIsManagingChips(false);
    handleDismissScan();
    onClose();
  };

  // Quick Amount incremental shortcuts (+10k, +20k, +50k, +100k)
  const addQuickAmount = (increment: number) => {
    setAmount((prev) => prev + increment);
  };

  const clearAmount = () => {
    setAmount(0);
    setAmountDraft(null);
    setShowAmountError(false);
  };

  const amountDraftActive = amountDraft !== null && amountDraft.value === amount;
  const amountError = amountDraftActive ? amountDraft.error : null;

  const amountDisplay = amountDraftActive
    ? amountDraft.text
    : amount > 0
    ? currency === "IDR"
      ? formatRupiahInput(amount)
      : String(amount)
    : "";

  const rememberAmountCaret = useGroupedCaret(amountInputRef);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const typed = input.selectionStart ?? input.value.length;
    // Only rupiah is regrouped, so only rupiah needs a deleted dot turned into a deleted digit.
    const { text, caret } =
      currency === "IDR"
        ? deleteAcrossSeparator(amountDisplay, input.value, typed, (e.nativeEvent as InputEvent).inputType)
        : { text: input.value, caret: typed };
    setShowAmountError(false);
    if (!text.trim()) {
      setAmount(0);
      setAmountDraft(null);
      return;
    }
    rememberAmountCaret(text, input.selectionStart === null ? null : caret);
    // Rupiah is regrouped as it is typed, so its own dots may be out of place mid-edit ("2.5000").
    const parsed = parseMoneyTyping(text, currency, { allowZero: true });
    if (parsed.ok) {
      setAmount(parsed.value);
      // Rupiah is shown regrouped; other currencies keep the typed text so "10.0" can become "10.05".
      setAmountDraft(currency === "IDR" ? null : { text, value: parsed.value, error: null });
    } else {
      setAmount(0);
      setAmountDraft({ text, value: 0, error: parsed.error });
    }
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

    if (amountError) {
      setShowAmountError(true);
      setError(amountError);
      amountInputRef.current?.focus();
      return;
    }
    if (!(amount > 0)) {
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
      const finalNote = attachExemptTag(note.trim(), isExempt);
      if (finalNote) {
        formData.set("note", finalNote);
      }
      if (selectedWalletId) {
        formData.set("wallet_id", selectedWalletId);
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
      formData.set("category", effectiveCategory);
      formData.set("spent_at", effectiveSpentAt);

      const finalNote = attachExemptTag("", effectiveIsExempt);
      if (finalNote) {
        formData.set("note", finalNote);
      }
      if (effectiveWalletId) {
        formData.set("wallet_id", effectiveWalletId);
      }

      await addExpense(formData);

      if (keepBatch) {
        const feedback = `${parsedExpense.name} (${formatCurrency(parsedExpense.amount || 0)})`;
        setBatchFeedback(feedback);
        setQuickInput("");
        setOverrideCategory(null);
        setOverrideDate(null);
        setOverrideWalletId(null);
        setShowWalletPicker(false);
        setOverrideExempt(null);
        setShowCategoryPicker(false);
        setShowDatePicker(false);
        setDismissedAnomalySuggestion(false);
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
    setChipAmountError(null);
    setNewChipEmoji("");
  };

  const handleOpenEditChip = (chip: QuickChip) => {
    setChipToEdit(chip);
    setNewChipName(chip.name);
    setNewChipCategory(chip.category);
    setNewChipAmount(chip.defaultAmount ? (currency === "IDR" ? toRupiahFieldValue(chip.defaultAmount) : String(chip.defaultAmount)) : "");
    setChipAmountError(null);
    setNewChipEmoji(chip.emoji || "");
  };

  const handleSaveChip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChipName.trim()) return;

    const parsedAmt = parseMoneyInput(newChipAmount, currency, { allowEmpty: true, allowZero: true });
    if (!parsedAmt.ok) {
      setChipAmountError(parsedAmt.error);
      return;
    }
    const cleanAmt = parsedAmt.value > 0 ? parsedAmt.value : undefined;

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

  const fieldIds = useId();
  const amountId = `${fieldIds}-amount`;
  const quickBarId = `${fieldIds}-quick`;
  const quickHintId = `${fieldIds}-quick-hint`;
  const scanSakuId = `${fieldIds}-scan-saku`;
  const chipManagerTitleId = `${fieldIds}-chip-manager`;
  const standardFormId = `${fieldIds}-standard-form`;
  const quickFormId = `${fieldIds}-quick-form`;
  const datePanelId = `${fieldIds}-date-panel`;
  const sakuPanelId = `${fieldIds}-saku-panel`;
  const notePanelId = `${fieldIds}-note-panel`;
  const oneOffHintId = `${fieldIds}-one-off-hint`;

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedScanCount = scannedRows.filter((r) => r.selected).length;
  const dateSummary =
    dateMode === "today"
      ? t.common.today
      : dateMode === "yesterday"
      ? t.common.yesterday
      : customDate
      ? formatDate(customDate, "d MMM yyyy")
      : t.expenses.customDate;

  const detailPillClass =
    "inline-flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm font-semibold text-ink hover:bg-paper transition-colors cursor-pointer";
  const primaryButtonClass =
    "flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-on-accent shadow-xs hover:brightness-95 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50";
  const chipManagerRef = useRef<HTMLDivElement>(null);
  const chipOpenerRef = useRef<HTMLElement | null>(null);

  const openChipManager = () => {
    chipOpenerRef.current = document.activeElement as HTMLElement | null;
    setIsManagingChips(true);
    handleOpenAddChip();
  };

  const closeChipManager = () => {
    setIsManagingChips(false);
    // The opener is inert until the manager unmounts, so focus it on the next frame.
    requestAnimationFrame(() => chipOpenerRef.current?.focus());
  };

  useEffect(() => {
    if (isManagingChips) chipManagerRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [isManagingChips]);

  const manageChipsButton = (
    <button
      type="button"
      onClick={openChipManager}
      className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-dashed border-field-line px-3 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink transition-colors cursor-pointer"
    >
      <Settings2 aria-hidden="true" className="w-4 h-4" />
      <span>{t.expenses.manageChips}</span>
    </button>
  );

  const handleEscape = () => {
    if (isManagingChips) {
      closeChipManager();
      return;
    }
    if (isExtracting) return;
    handleClose();
  };

  return (
    <ModalOverlay
      aria-label={t.expenses.addTitle}
      onClose={handleEscape}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      {/* Header, scrolling body and a pinned footer: the submit button stays on screen however much the body holds. */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border-t sm:border border-line bg-card text-ink shadow-2xl animate-modal-in max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden"
      >
        {/* Mobile Drag Indicator */}
        <div aria-hidden="true" className="sm:hidden w-10 h-1 bg-line rounded-full mx-auto mt-2 shrink-0" />

        {/* Everything under the shortcut manager stays out of reach while it is open. */}
        <div className="contents" inert={isManagingChips}>

        {/* Modal Header: mode switch, photo scan, close */}
        <div className="flex items-center gap-1 pl-5 pr-3 pt-2 pb-2.5 sm:pt-4 border-b border-line shrink-0">
          <div className="min-w-0 mr-auto">
            <SegmentedControl
              ariaLabel={t.expenses.inputModeLabel}
              value={inputMode}
              onChange={handleModeChange}
              options={[
                {
                  value: "quick_type",
                  label: (
                    <>
                      <Zap aria-hidden="true" className="w-4 h-4 text-amber-500" />
                      <span className="whitespace-nowrap">{t.expenses.quickTypeTab}</span>
                    </>
                  ),
                },
                {
                  value: "standard",
                  label: (
                    <>
                      <SlidersHorizontal aria-hidden="true" className="w-4 h-4" />
                      <span className="whitespace-nowrap">{t.expenses.standardTab}</span>
                    </>
                  ),
                },
              ]}
            />
          </div>

          {/* AI Photo Scan Button (hidden if AI mode is disabled) */}
          {isAiEnabled && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsImageModalOpen(true)}
              aria-label={t.expenses.scanPhotoAria}
              title={t.expenses.scanPhotoAria}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera aria-hidden="true" className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting || isExtracting}
            aria-label={t.common.close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrolling body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-4">

        {/* Global Error Banner */}
        {(error || extractError) && (
          <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-300">
            {error || extractError}
          </div>
        )}

        {/* Continuous Batch Feedback Toast */}
        {batchFeedback && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>{batchFeedback}</strong> {t.expenses.expenseLoggedBatch}
              </span>
            </div>
          </div>
        )}

        {/* SCANNED DOCUMENT REVIEW PANEL */}
        {scannedDoc && (
          <div className="mt-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 p-3.5 space-y-3 animate-fade-in">
            {/* Header: Merchant & Discard */}
            <div className="flex items-start justify-between gap-2 border-b border-teal-500/15 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Hasil Pindai Foto
                  </span>
                  <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    {scannedDoc.kind === "receipt" ? "Struk Belanja" : "Bukti Mutasi/Transfer"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                  {scannedDoc.merchant || "Transaksi Terdeteksi"} • {scannedDoc.date || today}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissScan}
                aria-label={t.expenses.scanDismiss}
                className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Itemization Mode Switch (only if receipt has items) */}
            {scannedDoc.kind === "receipt" && scannedDoc.items.length > 0 && (
              <SegmentedControl
                ariaLabel={t.expenses.receiptModeLabel}
                value={receiptBreakdownMode}
                onChange={handleToggleReceiptBreakdown}
                options={[
                  { value: "summary", label: "Ringkas (1 Total)" },
                  { value: "itemized", label: `Rincian (${scannedDoc.items.length} Item)` },
                ]}
              />
            )}

            {/* List of scanned transaction rows */}
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
              {scannedRows.map((row) => (
                <div
                  key={row.id}
                  className={`rounded-xl p-2.5 transition-colors border ${
                    row.duplicate
                      ? "border-amber-300 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30"
                      : "border-zinc-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleRowSelected(row.id)}
                        aria-label={`${row.name}, ${formatCurrency(row.amount)}`}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 block">
                          {row.name}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-medium text-zinc-600 dark:text-zinc-300">
                            {getCategoryLabel(row.category)}
                          </span>
                          <span>•</span>
                          <span>{row.spentAt}</span>
                        </div>
                        {row.duplicate && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{row.duplicate.details}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Saku Selector if multiple wallets */}
            {multiSakuEnabled && wallets.length > 1 && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label htmlFor={scanSakuId} className="text-ink-soft font-medium text-sm">
                  {t.expenses.scanSakuLabel}
                </label>
                <select
                  id={scanSakuId}
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="min-h-11 rounded-xl border border-field-line bg-paper px-3 text-sm text-ink"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.emoji || "👛"} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fill the standard form instead of logging straight away */}
            <button
              type="button"
              onClick={handleApplyScanToForm}
              className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
            >
              <span>Gunakan di Form</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODE 1: STANDARD FORM */}
        {!scannedDoc && inputMode === "standard" && (
          <form id={standardFormId} onSubmit={handleStandardSubmit} className="flex flex-col gap-4 pt-3.5">
            {/* Quick-fill shortcuts: one tap fills name, category and amount */}
            <div role="group" aria-label={t.expenses.quickShortcuts} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 py-0.5">
              {chips.map((chip) => {
                const isSelected = activeChipId === chip.id && name === chip.name;
                return (
                  <ToggleChip
                    key={chip.id}
                    pressed={isSelected}
                    onClick={() => handleChipClick(chip)}
                    className="whitespace-nowrap shrink-0"
                  >
                    {chip.emoji && <span aria-hidden="true">{chip.emoji}</span>}
                    <span>{chip.name}</span>
                    {chip.defaultAmount && (
                      <span className="text-xs opacity-75 font-normal">
                        {(chip.defaultAmount / 1000).toFixed(0)}k
                      </span>
                    )}
                  </ToggleChip>
                );
              })}
              {manageChipsButton}
            </div>

            {/* Hero Amount Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor={amountId} className="text-sm font-semibold text-ink">
                {t.home.amountLabel}
              </label>
              <div className="flex items-baseline gap-2 border-b-2 border-field-line pb-1 focus-within:border-ink transition-colors">
                <span aria-hidden="true" className="text-lg font-bold text-ink-soft select-none">
                  {currencySymbol}
                </span>
                <input
                  id={amountId}
                  ref={amountInputRef}
                  type="text"
                  inputMode={currency === "IDR" ? "numeric" : "decimal"}
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  onBlur={() => setShowAmountError(true)}
                  aria-invalid={showAmountError && amountError ? true : undefined}
                  aria-describedby={showAmountError && amountError ? "quick-add-amount-error" : undefined}
                  placeholder="0"
                  // `!` beats the global 16px touch-input rule; anything 16px or larger avoids iOS focus zoom.
                  className="min-w-0 w-full bg-transparent text-3xl! font-extrabold tracking-tight outline-none placeholder:text-ink-soft/60 text-ink"
                />
                {(amount > 0 || amountDraftActive) && (
                  <button
                    type="button"
                    onClick={clearAmount}
                    aria-label={t.expenses.clearAmount}
                    className="flex h-11 w-11 shrink-0 self-center items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-line transition-colors cursor-pointer"
                  >
                    <X aria-hidden="true" className="w-4 h-4" />
                  </button>
                )}
              </div>
              {showAmountError && amountError && (
                <p id="quick-add-amount-error" role="alert" className="text-xs font-medium text-danger">
                  {amountError}
                </p>
              )}

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {(currency === "IDR"
                  ? [
                      { label: "+10k", val: 10000 },
                      { label: "+20k", val: 20000 },
                      { label: "+50k", val: 50000 },
                      { label: "+100k", val: 100000 },
                    ]
                  : [
                      { label: "+5", val: 5 },
                      { label: "+10", val: 10 },
                      { label: "+20", val: 20 },
                      { label: "+50", val: 50 },
                    ]
                ).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => addQuickAmount(item.val)}
                    aria-label={`+${formatCurrency(item.val)}`}
                    className="min-h-11 rounded-xl border border-line bg-paper hover:border-field-line text-sm font-semibold text-ink active:scale-95 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <TextField
              ref={nameInputRef}
              label={t.home.nameLabel}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setActiveChipId(null);
              }}
              placeholder={t.expenses.namePlaceholder}
              required
            />

            {/* 1-Tap Category Grid */}
            <div role="group" aria-label={t.expenses.categoryLabel} className="grid grid-cols-3 gap-2">
              {CATEGORY_KEYS.map((catKey) => {
                const Icon = CATEGORY_ICONS[catKey] || Package;
                const isSelected = category === catKey;
                const style = CATEGORY_STYLES[catKey];

                return (
                  <button
                    key={catKey}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setCategory(catKey)}
                    className={`flex min-h-12 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all text-left cursor-pointer active:scale-95 ${
                      isSelected
                        ? `${style.activeBg} border-ink ring-1 ring-ink font-bold`
                        : "border-field-line bg-card text-ink hover:bg-paper"
                    }`}
                  >
                    {isSelected ? (
                      <Check aria-hidden="true" className="w-4 h-4 shrink-0" strokeWidth={3} />
                    ) : (
                      <Icon aria-hidden="true" className={`w-4 h-4 shrink-0 ${style.activeText}`} />
                    )}
                    <span className="min-w-0 leading-tight">{getCategoryLabel(catKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Details: date, Saku, note and one-off as pills that open their own controls */}
            <div className="flex flex-col gap-2.5">
              <div role="group" aria-label={t.expenses.detailsLabel} className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  aria-expanded={openDetail === "date"}
                  aria-controls={datePanelId}
                  onClick={() => setOpenDetail((prev) => (prev === "date" ? null : "date"))}
                  className={`${detailPillClass} ${openDetail === "date" ? "border-ink bg-paper" : "border-field-line"}`}
                >
                  <Calendar aria-hidden="true" className="w-4 h-4 text-ink-soft" />
                  <span className="sr-only">{t.expenses.whenLabel}: </span>
                  <span>{dateSummary}</span>
                  <ChevronDown aria-hidden="true" className={`w-4 h-4 text-ink-soft transition-transform ${openDetail === "date" ? "rotate-180" : ""}`} />
                </button>

                {multiSakuEnabled && wallets.length > 1 && (
                  <button
                    type="button"
                    aria-expanded={openDetail === "saku"}
                    aria-controls={sakuPanelId}
                    onClick={() => setOpenDetail((prev) => (prev === "saku" ? null : "saku"))}
                    className={`${detailPillClass} ${openDetail === "saku" ? "border-ink bg-paper" : "border-field-line"}`}
                  >
                    <span aria-hidden="true">{selectedWallet?.emoji || "👛"}</span>
                    <span className="sr-only">{t.saku.switchToSaku}: </span>
                    <span>{selectedWallet?.name || t.saku.switchToSaku}</span>
                    <ChevronDown aria-hidden="true" className={`w-4 h-4 text-ink-soft transition-transform ${openDetail === "saku" ? "rotate-180" : ""}`} />
                  </button>
                )}

                <button
                  type="button"
                  aria-expanded={showNote}
                  aria-controls={notePanelId}
                  onClick={() => setShowNote((prev) => !prev)}
                  className={`${detailPillClass} ${showNote || note ? "border-ink bg-paper" : "border-dashed border-field-line text-ink-soft"}`}
                >
                  <FileText aria-hidden="true" className="w-4 h-4" />
                  <span>{t.expenses.notePill}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={isExempt}
                  aria-describedby={oneOffHintId}
                  onClick={() => setIsExempt((prev) => !prev)}
                  className={`${detailPillClass} ${isExempt ? "border-ink bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" : "border-dashed border-field-line text-ink-soft"}`}
                >
                  {isExempt ? (
                    <Check aria-hidden="true" className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Tag aria-hidden="true" className="w-4 h-4" />
                  )}
                  <span>{t.expenses.oneOffBadge}</span>
                </button>
                <span id={oneOffHintId} className="sr-only">{t.expenses.oneOffHelp}</span>
              </div>

              {openDetail === "date" && (
                <div id={datePanelId} className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-3 animate-fade-in">
                  <SegmentedControl
                    ariaLabel={t.expenses.whenLabel}
                    value={dateMode}
                    onChange={setDateMode}
                    className="bg-card"
                    options={[
                      { value: "today", label: t.common.today },
                      { value: "yesterday", label: t.common.yesterday },
                      {
                        value: "custom",
                        label: (
                          <>
                            <Calendar aria-hidden="true" className="w-4 h-4 shrink-0" />
                            <span>{t.expenses.customDate}</span>
                          </>
                        ),
                      },
                    ]}
                  />
                  {dateMode === "custom" && (
                    <TextField
                      label={t.home.dateLabel}
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      required
                      className="scheme-light dark:scheme-dark"
                    />
                  )}
                </div>
              )}

              {openDetail === "saku" && multiSakuEnabled && wallets.length > 1 && (
                <div id={sakuPanelId} role="group" aria-label={t.saku.switchToSaku} className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-paper p-3 animate-fade-in">
                  {wallets.map((w) => (
                    <ToggleChip
                      key={w.id}
                      pressed={selectedWalletId === w.id}
                      onClick={() => setSelectedWalletId(w.id)}
                      className="whitespace-nowrap"
                    >
                      <span aria-hidden="true">{w.emoji || "👛"}</span>
                      <span>{w.name}</span>
                    </ToggleChip>
                  ))}
                </div>
              )}

              {showNote && (
                <div id={notePanelId} className="animate-fade-in">
                  <TextField
                    label={t.home.noteLabel}
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.expenses.notePlaceholder}
                  />
                </div>
              )}
            </div>

            {/* Smart Anomaly Suggestion Banner */}
            {isAnomaly && (
              <div className="flex items-start justify-between gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 animate-fade-in">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles aria-hidden="true" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-snug text-xs">
                    {t.expenses.oneOffDetectBanner}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsExempt(true)}
                    className="min-h-11 rounded-xl bg-accent px-3 text-xs font-bold text-on-accent shadow-xs hover:brightness-95 active:scale-95 transition-all cursor-pointer"
                  >
                    {t.expenses.oneOffMarkButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedAnomalySuggestion(true)}
                    aria-label={t.expenses.dismissSuggestion}
                    className="-my-2 flex h-11 w-11 items-center justify-center text-amber-700 hover:text-amber-900 dark:text-amber-400 rounded-xl cursor-pointer"
                  >
                    <X aria-hidden="true" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* MODE 2: ⚡ QUICK TYPE / SMART SINGLE BAR */}
        {!scannedDoc && inputMode === "quick_type" && (
          <form id={quickFormId} onSubmit={handleQuickSubmit} className="flex flex-col gap-4 pt-3.5">
            {/* Quick-fill shortcuts in Quick Mode */}
            <div role="group" aria-label={t.expenses.quickShortcuts} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 py-0.5">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleQuickChipInQuickMode(chip)}
                  className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-field-line bg-card px-3 text-sm font-semibold text-ink hover:bg-paper transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {chip.emoji && <span aria-hidden="true">{chip.emoji}</span>}
                  <span>{chip.name}</span>
                  {chip.defaultAmount && (
                    <span className="text-xs opacity-75 font-normal">
                      {(chip.defaultAmount / 1000).toFixed(0)}k
                    </span>
                  )}
                </button>
              ))}
              {manageChipsButton}
            </div>

            {/* Command Input Bar */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={quickBarId} className="text-sm font-semibold text-ink">
                {t.expenses.quickBarLabel}
              </label>
              <div className="relative flex items-center rounded-2xl border-2 border-field-line bg-paper p-3.5 focus-within:border-ink transition-all">
                <Zap aria-hidden="true" className="w-5 h-5 text-amber-500 mr-2.5 shrink-0" />
                <input
                  id={quickBarId}
                  ref={quickInputRef}
                  type="text"
                  value={quickInput}
                  onChange={(e) => handleQuickInputChange(e.target.value)}
                  placeholder={t.expenses.quickBarPlaceholder}
                  aria-describedby={quickHintId}
                  className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink-soft/70 text-ink"
                />
                {quickInput && (
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickInputChange("");
                      quickInputRef.current?.focus();
                    }}
                    aria-label={t.expenses.clearQuickInput}
                    className="-my-2 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft hover:text-ink hover:bg-line transition-colors cursor-pointer"
                  >
                    <X aria-hidden="true" className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p id={quickHintId} className="text-xs text-ink-soft pl-1">
                {t.expenses.quickBarHint}
              </p>
            </div>

            {/* Live Parsing Preview Card with 1-Tap Overrides */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/60 p-3.5 flex flex-col gap-2.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  {t.expenses.detectedPreview}
                </span>
                {parsedExpense.isValid && (
                  <div className="flex items-center gap-1.5">
                    {effectiveIsExempt && (
                      <button
                        type="button"
                        onClick={() => setOverrideExempt(false)}
                        aria-label={`${t.expenses.oneOffRemoveButton}: One-Off`}
                        className="flex min-h-8 items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 px-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                      >
                        <Tag aria-hidden="true" className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                        <span>One-Off</span>
                        <X aria-hidden="true" className="w-3 h-3" />
                      </button>
                    )}
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Ready
                    </span>
                  </div>
                )}
              </div>

              {parsedExpense.isValid ? (
                <div className="flex flex-col gap-2 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 min-w-0 [overflow-wrap:anywhere]">
                      {parsedExpense.name}
                    </span>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-white shrink-0">
                      {formatCurrency(parsedExpense.amount || 0)}
                    </span>
                  </div>

                  {/* 1-Tap Interactive Badges */}
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    {/* Category Badge - Clickable */}
                    <button
                      type="button"
                      aria-expanded={showCategoryPicker}
                      onClick={() => {
                        setShowCategoryPicker((prev) => !prev);
                        setShowDatePicker(false);
                        setShowWalletPicker(false);
                      }}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                        CATEGORY_STYLES[effectiveCategory].badgeBg
                      } ${CATEGORY_STYLES[effectiveCategory].badgeText} ${
                        showCategoryPicker ? "ring-2 ring-zinc-400 dark:ring-zinc-600" : ""
                      }`}
                      aria-label={`${t.expenses.categoryLabel}: ${getCategoryLabel(effectiveCategory)}`}
                    >
                      {(() => {
                        const CatIcon = CATEGORY_ICONS[effectiveCategory] || Package;
                        return <CatIcon className="w-3 h-3 shrink-0" />;
                      })()}
                      <span>{getCategoryLabel(effectiveCategory)}</span>
                      <span aria-hidden="true" className="text-xs opacity-70 ml-0.5">▾</span>
                    </button>

                    {/* Date Badge - Clickable */}
                    <button
                      type="button"
                      aria-expanded={showDatePicker}
                      onClick={() => {
                        setShowDatePicker((prev) => !prev);
                        setShowCategoryPicker(false);
                        setShowWalletPicker(false);
                      }}
                      className={`flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all cursor-pointer ${
                        showDatePicker ? "ring-2 ring-zinc-400 dark:ring-zinc-600" : ""
                      }`}
                    >
                      <span className="sr-only">{t.expenses.whenLabel}: </span>
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>
                        {effectiveSpentAt === today
                          ? t.common.today
                          : effectiveSpentAt === yesterdayStr
                          ? t.common.yesterday
                          : formatDate(effectiveSpentAt, "EEEE, d MMM")}
                      </span>
                      <span aria-hidden="true" className="text-xs opacity-70 ml-0.5">▾</span>
                    </button>

                    {/* Saku Badge (Multi-Saku Enabled) */}
                    {multiSakuEnabled && wallets.length > 1 && (
                      <button
                        type="button"
                        aria-expanded={showWalletPicker}
                        onClick={() => {
                          setShowWalletPicker((prev) => !prev);
                          setShowCategoryPicker(false);
                          setShowDatePicker(false);
                        }}
                        className={`flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/60 transition-all cursor-pointer ${
                          showWalletPicker ? "ring-2 ring-zinc-400 dark:ring-zinc-600" : ""
                        }`}
                      >
                        <span className="sr-only">{t.saku.switchToSaku}: </span>
                        <span aria-hidden="true">{effectiveWallet?.emoji || "👛"}</span>
                        <span>{effectiveWallet?.name || "Dompet"}</span>
                        <span aria-hidden="true" className="text-xs opacity-70 ml-0.5">▾</span>
                      </button>
                    )}
                    {multiSakuEnabled && wallets.length === 1 && (
                      <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <span aria-hidden="true">{wallets[0].emoji || "👛"}</span>
                        <span>{wallets[0].name}</span>
                      </div>
                    )}
                  </div>

                  {/* Inline Category Picker Drawer */}
                  {showCategoryPicker && (
                    <div className="mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 grid grid-cols-3 gap-1.5 animate-fade-in shadow-xs">
                      {CATEGORY_KEYS.map((catKey) => {
                        const Icon = CATEGORY_ICONS[catKey] || Package;
                        const isSel = effectiveCategory === catKey;
                        const style = CATEGORY_STYLES[catKey];
                        return (
                          <button
                            key={catKey}
                            type="button"
                            aria-pressed={isSel}
                            onClick={() => {
                              setOverrideCategory(catKey);
                              setShowCategoryPicker(false);
                            }}
                            className={`flex min-h-11 items-center gap-1.5 rounded-lg p-2 text-xs font-medium transition-all text-left cursor-pointer ${
                              isSel
                                ? `${style.activeBg} ring-1 ring-ink font-bold`
                                : "hover:bg-paper text-ink"
                            }`}
                          >
                            {isSel ? (
                              <Check aria-hidden="true" className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                            ) : (
                              <Icon aria-hidden="true" className={`w-3.5 h-3.5 shrink-0 ${style.activeText}`} />
                            )}
                            <span className="min-w-0 text-xs leading-tight">{getCategoryLabel(catKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Date Picker Drawer */}
                  {showDatePicker && (
                    <div className="mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 flex flex-col gap-2 animate-fade-in shadow-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-pressed={effectiveSpentAt === today}
                          onClick={() => {
                            setOverrideDate(today);
                            setShowDatePicker(false);
                          }}
                          className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            effectiveSpentAt === today
                              ? "bg-ink text-card font-bold"
                              : "bg-paper text-ink"
                          }`}
                        >
                          {effectiveSpentAt === today && <Check aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={3} />}
                          {t.common.today}
                        </button>
                        <button
                          type="button"
                          aria-pressed={effectiveSpentAt === yesterdayStr}
                          onClick={() => {
                            setOverrideDate(yesterdayStr);
                            setShowDatePicker(false);
                          }}
                          className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            effectiveSpentAt === yesterdayStr
                              ? "bg-ink text-card font-bold"
                              : "bg-paper text-ink"
                          }`}
                        >
                          {effectiveSpentAt === yesterdayStr && <Check aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={3} />}
                          {t.common.yesterday}
                        </button>
                      </div>
                      <div className="pt-1 border-t border-line">
                        <TextField
                          label={t.expenses.customDate}
                          type="date"
                          value={effectiveSpentAt}
                          onChange={(e) => {
                            setOverrideDate(e.target.value);
                            setShowDatePicker(false);
                          }}
                          className="scheme-light dark:scheme-dark"
                        />
                      </div>
                    </div>
                  )}

                  {/* Inline Saku Picker Drawer */}
                  {showWalletPicker && multiSakuEnabled && wallets.length > 1 && (
                    <div
                      role="group"
                      aria-label={t.saku.switchToSaku}
                      className="mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 flex flex-wrap gap-1.5 animate-fade-in shadow-xs"
                    >
                      {wallets.map((w) => (
                        <ToggleChip
                          key={w.id}
                          pressed={effectiveWalletId === w.id}
                          onClick={() => {
                            setOverrideWalletId(w.id);
                            // Also the default for the next entry when "keep open" is on.
                            setSelectedWalletId(w.id);
                            setShowWalletPicker(false);
                          }}
                          className="whitespace-nowrap"
                        >
                          <span aria-hidden="true">{w.emoji || "👛"}</span>
                          <span>{w.name}</span>
                        </ToggleChip>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-1">
                  {quickInput.trim()
                    ? t.expenses.quickTypeParseError
                    : "e.g. 'Makan siang 25k', '2x Kopi 18k semalam', 'Bensin 30k'"}
                </p>
              )}
            </div>

            {/* Smart Splurge Anomaly Suggestion Banner in Quick Mode */}
            {isQuickAnomaly && (
              <div className="flex items-start justify-between gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 animate-fade-in">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-snug text-xs">
                    {t.expenses.oneOffDetectBanner}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setOverrideExempt(true)}
                    className="min-h-11 rounded-xl bg-accent px-3 text-xs font-bold text-on-accent shadow-xs hover:brightness-95 active:scale-95 transition-all cursor-pointer"
                  >
                    {t.expenses.oneOffMarkButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedAnomalySuggestion(true)}
                    aria-label={t.expenses.dismissSuggestion}
                    className="-my-2 flex h-11 w-11 items-center justify-center text-amber-700 hover:text-amber-900 dark:text-amber-400 rounded-xl cursor-pointer"
                  >
                    <X aria-hidden="true" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Keep Open for Batch Consecutive Logging Toggle */}
            <CheckboxField
              className="rounded-xl border border-line px-3"
              checked={keepBatch}
              onChange={(e) => handleKeepBatchToggle(e.target.checked)}
              label={
                <span className="flex items-center gap-2">
                  <FileText aria-hidden="true" className="w-4 h-4 text-ink-soft" />
                  {t.expenses.keepOpenBatch}
                </span>
              }
            />

          </form>
        )}

        </div>
        {/* End of scrolling body */}

        {/* Pinned footer: the primary action for whichever view is showing */}
        <div className="shrink-0 border-t border-line bg-card px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          {scannedDoc ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDismissScan}
                className="min-h-12 rounded-xl px-4 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || selectedScanCount === 0}
                onClick={handleLogScannedRows}
                className={`${primaryButtonClass} flex-1`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                    <span>Mencatat...</span>
                  </>
                ) : (
                  <>
                    <Check aria-hidden="true" className="w-4 h-4" strokeWidth={3} />
                    <span>Catat {selectedScanCount} Transaksi</span>
                  </>
                )}
              </button>
            </div>
          ) : inputMode === "standard" ? (
            <button type="submit" form={standardFormId} disabled={isSubmitting} className={`${primaryButtonClass} w-full`}>
              {isSubmitting ? (
                <span>{t.common.adding}</span>
              ) : (
                <>
                  <span>{t.expenses.addTitle}</span>
                  {amount > 0 && <span className="font-semibold opacity-85">· {formatCurrency(amount)}</span>}
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              form={quickFormId}
              disabled={isSubmitting || !parsedExpense.isValid}
              className={`${primaryButtonClass} w-full`}
            >
              {isSubmitting ? (
                <span>{t.common.adding}</span>
              ) : (
                <>
                  <span>{t.expenses.addTitle}</span>
                  {parsedExpense.amount ? (
                    <span className="font-semibold opacity-85">· {formatCurrency(parsedExpense.amount)}</span>
                  ) : null}
                </>
              )}
            </button>
          )}
        </div>

        </div>

        {/* Shortcut manager: covers the form; Escape closes it and focus returns to "Kelola". */}
        {isManagingChips && (
          <div
            ref={chipManagerRef}
            role="group"
            aria-labelledby={chipManagerTitleId}
            className="absolute inset-0 z-20 rounded-t-3xl sm:rounded-2xl bg-card text-ink p-5 flex flex-col gap-3.5 animate-modal-in overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-line">
              <div>
                <h3 id={chipManagerTitleId} className="text-base font-bold text-ink">
                  {t.expenses.manageChipsTitle}
                </h3>
                <p className="text-sm text-ink-soft">{t.expenses.manageChipsSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeChipManager}
                aria-label={t.expenses.closeChipManager}
                className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-paper hover:text-ink"
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing chips */}
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {chips.map((chip) => (
                <li
                  key={chip.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-paper py-1 pl-3 pr-1 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {chip.emoji && <span aria-hidden="true" className="text-base">{chip.emoji}</span>}
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{chip.name}</p>
                      <span className="text-xs text-ink-soft">
                        {getCategoryLabel(chip.category)}
                        {chip.defaultAmount ? ` • ${formatCurrency(chip.defaultAmount)}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEditChip(chip)}
                      aria-label={t.expenses.editChipAria.replace("{name}", chip.name)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:text-ink hover:bg-line cursor-pointer"
                    >
                      <Pencil aria-hidden="true" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChip(chip.id)}
                      aria-label={t.expenses.deleteChipAria.replace("{name}", chip.name)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-danger-soft cursor-pointer"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add / Edit Chip Form */}
            <form onSubmit={handleSaveChip} className="flex flex-col gap-3 pt-2 border-t border-line">
              <h4 className="text-sm font-bold text-ink">
                {chipToEdit ? t.expenses.editChip : t.expenses.addChip}
              </h4>

              <div className="grid grid-cols-[6rem_1fr] gap-2">
                <TextField
                  label={t.expenses.chipEmojiLabel}
                  type="text"
                  value={newChipEmoji}
                  onChange={(e) => setNewChipEmoji(e.target.value)}
                  placeholder="🍔"
                  className="text-center"
                />
                <TextField
                  label={t.expenses.chipNameLabel}
                  type="text"
                  value={newChipName}
                  onChange={(e) => setNewChipName(e.target.value)}
                  placeholder={t.expenses.chipNamePlaceholder}
                  required
                />
              </div>

              <SelectField
                label={t.expenses.categoryLabel}
                value={newChipCategory}
                onChange={(e) => setNewChipCategory(e.target.value as CategoryKey)}
              >
                {CATEGORY_KEYS.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </SelectField>

              {currency === "IDR" ? (
                <MoneyField
                  label={t.expenses.defaultAmountLabel}
                  value={newChipAmount}
                  onChange={(value) => {
                    setNewChipAmount(value);
                    setChipAmountError(null);
                  }}
                  prefix={currencySymbol}
                  allowZero
                  error={chipAmountError}
                />
              ) : (
                <TextField
                  label={`${t.expenses.defaultAmountLabel} (${currencySymbol})`}
                  type="text"
                  inputMode="decimal"
                  value={newChipAmount}
                  onChange={(e) => {
                    setNewChipAmount(e.target.value);
                    setChipAmountError(null);
                  }}
                  error={chipAmountError}
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetChips}
                  className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm text-ink-soft hover:bg-paper hover:text-ink cursor-pointer"
                >
                  <RotateCcw aria-hidden="true" className="w-4 h-4" />
                  <span>{t.expenses.resetDefaults}</span>
                </button>

                <div className="flex gap-2">
                  {chipToEdit && (
                    <button
                      type="button"
                      onClick={handleOpenAddChip}
                      className="min-h-11 rounded-xl border border-field-line px-3 text-sm font-semibold text-ink hover:bg-paper cursor-pointer"
                    >
                      {t.common.cancel}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-card hover:opacity-90 cursor-pointer"
                  >
                    {t.expenses.saveChip}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Interactive Image Upload & Editor Modal */}
        <ImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          context="expense"
          onApply={handleApplyScannedDoc}
        />
      </div>
    </ModalOverlay>
  );
}

export function QuickAddModal({
  isOpen,
  onClose,
  today,
  multiSakuEnabled = false,
}: QuickAddModalProps) {
  if (!isOpen) return null;
  return (
    <QuickAddModalContent
      onClose={onClose}
      today={today}
      multiSakuEnabled={multiSakuEnabled}
    />
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