"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  Eye,
  Check,
  Info,
  Utensils,
  Zap,
  Camera,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  calculateSplitBreakdown,
  saveSplitDraft,
  loadSplitDraft,
  clearSplitDraft,
  invalidateSplitCache,
  SplitBillRecord,
  SplitItemRecord,
  SplitParticipantRecord,
} from "@/utils/splitCalculator";
import { createSplitBill, updateSplitBill } from "@/app/split/actions";
import FriendViewPreviewModal from "./FriendViewPreviewModal";
import { useTranslation } from "@/utils/i18n/context";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";
import { useImageExtract } from "@/utils/ai/useImageExtract";
import { ExtractedDocument } from "@/utils/ai/vision";
import { ImageUploadModal } from "@/app/ai/ImageUploadModal";

interface FormParticipant {
  id: string;
  name: string;
  isCreator: boolean;
  isPaid?: boolean;
}

interface FormItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedParticipantIds: string[];
}

import type { Wallet } from "@/utils/wallets/server";
import ModalOverlay from "@/app/ui/ModalOverlay";
import { AmountInput } from "@/app/ui/Field";

export interface SplitBillInitialData {
  bill: SplitBillRecord;
  participants: SplitParticipantRecord[];
  items: SplitItemRecord[];
  loggedWalletId?: string | null;
}

interface SplitBillCreatorProps {
  creatorName: string;
  defaultPayment: {
    method?: string;
    account_number?: string;
    account_name?: string;
    note?: string;
  } | null;
  wallets?: Wallet[];
  multiSakuEnabled?: boolean;
  defaultWalletId?: string | null;
  mode?: "create" | "edit";
  initialData?: SplitBillInitialData;
}

const PAYMENT_METHODS = [
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "Bank Jago",
  "GoPay",
  "Dana",
  "OVO",
  "ShopeePay",
  "Tunai (Cash)",
];

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Utilities",
  "Academics",
  "Entertainment",
  "Others",
];

