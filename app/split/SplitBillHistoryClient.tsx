"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Search,
  AlertTriangle,
  CreditCard,
  Sparkles,
} from "lucide-react";
import {
  calculateSplitBreakdown,
  invalidateSplitCache,
} from "@/utils/splitCalculator";
import { deleteSplitBill } from "@/app/split/actions";
import { SubscriptionRecord } from "@/app/subscriptions/types";
import { createSplitBillFromSubscription } from "@/app/subscriptions/actions";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/utils/i18n/context";

export interface HistoryBillRecord {
  id: string;
  creator_id: string;
  title: string;
  split_mode: "itemized" | "equal";
  tax_percentage: number;
  service_percentage: number;
  discount_amount: number;
  extra_fee: number;
  rounding_step: number;
  payment_info: {
    method?: string;
    account_number?: string;
    account_name?: string;
  };
  category: string;
  logged_expense_id?: string | null;
  status: "active" | "settled";
  created_at: string;
  updated_at?: string;
  split_participants: Array<{
    id: string;
    bill_id?: string;
    name: string;
    is_creator: boolean;
    is_paid: boolean;
    paid_at?: string | null;
  }>;
  split_items: Array<{
    id: string;
    bill_id?: string;
    name: string;
    price: number;
    quantity: number;
    assigned_participant_ids: string[];
  }>;
}

interface SplitBillHistoryClientProps {
  initialBills: HistoryBillRecord[];
  splitSubscriptions?: SubscriptionRecord[];
}

