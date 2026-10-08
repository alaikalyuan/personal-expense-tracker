import { addMonths, addYears, addWeeks, format, parseISO } from "date-fns";

export type BillingCycle = "monthly" | "yearly" | "weekly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export function computeNextRenewalDate(currentDateStr: string, cycle: BillingCycle): string {
  const parsed = parseISO(currentDateStr);
  let nextDate: Date;
  if (cycle === "yearly") {
    nextDate = addYears(parsed, 1);
  } else if (cycle === "weekly") {
    nextDate = addWeeks(parsed, 1);
  } else {
    nextDate = addMonths(parsed, 1);
  }
  return format(nextDate, "yyyy-MM-dd");
}

export interface SplitFriend {
  name: string;
  share?: number; // Optional custom share, otherwise equal split
}

export interface SubscriptionSplitConfig {
  split_mode: "equal" | "custom";
  friends: SplitFriend[];
  auto_create_split_bill: boolean;
  auto_log_to_expenses: boolean;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  next_renewal_date: string; // YYYY-MM-DD
  payment_platform: string;
  category: string;
  notes?: string | null;
  status: SubscriptionStatus;
  reminder_days_before: number;
  is_split: boolean;
  split_config: SubscriptionSplitConfig;
  last_split_bill_id?: string | null;
  last_processed_date?: string | null;
  pay_from_wallet_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPayload {
  name: string;
  price: number;
  billingCycle: BillingCycle;
  nextRenewalDate: string;
  paymentPlatform: string;
  category: string;
  notes?: string;
  reminderDaysBefore?: number;
  isSplit: boolean;
  payFromWalletId?: string | null;
  splitConfig?: {
    splitMode: "equal" | "custom";
    friends: Array<{ name: string; share?: number }>;
    autoCreateSplitBill: boolean;
    autoLogToExpenses: boolean;
  };
}

export interface SubscriptionPreset {
  id: string;
  name: string;
  defaultPrice: number;
  defaultCategory: string;
  suggestedPlatform: string;
  color: string;
  bgColor: string;
  textColor: string;
  iconType: string;
}

export const POPULAR_PRESETS: SubscriptionPreset[] = [
  {
    id: "spotify",
    name: "Spotify Family / Duo",
    defaultPrice: 86900,
    defaultCategory: "Entertainment",
    suggestedPlatform: "Spotify Direct",
    color: "#1DB954",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    iconType: "Music",
  },
  {
    id: "google-one",
    name: "Google One 2TB",
    defaultPrice: 135000,
    defaultCategory: "Utilities",
    suggestedPlatform: "Google Play",
    color: "#4285F4",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
    iconType: "Cloud",
  },
  {
    id: "netflix",
    name: "Netflix Premium",
    defaultPrice: 186000,
    defaultCategory: "Entertainment",
    suggestedPlatform: "Direct / Credit Card",
    color: "#E50914",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    textColor: "text-rose-600 dark:text-rose-400",
    iconType: "Film",
  },
  {
    id: "chatgpt",
    name: "ChatGPT Plus",
    defaultPrice: 349000,
    defaultCategory: "Academics",
    suggestedPlatform: "OpenAI Direct",
    color: "#10A37F",
    bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
    textColor: "text-teal-600 dark:text-teal-400",
    iconType: "Bot",
  },
  {
    id: "claude",
    name: "Claude Pro",
    defaultPrice: 349000,
    defaultCategory: "Academics",
    suggestedPlatform: "Anthropic Direct",
    color: "#D97706",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    textColor: "text-amber-600 dark:text-amber-400",
    iconType: "Sparkles",
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium Family",
    defaultPrice: 139000,
    defaultCategory: "Entertainment",
    suggestedPlatform: "Google Play",
    color: "#FF0000",
    bgColor: "bg-red-500/10 dark:bg-red-500/20",
    textColor: "text-red-600 dark:text-red-400",
    iconType: "Video",
  },
  {
    id: "patreon",
    name: "Patreon Creator Tier",
    defaultPrice: 85000,
    defaultCategory: "Entertainment",
    suggestedPlatform: "Patreon",
    color: "#FF424D",
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    textColor: "text-pink-600 dark:text-pink-400",
    iconType: "HeartHandshake",
  },
  {
    id: "apple-one",
    name: "Apple One Family",
    defaultPrice: 179000,
    defaultCategory: "Entertainment",
    suggestedPlatform: "Apple App Store",
    color: "#A2AAAD",
    bgColor: "bg-zinc-500/10 dark:bg-zinc-500/20",
    textColor: "text-zinc-700 dark:text-zinc-300",
    iconType: "Layers",
  },
];

export const PAYMENT_PLATFORMS = [
  "Google Play",
  "Apple App Store",
  "Spotify Direct",
  "Patreon",
  "OpenAI Direct",
  "Kartu Kredit / Debit",
  "GoPay",
  "Dana",
  "OVO",
  "ShopeePay",
  "Bank Transfer",
  "Lainnya",
];