export default function SplitBillCreator({
  creatorName,
  defaultPayment,
  wallets = [],
  multiSakuEnabled = false,
  defaultWalletId = null,
  mode = "create",
  initialData,
}: SplitBillCreatorProps) {
  const router = useRouter();
  const { formatCurrency, currencySymbol, currency, t } = useTranslation();
  const isEditMode = mode === "edit" && Boolean(initialData);

  // General Bill Info
  const [title, setTitle] = useState(() => initialData?.bill.title || "");
  const [splitMode, setSplitMode] = useState<"itemized" | "equal">(
    () => initialData?.bill.split_mode || "itemized"
  );
  const [category, setCategory] = useState(
    () => initialData?.bill.category || "Food & Dining"
  );
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    () =>
      initialData?.loggedWalletId ||
      defaultWalletId ||
      wallets.find((w) => w.is_primary)?.id ||
      wallets[0]?.id ||
      ""
  );

  // Participants
  const [participants, setParticipants] = useState<FormParticipant[]>(() => {
    if (initialData && initialData.participants.length > 0) {
      return initialData.participants.map((p) => ({
        id: p.id,
        name: p.name,
        isCreator: Boolean(p.is_creator),
        isPaid: Boolean(p.is_paid),
      }));
    }
    return [{ id: "creator-0", name: creatorName || "Saya", isCreator: true, isPaid: true }];
  });
  const [friendNameInput, setFriendNameInput] = useState("");

  // Items
  const [items, setItems] = useState<FormItem[]>(() => {
    if (initialData && initialData.items.length > 0) {
      const allPartIds = initialData.participants.map((p) => p.id);
      return initialData.items.map((it) => ({
        id: it.id,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        assignedParticipantIds:
          it.assigned_participant_ids && it.assigned_participant_ids.length > 0
            ? it.assigned_participant_ids
            : allPartIds,
      }));
    }
    return [
      {
        id: "item-1",
        name: "",
        price: 0,
        quantity: 1,
        assignedParticipantIds: ["creator-0"],
      },
    ];
  });

  // Adjustments & Taxes
  const [taxPreset, setTaxPreset] = useState<"0" | "10" | "11" | "custom">(() => {
    if (!initialData) return "0";
    const tax = Number(initialData.bill.tax_percentage) || 0;
    if (tax === 0) return "0";
    if (tax === 10) return "10";
    if (tax === 11) return "11";
    return "custom";
  });
  const [customTax, setCustomTax] = useState<number>(() => {
    if (!initialData) return 0;
    const tax = Number(initialData.bill.tax_percentage) || 0;
    return tax !== 0 && tax !== 10 && tax !== 11 ? tax : 0;
  });
  const [servicePercentage, setServicePercentage] = useState<number>(
    () => Number(initialData?.bill.service_percentage) || 0
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    () => Number(initialData?.bill.discount_amount) || 0
  );
  const [extraFee, setExtraFee] = useState<number>(
    () => Number(initialData?.bill.extra_fee) || 0
  );
  const [roundingStep, setRoundingStep] = useState<number>(
    () => (initialData?.bill.rounding_step !== undefined ? Number(initialData.bill.rounding_step) : 100)
  );

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState(
    () => initialData?.bill.payment_info?.method || defaultPayment?.method || "BCA"
  );
  const [accountNumber, setAccountNumber] = useState(
    () => initialData?.bill.payment_info?.account_number ?? defaultPayment?.account_number ?? ""
  );
  const [accountName, setAccountName] = useState(
    () => initialData?.bill.payment_info?.account_name ?? defaultPayment?.account_name ?? creatorName ?? ""
  );
  const [saveAsDefault, setSaveAsDefault] = useState(
    () => (isEditMode ? false : !defaultPayment?.account_number)
  );

  // Tracker Integration
  const [autoLogToTracker, setAutoLogToTracker] = useState(
    () => (isEditMode ? Boolean(initialData?.bill.logged_expense_id) : true)
  );

  // UI States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);

  // Vision OCR Scan State
  const { isAiEnabled } = useAiAssistant();
  const {
    error: extractError,
    clearError: clearExtractError,
  } = useImageExtract({ hint: "split" });
  const [scannedReceiptTotal, setScannedReceiptTotal] = useState<number | null>(null);
  const [pendingScannedDoc, setPendingScannedDoc] = useState<ExtractedDocument | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const applyExtractedBill = (doc: ExtractedDocument, appendMode: boolean) => {
    if (!title.trim() && doc.merchant) {
      setTitle(doc.merchant);
    }
    if (doc.suggestedCategory) {
      setCategory(doc.suggestedCategory);
    }

    // Scanned items start shared by everyone, the same default as a manually added item.
    const everyoneIds = participants.map((p) => p.id);

    const mappedItems: FormItem[] = doc.items.map((it, idx) => ({
      id: `item-scan-${Date.now()}-${idx}`,
      name: it.name,
      price: it.unitPrice,
      quantity: it.quantity || 1,
      assignedParticipantIds: everyoneIds,
    }));

    if (appendMode) {
      const existingFilled = items.filter((it) => it.name.trim() || it.price > 0);
      setItems([...existingFilled, ...mappedItems]);
    } else {
      setItems(
        mappedItems.length > 0
          ? mappedItems
          : [
              {
                id: "item-1",
                name: doc.merchant || "Tagihan Struk",
                price: doc.total || 0,
                quantity: 1,
                assignedParticipantIds: everyoneIds,
              },
            ]
      );
    }

    // Taxes
    if (doc.subtotal && doc.taxAmount && doc.subtotal > 0) {
      const taxRatio = (doc.taxAmount / doc.subtotal) * 100;
      if (Math.abs(taxRatio - 11) < 0.8) {
        setTaxPreset("11");
        setCustomTax(0);
      } else if (Math.abs(taxRatio - 10) < 0.8) {
        setTaxPreset("10");
        setCustomTax(0);
      } else if (taxRatio > 0) {
        setTaxPreset("custom");
        setCustomTax(Math.round(taxRatio * 10) / 10);
      }
    }

    // Service Charge
    if (doc.subtotal && doc.serviceAmount && doc.subtotal > 0) {
      const srvRatio = (doc.serviceAmount / doc.subtotal) * 100;
      setServicePercentage(Math.round(srvRatio * 10) / 10);
    }

    // Discount
    if (doc.discountAmount && doc.discountAmount > 0) {
      setDiscountAmount(doc.discountAmount);
    }

    if (doc.total) {
      setScannedReceiptTotal(doc.total);
    }

    setSplitMode("itemized");
    setPendingScannedDoc(null);
    setShowReplaceDialog(false);
  };

  const handleApplyScannedDoc = (doc: ExtractedDocument) => {
    clearExtractError();
    setErrorMsg("");

    const hasExistingItems =
      items.length > 1 || (items.length === 1 && (items[0].name.trim().length > 0 || items[0].price > 0));

    if (hasExistingItems) {
      setPendingScannedDoc(doc);
      setShowReplaceDialog(true);
    } else {
      applyExtractedBill(doc, false);
    }
  };

  // Check for existing draft on client mount to avoid hydration mismatch
  useEffect(() => {
    if (isEditMode) return;
    const timer = setTimeout(() => {
      const draft = loadSplitDraft<{
        title?: string;
        participants?: FormParticipant[];
      }>();
      if (draft && draft.title && draft.participants && draft.participants.length > 0) {
        setDraftNotice(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isEditMode]);

  // Compute effective tax percentage
  const effectiveTaxPercentage = useMemo(() => {
    if (taxPreset === "0") return 0;
    if (taxPreset === "10") return 10;
    if (taxPreset === "11") return 11;
    return Math.max(0, customTax || 0);
  }, [taxPreset, customTax]);

  const handleRestoreDraft = () => {
    const draft = loadSplitDraft<{
      title: string;
      splitMode: "itemized" | "equal";
      participants: FormParticipant[];
      items: FormItem[];
      taxPreset: "0" | "10" | "11" | "custom";
      customTax: number;
      servicePercentage: number;
      discountAmount: number;
      extraFee: number;
    }>();

    if (draft) {
      setTitle(draft.title || "");
      setSplitMode(draft.splitMode || "itemized");
      if (draft.participants) setParticipants(draft.participants);
      if (draft.items) setItems(draft.items);
      if (draft.taxPreset) setTaxPreset(draft.taxPreset);
      if (draft.customTax !== undefined) setCustomTax(draft.customTax);
      if (draft.servicePercentage !== undefined) setServicePercentage(draft.servicePercentage);
      if (draft.discountAmount !== undefined) setDiscountAmount(draft.discountAmount);
      if (draft.extraFee !== undefined) setExtraFee(draft.extraFee);
    }
    setDraftNotice(false);
  };

  const handleDiscardDraft = () => {
    clearSplitDraft();
    setDraftNotice(false);
  };

  // Auto-Save Draft to LocalStorage whenever key fields change
  useEffect(() => {
    if (isEditMode) return;
    if (!title && items.length === 1 && !items[0].name) return;
    const timeout = setTimeout(() => {
      saveSplitDraft({
        title,
        splitMode,
        participants,
        items,
        taxPreset,
        customTax,
        servicePercentage,
        discountAmount,
        extraFee,
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [isEditMode, title, splitMode, participants, items, taxPreset, customTax, servicePercentage, discountAmount, extraFee]);

  // Real-Time Calculation (Memoized for zero keystroke lag)
  const calculation = useMemo(() => {
    const calcItems: SplitItemRecord[] = items.map((it) => ({
      id: it.id,
      name: it.name || "Item",
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      assigned_participant_ids: it.assignedParticipantIds,
    }));

    const calcParts: SplitParticipantRecord[] = participants.map((p) => ({
      id: p.id,
      bill_id: initialData?.bill.id || "preview",
      name: p.name,
      is_creator: p.isCreator,
      is_paid: p.isPaid !== undefined ? p.isPaid : p.isCreator,
    }));

    return calculateSplitBreakdown(
      {
        split_mode: splitMode,
        tax_percentage: effectiveTaxPercentage,
        service_percentage: servicePercentage,
        discount_amount: discountAmount,
        extra_fee: extraFee,
        rounding_step: roundingStep,
      },
      calcItems,
      calcParts
    );
  }, [
    items,
    participants,
    splitMode,
    effectiveTaxPercentage,
    servicePercentage,
    discountAmount,
    extraFee,
    roundingStep,
  ]);

  // Itemized items with nobody on them. Publishing waits until each has an owner.
  const unassignedItemIds = useMemo(
    () =>
      new Set(
        splitMode === "itemized"
          ? calculation.unassignedItems.map((it) => it.itemId)
          : []
      ),
    [calculation, splitMode]
  );

  const creatorShare = useMemo(() => {
    const creator = calculation.participants.find((p) => p.isCreator);
    return creator?.totalOwed || 0;
  }, [calculation]);

  // Participant Management
  const handleAddParticipant = () => {
    const trimmed = friendNameInput.trim();
    if (!trimmed) return;
    if (participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(t.splitBill.friendExistsError.replace("{name}", trimmed));
      return;
    }
    const newId = `part-${Date.now()}`;
    const newPart: FormParticipant = { id: newId, name: trimmed, isCreator: false };
    setParticipants([...participants, newPart]);
    // An item shared by everyone so far stays shared by everyone, so the host
    // is not charged for the whole bill just because friends were added later.
    const currentIds = participants.map((p) => p.id);
    setItems((prev) =>
      prev.map((it) =>
        currentIds.every((pId) => it.assignedParticipantIds.includes(pId))
          ? { ...it, assignedParticipantIds: [...it.assignedParticipantIds, newId] }
          : it
      )
    );
    setFriendNameInput("");
    setErrorMsg("");
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.find((p) => p.id === id)?.isCreator) return;
    const remaining = participants.filter((p) => p.id !== id);
    setParticipants(remaining);

    // Take them off their items. An item that was theirs alone becomes "Belum dibagi"
    // and blocks publishing until the host decides who pays for it; it is never
    // quietly spread over everyone who is left.
    setItems((prev) =>
      prev.map((it) => ({ ...it, assignedParticipantIds: it.assignedParticipantIds.filter((pId) => pId !== id) }))
    );
  };

  // Items Management
  const handleAddItem = () => {
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      name: "",
      price: 0,
      quantity: 1,
      assignedParticipantIds: participants.map((p) => p.id), // defaults to everyone
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<FormItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const toggleItemParticipant = (itemId: string, participantId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.assignedParticipantIds.includes(participantId);
        let nextIds: string[];
        if (exists) {
          nextIds = it.assignedParticipantIds.filter((id) => id !== participantId);
          if (nextIds.length === 0) nextIds = [participantId]; // keep at least one
        } else {
          nextIds = [...it.assignedParticipantIds, participantId];
        }
        return { ...it, assignedParticipantIds: nextIds };
      })
    );
  };

  const assignItemToAll = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, assignedParticipantIds: participants.map((p) => p.id) }
          : it
      )
    );
  };

  // Submit Handler
  const handlePublish = async () => {
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg(t.splitBill.errTitleRequired);
      return;
    }

    if (items.length === 0 || (items.length === 1 && !items[0].price)) {
      setErrorMsg(t.splitBill.errItemsRequired);
      return;
    }

    if (splitMode === "itemized" && unassignedItemIds.size > 0) {
      const names = items
        .filter((it) => unassignedItemIds.has(it.id))
        .map((it, i) => it.name.trim() || t.splitBill.itemNameAria.replace("{index}", String(i + 1)))
        .join(", ");
      setErrorMsg(t.splitBill.errUnassignedItems.replace("{names}", names));
      return;
    }

    if (calculation.grandTotal <= 0) {
      setErrorMsg(t.splitBill.errTotalZero.replace("{amount}", formatCurrency(0)));
      return;
    }

    setIsPublishing(true);

    try {
      // Map participants to index-based payload
      const participantIdToIndex = new Map<string, number>();
      participants.forEach((p, idx) => participantIdToIndex.set(p.id, idx));

      const payloadItems = items.map((it) => ({
        name: it.name.trim() || "Menu",
        price: Number(it.price) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        assignedParticipantIndices: it.assignedParticipantIds
          .map((id) => participantIdToIndex.get(id))
          .filter((idx): idx is number => idx !== undefined),
      }));

      const payload = {
        title: title.trim(),
        splitMode,
        taxPercentage: effectiveTaxPercentage,
        servicePercentage,
        discountAmount,
        extraFee,
        roundingStep,
        paymentInfo: {
          method: paymentMethod,
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
        },
        saveAsDefaultPayment: saveAsDefault,
        autoLogToTracker,
        walletId: selectedWalletId || null,
        category,
        participants: participants.map((p) => ({
          id: p.id.startsWith("part-") || p.id.startsWith("creator-") ? undefined : p.id,
          name: p.name,
          isCreator: p.isCreator,
        })),
        items: payloadItems,
      };

      if (isEditMode && initialData) {
        await updateSplitBill(initialData.bill.id, payload);
        invalidateSplitCache(initialData.bill.id);
        router.push(`/split/${initialData.bill.id}`);
        router.refresh();
      } else {
        const res = await createSplitBill(payload);

        // Clear draft on successful creation
        clearSplitDraft();

        // Redirect directly to the generated bill share route
        router.push(`/split/${res.billId}`);
      }
    } catch (err: unknown) {
      const fallbackError = isEditMode ? t.splitBill.errGenericUpdate : t.splitBill.errGenericCreate;
      const message = err instanceof Error ? err.message : fallbackError;
      setErrorMsg(message);
      setIsPublishing(false);
    }
  };

  const formatRupiah = (amt: number) => {
    return formatCurrency(amt);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={isEditMode && initialData ? `/split/${initialData.bill.id}` : "/split"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEditMode ? t.splitBill.backToBill : t.splitBill.historyBack}</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          {isEditMode ? t.splitBill.editSplitBadge : t.splitBill.newSplitBadge}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          {isEditMode ? t.splitBill.editSplitTitle : t.splitBill.newSplitTitle}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {isEditMode ? t.splitBill.editSplitSubtitle : t.splitBill.newSplitSubtitle}
        </p>
      </div>

      {/* Draft Notification */}
      {draftNotice && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{t.splitBill.draftFoundNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-2.5 py-1 bg-accent hover:brightness-95 text-on-accent font-semibold rounded-lg cursor-pointer"
            >
              {t.splitBill.restoreDraftBtn}
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 cursor-pointer"
            >
              {t.splitBill.discardDraftBtn}
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
          {errorMsg}
        </div>
      )}

      {/* SECTION 1: General Info & Mode */}
      <section className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t.splitBill.step1Title}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.splitBill.step1Subtitle}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            {t.splitBill.billTitleLabel}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.splitBill.billTitlePlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          />

          {/* Quick presets for title */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              t.splitBill.presetLunch,
              t.splitBill.presetCoffee,
              t.splitBill.presetElectricity,
              t.splitBill.presetWifi,
              t.splitBill.presetGroceries,
            ].map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setTitle(sug)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Elaborated Split Mode Switcher (Moved below Bill Name) */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {t.splitBill.splitMethodLabel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Option 1: Itemized */}
            <button
              type="button"
              onClick={() => setSplitMode("itemized")}
              aria-pressed={splitMode === "itemized"}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                splitMode === "itemized"
                  ? "border-accent bg-card text-ink ring-2 ring-accent"
                  : "border-line bg-card text-ink hover:bg-paper"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        splitMode === "itemized"
                          ? "bg-accent text-on-accent"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">{t.splitBill.modeItemizedTitle}</h3>
                      <p
                        className={`text-xs font-semibold ${
                          splitMode === "itemized"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {t.splitBill.modeItemizedSubtitle}
                      </p>
                    </div>
                  </div>
                  {splitMode === "itemized" && (
                    <Check className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" />
                  )}
                </div>
                <p
                  className={`text-xs mt-2 leading-relaxed ${
                    splitMode === "itemized"
                      ? "text-ink-soft"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {t.splitBill.modeItemizedDesc}
                </p>
              </div>
            </button>

            {/* Option 2: Equal */}
            <button
              type="button"
              onClick={() => setSplitMode("equal")}
              aria-pressed={splitMode === "equal"}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                splitMode === "equal"
                  ? "border-accent bg-card text-ink ring-2 ring-accent"
                  : "border-line bg-card text-ink hover:bg-paper"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        splitMode === "equal"
                          ? "bg-accent text-on-accent"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">{t.splitBill.modeEqualTitle}</h3>
                      <p
                        className={`text-xs font-semibold ${
                          splitMode === "equal"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {t.splitBill.modeEqualSubtitle}
                      </p>
                    </div>
                  </div>
                  {splitMode === "equal" && (
                    <Check className="w-4 h-4 text-accent-strong shrink-0 mt-0.5" />
                  )}
                </div>
                <p
                  className={`text-xs mt-2 leading-relaxed ${
                    splitMode === "equal"
                      ? "text-ink-soft"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {t.splitBill.modeEqualDesc}
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Participants */}
      <section className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t.splitBill.step2Title}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.splitBill.step2Subtitle.replace("{count}", String(participants.length))}
            </p>
          </div>
        </div>

        {/* Input Add Friend */}
        <div className="flex gap-2">
          <input
            type="text"
            value={friendNameInput}
            onChange={(e) => setFriendNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddParticipant();
              }
            }}
            placeholder={t.splitBill.friendNamePlaceholder}
            className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            type="button"
            onClick={handleAddParticipant}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.splitBill.addFriendBtn}</span>
          </button>
        </div>

        {/* Participant Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {participants.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                p.isCreator
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              }`}
            >
              <span>{p.name}</span>
              {p.isCreator ? (
                <span className="text-xs opacity-75 font-semibold">({t.splitBill.hostBadge})</span>
              ) : (
                <>
                  {isEditMode && p.isPaid && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {t.splitBill.paidBadgeText}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    aria-label={t.splitBill.removeParticipantAria.replace("{name}", p.name)}
                    className="text-zinc-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Items & Assignments */}
      <section className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {splitMode === "itemized" ? t.splitBill.step3Title : t.splitBill.totalBillTitle}
              </h2>
              <p className="text-xs text-zinc-400">
                {splitMode === "itemized"
                  ? t.splitBill.step3SubtitleItemized
                  : t.splitBill.step3SubtitleEqual}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAiEnabled && (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 active:scale-95 transition-all cursor-pointer"
                title="Pindai foto struk belanja untuk mengisi otomatis item, pajak, dan diskon"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Scan Struk</span>
              </button>
            )}

            {splitMode === "itemized" && (
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.splitBill.addItemBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scan Error Banner */}
        {extractError && (
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{extractError}</span>
            </div>
            <button
              type="button"
              onClick={clearExtractError}
              className="text-rose-400 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Receipt Discrepancy Notice */}
        {scannedReceiptTotal !== null && Math.abs(calculation.grandTotal - scannedReceiptTotal) > 500 && (
          <div className="flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/80">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Total struk: <strong>{formatCurrency(scannedReceiptTotal)}</strong> vs Total terhitung: <strong>{formatCurrency(calculation.grandTotal)}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setScannedReceiptTotal(null)}
              className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              title="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Item Cards */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const isUnassigned = unassignedItemIds.has(item.id);
            return (
            <div
              key={item.id}
              className={`rounded-2xl border p-3.5 space-y-3 ${
                isUnassigned
                  ? "border-danger bg-danger-soft"
                  : "border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                  aria-label={t.splitBill.itemNameAria.replace("{index}", String(index + 1))}
                  placeholder={
                    splitMode === "itemized"
                      ? t.splitBill.menuItemPlaceholder.replace("{index}", String(index + 1))
                      : t.splitBill.totalAmountPlaceholder
                  }
                  className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={t.splitBill.deleteItemAria}
                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quantity and price on their own line, so an 8-digit price stays readable at 320px */}
              <div className="flex items-start gap-2">
                {splitMode === "itemized" && (
                  <div className="relative w-20 shrink-0">
                    <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                      &times;
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      aria-label={t.splitBill.itemQtyAria.replace("{index}", String(index + 1))}
                      value={item.quantity || 1}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        })
                      }
                      className="w-full pl-6 pr-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                )}

                <AmountInput
                  value={item.price}
                  onChange={(price) => handleUpdateItem(item.id, { price })}
                  currency={currency}
                  prefix={currencySymbol}
                  ariaLabel={t.splitBill.itemPriceAria.replace("{index}", String(index + 1))}
                  className="min-w-0 flex-1"
                  inputClassName="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {splitMode === "itemized" && isUnassigned && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" aria-hidden="true" />
                  <span>
                    {t.splitBill.unassignedBadge}: {t.splitBill.unassignedHint}
                  </span>
                </p>
              )}

              {/* Participant Assignment Chips (only for itemized mode) */}
              {splitMode === "itemized" && (
                <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {t.splitBill.assignedToLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => assignItemToAll(item.id)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      {t.splitBill.assignAllBtn.replace("{count}", String(participants.length))}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {participants.map((p) => {
                      const isAssigned = item.assignedParticipantIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleItemParticipant(item.id, p.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isAssigned
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold"
                              : "bg-white text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            );
          })}

          {splitMode === "itemized" && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.splitBill.addAnotherItemBtn}</span>
            </button>
          )}
        </div>
      </section>

      {/* SECTION 4: Tax, Service & Adjustments */}
      <section className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t.splitBill.step4Title}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.splitBill.step4Subtitle}
            </p>
          </div>
        </div>

        {/* Tax Presets */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            {t.splitBill.taxLabel}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "0", label: t.splitBill.taxPresetNone, desc: t.splitBill.taxPresetNoneDesc },
              { id: "10", label: t.splitBill.taxPresetPB1, desc: t.splitBill.taxPresetPB1Desc },
              { id: "11", label: t.splitBill.taxPresetPPN, desc: t.splitBill.taxPresetPPNDesc },
              { id: "custom", label: t.splitBill.taxPresetCustom, desc: t.splitBill.taxPresetCustomDesc },
            ].map((p) => {
              const active = taxPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTaxPreset(p.id as typeof taxPreset)}
                  aria-pressed={active}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? "border-accent bg-card text-ink ring-2 ring-accent"
                      : "border-line bg-card text-ink hover:bg-paper"
                  }`}
                >
                  <p className="text-xs font-bold">{p.label}</p>
                  <p className="text-xs text-ink-soft">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {taxPreset === "custom" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-zinc-500">{t.splitBill.taxPercentageLabel}</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={customTax || ""}
                onChange={(e) => setCustomTax(Number(e.target.value))}
                placeholder="cth: 12"
                className="w-24 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-right"
              />
              <span className="text-xs font-bold text-zinc-500">%</span>
            </div>
          )}
        </div>

        {/* Service, Discount, Fee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Service Charge */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              {t.splitBill.servicePercentageLabel}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={servicePercentage || ""}
                onChange={(e) => setServicePercentage(Number(e.target.value))}
                placeholder="0"
                className="w-full pr-7 pl-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-semibold text-zinc-900 dark:text-zinc-100 text-right focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                %
              </span>
            </div>
          </div>

          {/* Delivery / Extra Fee */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              {t.splitBill.extraFeeInputLabel}
            </label>
            <AmountInput
              value={extraFee}
              onChange={setExtraFee}
              currency={currency}
              prefix={currencySymbol}
              ariaLabel={t.splitBill.extraFeeInputLabel}
              inputClassName="w-full pl-9 pr-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-right focus:outline-hidden"
            />
          </div>

          {/* Discount / Voucher */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              {t.splitBill.discountInputLabel}
            </label>
            <AmountInput
              value={discountAmount}
              onChange={setDiscountAmount}
              currency={currency}
              prefix={`-${currencySymbol}`}
              ariaLabel={t.splitBill.discountInputLabel}
              inputClassName="w-full pl-10 pr-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right focus:outline-hidden"
            />
          </div>
        </div>

        {/* Rounding option */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">
            {t.splitBill.roundingPersonLabel}
          </span>
          <div className="flex gap-1.5">
            {(currency === "IDR"
              ? [
                  { step: 100, label: "Rp 100" },
                  { step: 500, label: "Rp 500" },
                  { step: 1, label: t.splitBill.roundingExact },
                ]
              : [
                  { step: 1, label: `${currencySymbol} 1` },
                  { step: 0.1, label: `${currencySymbol} 0.1` },
                  { step: 0.01, label: t.splitBill.roundingExact },
                ]
            ).map((r) => (
              <button
                key={r.step}
                type="button"
                onClick={() => setRoundingStep(r.step)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  roundingStep === r.step
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Payment Transfer Details */}
      <section className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
            5
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t.splitBill.step5Title}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.splitBill.step5Subtitle}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Method selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              {t.splitBill.paymentMethodLabel}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === m
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                {t.splitBill.accountNumberLabel}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t.splitBill.accountNumberPlaceholder}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                {t.splitBill.accountNameLabel}
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t.splitBill.accountNamePlaceholder}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Checkbox: Save as default */}
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="rounded-md border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t.splitBill.saveAsDefaultLabel}</span>
          </label>
        </div>
      </section>

      {/* SECTION 6: Personal Tracker Integration */}
      <section className="rounded-3xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.splitBill.autoLogTrackerLabel}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t.splitBill.autoLogTrackerDesc.replace("{amount}", formatCurrency(creatorShare))}
              </p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={autoLogToTracker}
            onChange={(e) => setAutoLogToTracker(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
          />
        </div>

        {autoLogToTracker && (
          <div className="pt-2 border-t border-emerald-500/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.splitBill.categoryLabel}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {multiSakuEnabled && wallets.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{t.splitBill.walletSourceLabel}</span>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.emoji} {w.name} {w.is_primary ? ` ${t.splitBill.primaryBadge}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 7: Live Summary Card */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-zinc-400">
          {t.splitBill.realtimeSummaryTitle}
        </h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>{t.splitBill.subtotalMenu}</span>
            <span className="font-semibold">{formatRupiah(calculation.subtotal)}</span>
          </div>
          {calculation.taxAmount > 0 && (
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{t.splitBill.taxLabel} ({effectiveTaxPercentage}%)</span>
              <span className="font-semibold">+{formatRupiah(calculation.taxAmount)}</span>
            </div>
          )}
          {calculation.serviceAmount > 0 && (
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{t.splitBill.serviceCharge} ({servicePercentage}%)</span>
              <span className="font-semibold">+{formatRupiah(calculation.serviceAmount)}</span>
            </div>
          )}
          {calculation.extraFee > 0 && (
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{t.splitBill.deliveryFee}</span>
              <span className="font-semibold">+{formatRupiah(calculation.extraFee)}</span>
            </div>
          )}
          {calculation.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>{t.splitBill.discountReduction}</span>
              <span className="font-semibold">-{formatRupiah(calculation.discountAmount)}</span>
            </div>
          )}
          {calculation.roundingDiff !== 0 && (
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>{t.splitBill.roundingLine}</span>
              <span className="font-semibold">
                {calculation.roundingDiff > 0 ? "+" : "-"}
                {formatRupiah(Math.abs(calculation.roundingDiff))}
              </span>
            </div>
          )}
          {unassignedItemIds.size > 0 && (
            <div className="flex justify-between font-semibold text-danger">
              <span>{t.splitBill.unassignedSummary.replace("{count}", String(unassignedItemIds.size))}</span>
              <span>
                {formatRupiah(calculation.unassignedItems.reduce((sum, it) => sum + it.total, 0))}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t.splitBill.totalAllBills}
            </span>
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
              {formatRupiah(calculation.grandTotal)}
            </span>
          </div>
        </div>

        {/* Per-participant shares list */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <p className="text-xs font-semibold text-zinc-500 mb-2">
            {t.splitBill.estimatedOwedPerPerson}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {calculation.participants.map((p) => (
              <div
                key={p.participantId}
                className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60"
              >
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">
                  {p.name} {p.isCreator && `(${t.splitBill.hostBadge})`}
                </p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(p.totalOwed)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Bottom Actions Bar with bottom margin */}
      <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 px-3 sm:px-4 max-w-md mx-auto pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="pointer-events-auto rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 shadow-xl sm:shadow-2xl shadow-zinc-950/15 dark:shadow-black/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-zinc-400 block">{t.splitBill.totalBill}</span>
            <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
              {formatRupiah(calculation.grandTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview as Friend Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">{t.splitBill.previewFriendBtn}</span>
              <span className="sm:hidden">{t.splitBill.previewShortBtn}</span>
            </button>

            {/* Direct Publish / Save Button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold text-xs active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <span>{isEditMode ? t.splitBill.savingChangesBtn : t.splitBill.publishingBtn}</span>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>{isEditMode ? t.splitBill.saveChangesBtn : t.splitBill.publishBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Image Upload & Editor Modal */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        context="split"
        onApply={handleApplyScannedDoc}
      />

      {/* Friend View Preview Modal */}
      <FriendViewPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirmPublish={handlePublish}
        isPublishing={isPublishing}
        isEditMode={isEditMode}
        title={title || "Split Bill"}
        calculation={calculation}
        paymentInfo={{
          method: paymentMethod,
          account_number: accountNumber,
          account_name: accountName,
        }}
      />

      {/* Replace vs Append Modal for Scanned Receipt */}
      {showReplaceDialog && pendingScannedDoc && (
        <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Hasil Pindai Struk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setPendingScannedDoc(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Form split bill ini sudah memiliki item yang dicatat. Apakah ingin menambahkan{" "}
              <strong>{pendingScannedDoc.items.length} item</strong> dari struk ke daftar yang sudah ada, atau mengganti semua item?
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => applyExtractedBill(pendingScannedDoc, true)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Tambahkan ke Item yang Ada (Append)
              </button>
              <button
                type="button"
                onClick={() => applyExtractedBill(pendingScannedDoc, false)}
                className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                Ganti Semua Item (Replace)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setPendingScannedDoc(null);
                }}
                className="w-full py-1.5 text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
