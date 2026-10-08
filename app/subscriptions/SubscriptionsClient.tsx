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
} from "./actions";
import { useTranslation } from "@/utils/i18n/context";
import { getTodayString } from "@/utils/date";
import type { Wallet } from "@/utils/wallets/server";

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
  const { formatCurrency, currencySymbol, t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(initialSubscriptions);
  const [activeTab, setActiveTab] = useState<"all" | "split" | "personal">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionRecord | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
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
    setPrice(String(sub.price));
    setBillingCycle(sub.billing_cycle);
    setNextRenewalDate(sub.next_renewal_date);
    setPaymentPlatform(sub.payment_platform);
    setCategory(sub.category);
    const initialWallet = sub.pay_from_wallet_id || defaultWalletId || wallets.find((w) => w.is_primary)?.id || wallets[0]?.id || "";
    setPayFromWalletId(initialWallet);
    setNotes("");
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

    const numPrice = Number(price) || 0;
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
    <div className="min-h-screen pb-32 pt-4 px-4 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-2xs"
            aria-label={t.subscriptions.backToHome}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {t.subscriptions.title}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t.subscriptions.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold px-3 py-2 text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t.subscriptions.add}</span>
        </button>
      </header>

      {/* Guest Warning */}
      {isGuest && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{t.subscriptions.guestBadge}</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
              {t.subscriptions.guestDesc}
            </p>
          </div>
          <Link
            href="/login?next=/subscriptions"
            className="rounded-lg bg-amber-600 text-white px-2.5 py-1 text-[11px] font-semibold hover:bg-amber-700 transition-colors"
          >
            {t.subscriptions.loginBtn}
          </Link>
        </div>
      )}

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`mb-4 rounded-xl p-3 text-xs font-medium flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button type="button" onClick={() => setActionMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.subscriptions.totalCostMonth}</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {formatCurrency(metrics.totalMonthly)}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {subscriptions.filter((s) => s.status === "active").length} {t.subscriptions.activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/50 p-3.5 shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300">{t.subscriptions.myShareMonth}</p>
          <p className="text-base font-bold text-indigo-950 dark:text-indigo-100 mt-1">
            {formatCurrency(metrics.myMonthlyShare)}
          </p>
          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
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
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {t.subscriptions.upcomingRenewalsDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "all"
              ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {t.subscriptions.tabAll} ({subscriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("split")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "split"
              ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {t.subscriptions.tabSplit} ({subscriptions.filter((s) => s.is_split).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === "personal"
              ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-white"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {t.subscriptions.tabPersonal} ({subscriptions.filter((s) => !s.is_split).length})
        </button>
      </div>

      {/* Subscription Cards List */}
      <div className="flex flex-col gap-3">
        {filteredSubscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white/50 dark:bg-zinc-900/50">
            <Sparkles className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {t.subscriptions.emptyTitle}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
              {t.subscriptions.emptyDesc}
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
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
                          <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold px-1.5 py-0.5 rounded-md">
                            {t.subscriptions.pausedBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
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
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">
                      /{sub.billing_cycle === "monthly" ? t.subscriptions.perMonth : sub.billing_cycle === "yearly" ? t.subscriptions.perYear : t.subscriptions.perWeek}
                    </p>
                  </div>
                </div>

                {/* Split Breakdown Badge if enabled */}
                {sub.is_split && (
                  <div className="mt-3 rounded-xl bg-purple-500/10 border border-purple-500/20 p-2.5 text-xs text-purple-900 dark:text-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{t.subscriptions.splitBadge.replace("{count}", String(splitCount)).replace("{friends}", sub.split_config?.friends?.map((f) => f.name).join(", ") || "")}</span>
                      </span>
                      <span className="font-bold text-[11px] text-purple-700 dark:text-purple-300">
                        {formatCurrency(myShare)}{t.subscriptions.perPersonShort}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Row: Renewal Countdown + Controls */}
                <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span
                      className={`font-semibold text-[11px] ${
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

                  <div className="flex items-center gap-1 shrink-0">
                    {/* If Split and Active: Button to generate Split Bill immediately */}
                    {sub.is_split && (
                      <button
                        type="button"
                        onClick={() => handleManualSplitBillCreation(sub)}
                        disabled={processingSubId === sub.id}
                        title={t.subscriptions.splitBillBtn}
                        className="flex items-center gap-1 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>{t.subscriptions.splitBillBtn}</span>
                      </button>
                    )}

                    {sub.last_split_bill_id && (
                      <Link
                        href={`/split/${sub.last_split_bill_id}`}
                        title={t.subscriptions.viewLastSplitBill}
                        className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(sub.id, sub.status)}
                      title={isPaused ? t.subscriptions.resumeTitle : t.subscriptions.pauseTitle}
                      className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(sub)}
                      title={t.subscriptions.editTitle}
                      className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(sub.id, sub.name)}
                      title={t.subscriptions.deleteTitle}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto shadow-2xl animate-modal-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {editingSub ? t.subscriptions.editModalTitle : t.subscriptions.createModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={t.subscriptions.cancelBtn}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Pills (only when creating new) */}
            {!editingSub && (
              <div className="my-3.5">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                  {t.subscriptions.quickPresetsTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        name === preset.name
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {preset.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t.subscriptions.serviceNameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.subscriptions.serviceNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Price & Cycle */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.subscriptions.priceLabel} ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder={currencySymbol === "Rp" ? "86900" : "9.99"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.subscriptions.billingCycleLabel}
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  >
                    <option value="monthly">{t.subscriptions.cycleMonthly}</option>
                    <option value="yearly">{t.subscriptions.cycleYearly}</option>
                    <option value="weekly">{t.subscriptions.cycleWeekly}</option>
                  </select>
                </div>
              </div>

              {/* Next Renewal Date & Platform */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.subscriptions.renewalDateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.subscriptions.paymentPlatformLabel}
                  </label>
                  <select
                    value={paymentPlatform}
                    onChange={(e) => setPaymentPlatform(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  >
                    {PAYMENT_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saku Selector (Multi-Saku Enabled) */}
                {multiSakuEnabled && wallets.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t.subscriptions.payFromWalletLabel}
                    </label>
                    <select
                      value={payFromWalletId}
                      onChange={(e) => setPayFromWalletId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.emoji} {w.name} {w.is_primary ? t.subscriptions.primaryBadge : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reminder days in advance */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t.subscriptions.remindBeforeLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setReminderDaysBefore(days)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        reminderDaysBefore === days
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {t.subscriptions.daysCount.replace("{days}", String(days))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Toggle */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.subscriptions.splitAccountTitle}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t.subscriptions.splitAccountDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSplit}
                    onChange={(e) => setIsSplit(e.target.checked)}
                    className="w-4 h-4 rounded-md text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                {isSplit && (
                  <div className="mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                    {/* Add Friend Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-900 dark:text-purple-200 mb-1">
                        {t.subscriptions.addFriendLabel}
                      </label>
                      <div className="flex gap-1.5">
                        <input
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
                          className="flex-1 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={handleAddFriend}
                          className="rounded-xl bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                        >
                          {t.subscriptions.addFriendBtn}
                        </button>
                      </div>
                    </div>

                    {/* Friend Tags */}
                    {friends.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11px] bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-lg font-semibold">
                          {t.subscriptions.hostBadge}
                        </span>
                        {friends.map((f) => (
                          <span
                            key={f}
                            className="text-[11px] bg-white dark:bg-zinc-800 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium"
                          >
                            <span>{f}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFriend(f)}
                              className="text-purple-400 hover:text-purple-700 dark:hover:text-purple-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Breakdown Preview */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 text-[11px]">
                      <div className="flex justify-between font-semibold text-purple-950 dark:text-purple-100">
                        <span>{t.subscriptions.portionPerPerson}</span>
                        <span>
                          {formatCurrency(
                            (Number(price) || 0) / Math.max(1, friends.length + 1)
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                        {t.subscriptions.totalSplitDesc.replace("{total}", formatCurrency(Number(price) || 0)).replace("{count}", String(friends.length + 1))}
                      </p>
                    </div>

                    {/* Auto-Creation Options */}
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center gap-2 text-[11px] text-purple-950 dark:text-purple-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoCreateSplit}
                          onChange={(e) => setAutoCreateSplit(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{t.subscriptions.autoCreateSplit}</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-purple-950 dark:text-purple-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoLogExpenses}
                          onChange={(e) => setAutoLogExpenses(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{t.subscriptions.autoLogExpenses}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t.subscriptions.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? t.subscriptions.savingBtn : editingSub ? t.subscriptions.saveChanges : t.subscriptions.addSubscription}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