export default function SplitBillHistoryClient({
  initialBills,
  splitSubscriptions = [],
}: SplitBillHistoryClientProps) {
  const router = useRouter();
  const { formatCurrency, formatDate, t } = useTranslation();
  const [bills, setBills] = useState<HistoryBillRecord[]>(initialBills);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "settled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [triggeringSubId, setTriggeringSubId] = useState<string | null>(null);

  const handleGenerateSplitFromSub = async (sub: SubscriptionRecord) => {
    if (!confirm(t.splitBill.createBillConfirm.replace("{name}", sub.name))) return;
    setTriggeringSubId(sub.id);
    try {
      const res = await createSplitBillFromSubscription(sub.id);
      router.push(`/split/${res.billId}`);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setTriggeringSubId(null);
    }
  };

  // Compute stats and totals for each bill
  const billsWithStats = useMemo(() => {
    return bills.map((b) => {
      const parts = b.split_participants || [];
      const items = b.split_items || [];
      const calc = calculateSplitBreakdown(
        {
          split_mode: b.split_mode,
          tax_percentage: b.tax_percentage,
          service_percentage: b.service_percentage,
          discount_amount: b.discount_amount,
          extra_fee: b.extra_fee,
          rounding_step: b.rounding_step,
        },
        items,
        parts.map((p) => ({ ...p, bill_id: b.id }))
      );

      const paidCount = parts.filter((p) => p.is_paid).length;
      const totalCount = Math.max(1, parts.length);
      const isSettled = parts.length > 0 && paidCount === parts.length;
      const unpaidParticipants = parts.filter((p) => !p.is_paid);
      const creatorShare = calc.participants.find((p) => p.isCreator)?.totalOwed || 0;

      return {
        ...b,
        grandTotal: calc.grandTotal,
        creatorShare,
        paidCount,
        totalCount,
        isSettled,
        unpaidParticipants,
      };
    });
  }, [bills]);

  // Overall metrics
  const totalBillsCount = bills.length;
  const settledCount = billsWithStats.filter((b) => b.isSettled).length;
  const activeCount = totalBillsCount - settledCount;

  // Filtered bills
  const filteredBills = useMemo(() => {
    return billsWithStats.filter((b) => {
      // Tab filter
      if (filterTab === "active" && b.isSettled) return false;
      if (filterTab === "settled" && !b.isSettled) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesCategory = b.category.toLowerCase().includes(query);
        const matchesParticipant = b.split_participants?.some((p) =>
          p.name.toLowerCase().includes(query)
        );
        return matchesTitle || matchesCategory || matchesParticipant;
      }
      return true;
    });
  }, [billsWithStats, filterTab, searchQuery]);

  const billToDelete = useMemo(() => {
    return bills.find((b) => b.id === deletingBillId) || null;
  }, [bills, deletingBillId]);

  const handleDelete = async () => {
    if (!deletingBillId) return;
    setIsDeleting(true);

    try {
      await deleteSplitBill(deletingBillId);
      // Invalidate localStorage cache
      invalidateSplitCache(deletingBillId);
      // Update local state
      setBills((prev) => prev.filter((b) => b.id !== deletingBillId));
      setDeletingBillId(null);
    } catch (err) {
      console.error("Error deleting split bill:", err);
      alert(t.splitBill.deleteFailedAlert);
    } finally {
      setIsDeleting(false);
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
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.splitBill.backToHome}</span>
        </Link>

        <Link
          href="/split/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.splitBill.newSplit}</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          {t.splitBill.historyTitle}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t.splitBill.historySubtitle}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
            {t.splitBill.totalBills}
          </span>
          <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            {totalBillsCount}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 shadow-2xs">
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            {t.splitBill.unpaid}
          </span>
          <span className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5 block">
            {activeCount}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs">
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            {t.splitBill.paid}
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">
            {settledCount}
          </span>
        </div>
      </div>

      {/* Recurring Shared Subscriptions Section */}
      {splitSubscriptions.length > 0 && (
        <div className="p-4 rounded-3xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {t.splitBill.recurringTitle} ({splitSubscriptions.length})
              </h3>
            </div>
            <Link
              href="/subscriptions"
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              {t.splitBill.manageLink} &rarr;
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {splitSubscriptions.map((sub) => {
              const friendsCount = (sub.split_config?.friends?.length || 0) + 1;
              const perPerson = sub.price / friendsCount;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-900/30 shadow-2xs"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {sub.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatCurrency(perPerson)}{t.splitBill.perPersonShort} • {t.splitBill.scheduleLabel}: {sub.next_renewal_date}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateSplitFromSub(sub)}
                    disabled={triggeringSubId === sub.id}
                    className="shrink-0 flex items-center gap-1 rounded-xl bg-purple-600 text-white hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 dark:text-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{triggeringSubId === sub.id ? t.splitBill.creatingBillBtn : t.splitBill.createBillBtn}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls: Search & Tabs */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.splitBill.searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
          {[
            { id: "all", label: `${t.splitBill.tabAll} (${totalBillsCount})` },
            { id: "active", label: `${t.splitBill.tabUnpaid} (${activeCount})` },
            { id: "settled", label: `${t.splitBill.tabPaid} (${settledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as typeof filterTab)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                filterTab === tab.id
                  ? "bg-white text-zinc-900 dark:bg-zinc-700 dark:text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3 bg-white/50 dark:bg-zinc-900/50">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.splitBill.emptyTitle}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {searchQuery
                  ? t.splitBill.emptySearchDesc
                  : t.splitBill.emptyDefaultDesc}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/split/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.splitBill.createSplitBillBtn}</span>
              </Link>
            )}
          </div>
        ) : (
          filteredBills.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3"
            >
              {/* Card Top Row: Title, Date, Category, Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {b.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {b.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {formatDate(b.created_at, "d MMM yyyy")} · {b.split_participants?.length || 0} {t.splitBill.peopleCount}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                    b.isSettled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  {b.isSettled ? t.splitBill.paidBadge : t.splitBill.paidRatio.replace("{paid}", String(b.paidCount)).replace("{total}", String(b.totalCount))}
                </span>
              </div>

              {/* Card Mid Row: Amounts */}
              <div className="flex items-baseline justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {t.splitBill.totalBill}
                  </span>
                  <span className="text-base font-black text-zinc-900 dark:text-zinc-50">
                    {formatRupiah(b.grandTotal)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {t.splitBill.yourShareHost}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(b.creatorShare)}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Unpaid Friend List */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${(b.paidCount / b.totalCount) * 100}%`,
                    }}
                  />
                </div>

                {!b.isSettled && b.unpaidParticipants.length > 0 && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t.splitBill.waitingFor}:{" "}
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {b.unpaidParticipants.map((p) => p.name).join(", ")}
                    </span>
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => setDeletingBillId(b.id)}
                  aria-label={t.splitBill.deleteBillAria}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* View Breakdown & Share */}
                <Link
                  href={`/split/${b.id}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>{t.splitBill.openAndShare}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingBillId && billToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {t.splitBill.deleteModalTitle}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t.splitBill.deleteModalDesc.replace("{title}", billToDelete.title)}
                  {billToDelete.logged_expense_id && (
                    <span className="block mt-1 text-rose-600 dark:text-rose-400 font-medium">
                      {t.splitBill.deleteExpenseWarning}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBillId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {t.splitBill.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? t.splitBill.deletingBtn : t.splitBill.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
