"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calendar,
  CreditCard,
  Users,
  Sparkles,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  ExternalLink,
  Pause,
  Play,
  X,
  Music,
  Cloud,
  Film,
  Bot,
  Video,
  Layers,
  HeartHandshake,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import {
  SubscriptionRecord,
  POPULAR_PRESETS,
  PAYMENT_PLATFORMS,
  SubscriptionPreset,
  BillingCycle,
  SubscriptionStatus,
} from "./types";
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
  createSplitBillFromSubscription,
  paySubscription,
} from "./actions";
import { useTranslation } from "@/utils/i18n/context";
import { getTodayString } from "@/utils/date";
import type { Wallet } from "@/utils/wallets/server";
import AiHeaderButton from "@/app/ai/AiHeaderButton";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { CheckboxField, MoneyField, SelectField, TextField } from "@/app/ui/Field";
import { SegmentedControl, ToggleChip } from "@/app/ui/Toggle";
import { parseMoneyInput, toRupiahFieldValue } from "@/utils/money";

interface SubscriptionsClientProps {
  initialSubscriptions: SubscriptionRecord[];
  isGuest?: boolean;
  wallets?: Wallet[];
  multiSakuEnabled?: boolean;
  defaultWalletId?: string | null;
}

export default function SubscriptionsClient({
  initialSubscriptions,
  isGuest = false,
  wallets = [],
  multiSakuEnabled = false,
  defaultWalletId = null,
}: SubscriptionsClientProps) {
  const router = useRouter();
  const { formatCurrency, currencySymbol, currency, t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(initialSubscriptions);
  const [activeTab, setActiveTab] = useState<"all" | "split" | "personal">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionRecord | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState(getTodayString());
  const [paymentPlatform, setPaymentPlatform] = useState("Google Play");
  const [category, setCategory] = useState("Entertainment");
  const [payFromWalletId, setPayFromWalletId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);
  const [isSplit, setIsSplit] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [autoCreateSplit, setAutoCreateSplit] = useState(true);
  const [autoLogExpenses, setAutoLogExpenses] = useState(true);

  const walletsMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  // Action status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);

  const today = getTodayString();

  // Metrics
  const metrics = useMemo(() => {
    let totalMonthly = 0;
    let myMonthlyShare = 0;
    let friendsMonthlyShare = 0;
    let upcomingRenewalsCount = 0;

    subscriptions.forEach((sub) => {
      if (sub.status !== "active") return;

      // Normalize yearly to monthly equivalent
      const monthlyAmount = sub.billing_cycle === "yearly" ? sub.price / 12 : sub.price;
      totalMonthly += monthlyAmount;

      if (sub.is_split && sub.split_config?.friends?.length > 0) {
        const totalPeople = sub.split_config.friends.length + 1; // friends + creator
        const myPortion = monthlyAmount / totalPeople;
        const friendsPortion = monthlyAmount - myPortion;
        myMonthlyShare += myPortion;
        friendsMonthlyShare += friendsPortion;
      } else {
        myMonthlyShare += monthlyAmount;
      }

      // Check upcoming in <= 3 days
      const daysDiff = Math.ceil(
        (new Date(sub.next_renewal_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0 && daysDiff <= 3) {
        upcomingRenewalsCount++;
      }
    });

    return {
      totalMonthly,
      myMonthlyShare,
      friendsMonthlyShare,
      upcomingRenewalsCount,
    };
  }, [subscriptions, today]);

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (activeTab === "split") return sub.is_split;
      if (activeTab === "personal") return !sub.is_split;
      return true;
    });
  }, [subscriptions, activeTab]);

  const openCreateModal = () => {
    setEditingSub(null);
    setName("");
    setPrice("");
    setPriceError(null);
    setBillingCycle("monthly");
    setNextRenewalDate(getTodayString());
    setPaymentPlatform("Google Play");
    setCategory("Entertainment");
    const initialWallet = defaultWalletId || wallets.find((w) => w.is_primary)?.id || wallets[0]?.id || "";
    setPayFromWalletId(initialWallet);
    setNotes("");
    setReminderDaysBefore(2);
    setIsSplit(false);
    setFriends([]);
    setFriendInput("");
    setAutoCreateSplit(true);
    setAutoLogExpenses(true);
    setActionMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubscriptionRecord) => {
    setEditingSub(sub);
    setName(sub.name);
    setPrice(currency === "IDR" ? toRupiahFieldValue(sub.price) : String(sub.price));
    setPriceError(null);
    setBillingCycle(sub.billing_cycle);
    setNextRenewalDate(sub.next_renewal_date);
    setPaymentPlatform(sub.payment_platform);
    setCategory(sub.category);
    const initialWallet = sub.pay_from_wallet_id || defaultWalletId || wallets.find((w) => w.is_primary)?.id || wallets[0]?.id || "";
    setPayFromWalletId(initialWallet);
    setNotes(sub.notes || "");
    setReminderDaysBefore(sub.reminder_days_before);
    setIsSplit(sub.is_split);
    setFriends(sub.split_config?.friends?.map((f) => f.name) || []);
    setFriendInput("");
    setAutoCreateSplit(sub.split_config?.auto_create_split_bill !== false);
    setAutoLogExpenses(sub.split_config?.auto_log_to_expenses !== false);
    setActionMessage(null);
    setIsModalOpen(true);
  };

  const selectPreset = (preset: SubscriptionPreset) => {
    setName(preset.name);
    setPrice(String(preset.defaultPrice));
    setPriceError(null);
    setCategory(preset.defaultCategory);
    setPaymentPlatform(preset.suggestedPlatform);
  };

  const handleAddFriend = () => {
    const trimmed = friendInput.trim();
    if (!trimmed) return;
    if (!friends.includes(trimmed)) {
      setFriends([...friends, trimmed]);
    }
    setFriendInput("");
  };

  const handleRemoveFriend = (friendName: string) => {
    setFriends(friends.filter((f) => f !== friendName));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = parseMoneyInput(price, currency, { allowZero: true });
    if (!parsedPrice.ok) {
      setPriceError(parsedPrice.error);
      return;
    }
    setPriceError(null);
    const numPrice = parsedPrice.value;
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const payload = {
        name: name.trim(),
        price: numPrice,
        billingCycle,
        nextRenewalDate,
        paymentPlatform,
        category,
        notes,
        reminderDaysBefore,
        isSplit,
        payFromWalletId: payFromWalletId || null,
        splitConfig: {
          splitMode: "equal" as const,
          friends: friends.map((f) => ({ name: f })),
          autoCreateSplitBill: autoCreateSplit,
          autoLogToExpenses: autoLogExpenses,
        },
      };

      const dbSplitConfig = {
        split_mode: "equal" as const,
        friends: friends.map((f) => ({ name: f })),
        auto_create_split_bill: autoCreateSplit,
        auto_log_to_expenses: autoLogExpenses,
      };

      if (editingSub) {
        await updateSubscription(editingSub.id, payload);
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === editingSub.id
              ? {
                  ...s,
                  name: payload.name,
                  price: payload.price,
                  billing_cycle: payload.billingCycle,
                  next_renewal_date: payload.nextRenewalDate,
                  payment_platform: payload.paymentPlatform,
                  category: payload.category,
                  notes: payload.notes,
                  reminder_days_before: payload.reminderDaysBefore,
                  is_split: payload.isSplit,
                  pay_from_wallet_id: payload.payFromWalletId,
                  split_config: dbSplitConfig,
                  updated_at: new Date().toISOString(),
                }
              : s
          )
        );
        setActionMessage({ type: "success", text: t.subscriptions.updateSuccess });
      } else {
        const res = await createSubscription(payload);
        const newSub: SubscriptionRecord = {
          id: res.subscriptionId,
          user_id: "current-user",
          name: payload.name,
          price: payload.price,
          billing_cycle: payload.billingCycle,
          next_renewal_date: payload.nextRenewalDate,
          payment_platform: payload.paymentPlatform,
          category: payload.category,
          notes: payload.notes,
          status: "active",
          reminder_days_before: payload.reminderDaysBefore,
          is_split: payload.isSplit,
          pay_from_wallet_id: payload.payFromWalletId,
          split_config: dbSplitConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSubscriptions([newSub, ...subscriptions]);
        setActionMessage({ type: "success", text: t.subscriptions.createSuccess });
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const e = err as Error;
      setActionMessage({ type: "error", text: e.message || "Terjadi kesalahan" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, subName: string) => {
    if (!confirm(t.subscriptions.deleteConfirm.replace("{name}", subName))) return;
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: SubscriptionStatus) => {
    const newStatus: SubscriptionStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await toggleSubscriptionStatus(id, newStatus);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleManualSplitBillCreation = async (sub: SubscriptionRecord) => {
    if (!confirm(t.subscriptions.createSplitConfirm.replace("{name}", sub.name))) return;
    setProcessingSubId(sub.id);
    try {
      const res = await createSplitBillFromSubscription(sub.id);
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                last_split_bill_id: res.billId,
                next_renewal_date: res.nextRenewalDate,
              }
            : s
        )
      );
      router.push(`/split/${res.billId}`);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setProcessingSubId(null);
    }
  };

  const handlePaySubscription = async (sub: SubscriptionRecord) => {
    const confirmText = t.subscriptions.markPaidConfirm
      ? t.subscriptions.markPaidConfirm
          .replace("{name}", sub.name)
          .replace("{amount}", formatCurrency(sub.price))
      : `Catat pembayaran untuk ${sub.name} ke pengeluaran sekarang?`;
    if (!confirm(confirmText)) return;

    setProcessingSubId(sub.id);
    try {
      const res = await paySubscription(sub.id);
      if (res.mode === "split" && res.billId) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  last_split_bill_id: res.billId,
                  next_renewal_date: res.nextRenewalDate || s.next_renewal_date,
                }
              : s
          )
        );
        router.push(`/split/${res.billId}`);
      } else {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  next_renewal_date: res.nextRenewalDate || s.next_renewal_date,
                }
              : s
          )
        );
        setActionMessage({
          type: "success",
          text: t.subscriptions.paySuccess || "Pembayaran berhasil dicatat ke pengeluaran.",
        });
        router.refresh();
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setProcessingSubId(null);
    }
  };

  // Helper to render icon by name/type
  const getPresetIcon = (subName: string) => {
    const lower = subName.toLowerCase();
    if (lower.includes("spotify")) return <Music className="w-4 h-4 text-emerald-500" />;
    if (lower.includes("google")) return <Cloud className="w-4 h-4 text-blue-500" />;
    if (lower.includes("netflix")) return <Film className="w-4 h-4 text-rose-500" />;
    if (lower.includes("chatgpt") || lower.includes("openai")) return <Bot className="w-4 h-4 text-teal-500" />;
    if (lower.includes("claude") || lower.includes("ai")) return <Sparkles className="w-4 h-4 text-amber-500" />;
    if (lower.includes("youtube")) return <Video className="w-4 h-4 text-red-500" />;
    if (lower.includes("patreon")) return <HeartHandshake className="w-4 h-4 text-pink-500" />;
    if (lower.includes("apple") || lower.includes("icloud")) return <Layers className="w-4 h-4 text-zinc-500" />;
    return <CreditCard className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <main className="min-h-screen pb-32 pt-4 px-4 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-2xs"
            aria-label={t.subscriptions.backToHome}
          >
            <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {t.subscriptions.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.subscriptions.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AiHeaderButton />
          <button
            type="button"
            onClick={openCreateModal}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold px-3 text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus aria-hidden="true" className="w-4 h-4 stroke-[2.5]" />
            <span>{t.subscriptions.add}</span>
          </button>
        </div>
      </header>

      {/* Guest Warning */}
      {isGuest && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{t.subscriptions.guestBadge}</p>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              {t.subscriptions.guestDesc}
            </p>
          </div>
          <Link
            href="/login?next=/subscriptions"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent text-on-accent px-3 text-xs font-semibold hover:brightness-95 transition-colors"
          >
            {t.subscriptions.loginBtn}
          </Link>
        </div>
      )}

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          role={actionMessage.type === "error" ? "alert" : "status"}
          className={`mb-4 rounded-xl py-1 pl-3 pr-1 text-xs font-medium flex items-center justify-between gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            aria-label={t.subscriptions.dismissMessage}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.subscriptions.totalCostMonth}</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {formatCurrency(metrics.totalMonthly)}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            {subscriptions.filter((s) => s.status === "active").length} {t.subscriptions.activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/50 p-3.5 shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="text-xs text-indigo-700 dark:text-indigo-300">{t.subscriptions.myShareMonth}</p>
          <p className="text-base font-bold text-indigo-950 dark:text-indigo-100 mt-1">
            {formatCurrency(metrics.myMonthlyShare)}
          </p>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
            {t.subscriptions.splitSavings.replace("{amount}", formatCurrency(metrics.friendsMonthlyShare))}
          </p>
        </div>
      </section>

      {/* Approaching Renewals Alert Banner */}
      {metrics.upcomingRenewalsCount > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {t.subscriptions.upcomingRenewalsCount.replace("{count}", String(metrics.upcomingRenewalsCount))}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {t.subscriptions.upcomingRenewalsDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <SegmentedControl
        ariaLabel={t.subscriptions.filterLabel}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-4"
        options={[
          { value: "all", label: `${t.subscriptions.tabAll} (${subscriptions.length})` },
          { value: "split", label: `${t.subscriptions.tabSplit} (${subscriptions.filter((s) => s.is_split).length})` },
          { value: "personal", label: `${t.subscriptions.tabPersonal} (${subscriptions.filter((s) => !s.is_split).length})` },
        ]}
      />

      {/* Subscription Cards List */}
      <div className="flex flex-col gap-3">
        {filteredSubscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white/50 dark:bg-zinc-900/50">
            <Sparkles className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-400 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {t.subscriptions.emptyTitle}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              {t.subscriptions.emptyDesc}
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-3.5 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-zinc-900 text-white px-4 text-sm font-semibold hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Plus aria-hidden="true" className="w-4 h-4" />
              <span>{t.subscriptions.addSubscription}</span>
            </button>
          </div>
        ) : (
          filteredSubscriptions.map((sub) => {
            const isPaused = sub.status === "paused";
            const daysDiff = Math.ceil(
              (new Date(sub.next_renewal_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
            );
            const isToday = daysDiff === 0;
            const isUpcoming = daysDiff > 0 && daysDiff <= 3;
            const isOverdue = daysDiff < 0;

            const splitCount = (sub.split_config?.friends?.length || 0) + 1;
            const myShare = sub.is_split ? sub.price / splitCount : sub.price;

            return (
              <div
                key={sub.id}
                className={`rounded-2xl border transition-all p-4 ${
                  isPaused
                    ? "border-zinc-200 bg-zinc-100/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
                    : "border-zinc-200/80 bg-white shadow-2xs hover:shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900"
                }`}
              >
                {/* Top Row: Icon + Name + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                      {getPresetIcon(sub.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {sub.name}
                        </h2>
                        {isPaused && (
                          <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold px-1.5 py-0.5 rounded-md">
                            {t.subscriptions.pausedBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
                        <span>{sub.payment_platform}</span>
                        <span>•</span>
                        <span>{sub.category}</span>
                        {sub.pay_from_wallet_id && walletsMap.get(sub.pay_from_wallet_id) && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                              <span>{walletsMap.get(sub.pay_from_wallet_id)?.emoji}</span>
                              <span>{walletsMap.get(sub.pay_from_wallet_id)?.name}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Pricing */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(sub.price)}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                      /{sub.billing_cycle === "monthly" ? t.subscriptions.perMonth : sub.billing_cycle === "yearly" ? t.subscriptions.perYear : t.subscriptions.perWeek}
                    </p>
                  </div>
                </div>

                {/* Split Breakdown Badge if enabled */}
                {sub.is_split && (
                  <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-500/20 p-2.5 text-xs text-purple-900 dark:text-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-xs">
                        <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{t.subscriptions.splitBadge.replace("{count}", String(splitCount)).replace("{friends}", sub.split_config?.friends?.map((f) => f.name).join(", ") || "")}</span>
                      </span>
                      <span className="font-bold text-xs text-purple-700 dark:text-purple-300">
                        {formatCurrency(myShare)}{t.subscriptions.perPersonShort}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Row: Renewal Countdown + Controls */}
                <div className="mt-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-zinc-400" />
                    <span
                      className={`font-semibold text-xs ${
                        isToday
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : isUpcoming
                          ? "text-amber-600 dark:text-amber-400 font-semibold"
                          : isOverdue
                          ? "text-zinc-400"
                          : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {isToday
                        ? t.subscriptions.renewalToday
                        : isUpcoming
                        ? t.subscriptions.renewalInDays.replace("{days}", String(daysDiff)).replace("{date}", sub.next_renewal_date)
                        : sub.next_renewal_date}
                    </span>
                  </div>

                  <div className="-mr-2 ml-auto flex flex-wrap items-center justify-end gap-1">
                    {/* Pay / Record Payment Now */}
                    {!isPaused && (
                      <button
                        type="button"
                        onClick={() => handlePaySubscription(sub)}
                        disabled={processingSubId === sub.id}
                        className="flex min-h-11 items-center gap-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 px-3 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>{processingSubId === sub.id ? "..." : t.subscriptions.payNowBtn}</span>
                      </button>
                    )}

                    {/* If Split and Active: Button to generate Split Bill immediately */}
                    {sub.is_split && (
                      <button
                        type="button"
                        onClick={() => handleManualSplitBillCreation(sub)}
                        disabled={processingSubId === sub.id}
                        className="flex min-h-11 items-center gap-1 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-3 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Receipt aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>{t.subscriptions.splitBillBtn}</span>
                      </button>
                    )}

                    {sub.last_split_bill_id && (
                      <Link
                        href={`/split/${sub.last_split_bill_id}`}
                        aria-label={`${t.subscriptions.viewLastSplitBill}: ${sub.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <ExternalLink aria-hidden="true" className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(sub.id, sub.status)}
                      aria-label={`${isPaused ? t.subscriptions.resumeTitle : t.subscriptions.pauseTitle}: ${sub.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {isPaused ? <Play aria-hidden="true" className="w-4 h-4" /> : <Pause aria-hidden="true" className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(sub)}
                      aria-label={`${t.subscriptions.editTitle}: ${sub.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Edit2 aria-hidden="true" className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(sub.id, sub.name)}
                      aria-label={`${t.subscriptions.deleteTitle}: ${sub.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Subscription */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        busy={isSubmitting}
        title={editingSub ? t.subscriptions.editModalTitle : t.subscriptions.createModalTitle}
        closeLabel={t.common.close}
        footer={
          <>
            <Button block onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              {t.subscriptions.cancelBtn}
            </Button>
            <Button block variant="primary" type="submit" form="subscription-form" disabled={isSubmitting}>
              {isSubmitting ? t.subscriptions.savingBtn : editingSub ? t.subscriptions.saveChanges : t.subscriptions.addSubscription}
            </Button>
          </>
        }
      >
        {!editingSub && (
          <div className="mb-4 flex flex-col gap-1.5">
            <span id="subscription-presets-label" className="text-sm font-semibold text-ink">
              {t.subscriptions.quickPresetsTitle}
            </span>
            <div role="group" aria-labelledby="subscription-presets-label" className="flex flex-wrap gap-1.5">
              {POPULAR_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.id}
                  pressed={name === preset.name}
                  onClick={() => selectPreset(preset)}
                  aria-label={preset.name}
                >
                  {preset.name.split(" ")[0]}
                </ToggleChip>
              ))}
            </div>
          </div>
        )}

        <form id="subscription-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <TextField
            label={t.subscriptions.serviceNameLabel}
            type="text"
            required
            placeholder={t.subscriptions.serviceNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currency === "IDR" ? (
              <MoneyField
                label={t.subscriptions.priceLabel}
                value={price}
                onChange={(v) => {
                  setPrice(v);
                  setPriceError(null);
                }}
                prefix={currencySymbol}
                placeholder="86.900"
                error={priceError}
                allowZero
                required
              />
            ) : (
              <TextField
                label={`${t.subscriptions.priceLabel} (${currencySymbol})`}
                type="text"
                inputMode="decimal"
                required
                placeholder="9.99"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceError(null);
                }}
                error={priceError}
              />
            )}
            <SelectField
              label={t.subscriptions.billingCycleLabel}
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            >
              <option value="monthly">{t.subscriptions.cycleMonthly}</option>
              <option value="yearly">{t.subscriptions.cycleYearly}</option>
              <option value="weekly">{t.subscriptions.cycleWeekly}</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <TextField
              label={t.subscriptions.renewalDateLabel}
              type="date"
              required
              value={nextRenewalDate}
              onChange={(e) => setNextRenewalDate(e.target.value)}
              className="scheme-light dark:scheme-dark"
            />
            <SelectField
              label={t.subscriptions.paymentPlatformLabel}
              value={paymentPlatform}
              onChange={(e) => setPaymentPlatform(e.target.value)}
            >
              {PAYMENT_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </SelectField>
          </div>

          {multiSakuEnabled && wallets.length > 0 && (
            <SelectField
              label={t.subscriptions.payFromWalletLabel}
              value={payFromWalletId}
              onChange={(e) => setPayFromWalletId(e.target.value)}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.emoji} {w.name} {w.is_primary ? t.subscriptions.primaryBadge : ""}
                </option>
              ))}
            </SelectField>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink" aria-hidden="true">
              {t.subscriptions.remindBeforeLabel}
            </span>
            <SegmentedControl
              ariaLabel={t.subscriptions.remindBeforeLabel}
              value={String(reminderDaysBefore)}
              onChange={(v) => setReminderDaysBefore(Number(v))}
              options={["1", "2", "3", "7"].map((days) => ({
                value: days,
                label: t.subscriptions.daysCount.replace("{days}", days),
              }))}
              className="[&>button]:px-1"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-3">
            <CheckboxField
              checked={isSplit}
              onChange={(e) => setIsSplit(e.target.checked)}
              label={<span className="font-semibold">{t.subscriptions.splitAccountTitle}</span>}
              hint={t.subscriptions.splitAccountDesc}
            />

            {isSplit && (
              <div className="flex flex-col gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <TextField
                      label={t.subscriptions.addFriendLabel}
                      type="text"
                      placeholder={t.subscriptions.addFriendPlaceholder}
                      value={friendInput}
                      onChange={(e) => setFriendInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFriend();
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddFriend}>{t.subscriptions.addFriendBtn}</Button>
                </div>

                {friends.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    <li className="flex min-h-11 items-center rounded-xl bg-purple-200/80 px-3 text-xs font-semibold text-purple-900 dark:bg-purple-900/60 dark:text-purple-200">
                      {t.subscriptions.hostBadge}
                    </li>
                    {friends.map((f) => (
                      <li
                        key={f}
                        className="flex min-h-11 items-center gap-1 rounded-xl border border-purple-300 bg-card pl-3 text-xs font-medium text-purple-900 dark:border-purple-700 dark:text-purple-200"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(f)}
                          aria-label={t.subscriptions.removeFriendAria.replace("{name}", f)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-purple-700 hover:bg-purple-500/10 dark:text-purple-300"
                        >
                          <X aria-hidden="true" className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="rounded-xl border border-purple-200 bg-card p-2.5 text-xs dark:border-purple-800">
                  <div className="flex justify-between font-semibold text-purple-950 dark:text-purple-100">
                    <span>{t.subscriptions.portionPerPerson}</span>
                    <span>{formatCurrency((Number(price) || 0) / Math.max(1, friends.length + 1))}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-purple-800 dark:text-purple-300">
                    {t.subscriptions.totalSplitDesc
                      .replace("{total}", formatCurrency(Number(price) || 0))
                      .replace("{count}", String(friends.length + 1))}
                  </p>
                </div>

                <div className="flex flex-col">
                  <CheckboxField
                    checked={autoCreateSplit}
                    onChange={(e) => setAutoCreateSplit(e.target.checked)}
                    label={t.subscriptions.autoCreateSplit}
                  />
                  <CheckboxField
                    checked={autoLogExpenses}
                    onChange={(e) => setAutoLogExpenses(e.target.checked)}
                    label={t.subscriptions.autoLogExpenses}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Dialog>
    </main>
  );
}
