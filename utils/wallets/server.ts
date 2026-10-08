import type { SupabaseClient } from "@supabase/supabase-js";
import { SupportedCurrency, DEFAULT_CURRENCY, isSupportedCurrency } from "@/utils/money";
import { SavingsGoalItem } from "@/app/savings/SavingsClient";
import { SavingsHistoryItem } from "@/app/actions";

export interface UserSettings {
  user_id: string;
  base_currency: SupportedCurrency;
  multi_saku_enabled: boolean;
  default_wallet_id: string | null;
  created_at: string;
  updated_at: string;
}

export type WalletKind = "spending" | "stash";

export interface Wallet {
  id: string;
  user_id: string;
  kind: WalletKind;
  name: string;
  emoji: string;
  color: string;
  currency: SupportedCurrency;
  is_primary: boolean;
  track_balance: boolean;
  opening_balance: number;
  weekly_budget: number | null;
  monthly_budget: number | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance extends Wallet {
  total_inflow: number;
  total_outflow: number;
  current_balance: number;
}

export interface SavingsGoalRow {
  id: string;
  wallet_id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  allocated_amount: number;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawWalletRow {
  id: string;
  user_id: string;
  kind: string;
  name: string;
  emoji: string;
  color: string;
  currency: string;
  is_primary: boolean;
  track_balance: boolean;
  opening_balance: number | string;
  weekly_budget: number | string | null;
  monthly_budget: number | string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawWalletBalanceRow extends RawWalletRow {
  wallet_id: string;
  total_inflow: number | string;
  total_outflow: number | string;
  current_balance: number | string;
}

interface RawSavingsGoalRow {
  id: string;
  wallet_id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  target_amount: number | string;
  allocated_amount: number | string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawTransactionRow {
  id: string;
  type: string;
  amount: number | string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  goal_id: string | null;
  note: string | null;
  occurred_on: string;
  created_at: string | null;
  savings_goals: {
    name: string;
    emoji: string | null;
  } | null;
}

/**
 * Fetch or initialize user settings
 */
export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data && !error) {
      const baseCur = isSupportedCurrency(data.base_currency)
        ? data.base_currency
        : DEFAULT_CURRENCY;
      return {
        user_id: data.user_id,
        base_currency: baseCur,
        multi_saku_enabled: Boolean(data.multi_saku_enabled),
        default_wallet_id: data.default_wallet_id || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (err) {
    console.error("getUserSettings error:", err);
  }

  // Fallback from metadata or defaults
  const metaCurrency = typeof userMetadata?.base_currency === "string" ? userMetadata.base_currency : undefined;
  const baseCurrency = isSupportedCurrency(metaCurrency)
    ? metaCurrency
    : DEFAULT_CURRENCY;

  return {
    user_id: userId,
    base_currency: baseCurrency,
    multi_saku_enabled: false,
    default_wallet_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch active wallets for a user
 */
export async function getWallets(
  supabase: SupabaseClient,
  userId: string,
  options?: { includeArchived?: boolean }
): Promise<Wallet[]> {
  try {
    let query = supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!options?.includeArchived) {
      query = query.is("archived_at", null);
    }

    const { data, error } = await query;
    if (data && !error) {
      const rows = data as unknown as RawWalletRow[];
      return rows.map((w) => ({
        ...w,
        kind: (w.kind === "stash" ? "stash" : "spending") as WalletKind,
        opening_balance: Number(w.opening_balance || 0),
        weekly_budget: w.weekly_budget !== null && w.weekly_budget !== undefined ? Number(w.weekly_budget) : null,
        monthly_budget: w.monthly_budget !== null && w.monthly_budget !== undefined ? Number(w.monthly_budget) : null,
        currency: isSupportedCurrency(w.currency) ? w.currency : DEFAULT_CURRENCY,
      }));
    }
  } catch (err) {
    console.error("getWallets error:", err);
  }
  return [];
}

/**
 * Fetch wallet balances computed via wallet_balances view
 */
export async function getWalletBalances(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletBalance[]> {
  try {
    const { data, error } = await supabase
      .from("wallet_balances")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (data && !error) {
      const rows = data as unknown as RawWalletBalanceRow[];
      return rows.map((b) => ({
        id: b.wallet_id,
        user_id: b.user_id,
        kind: (b.kind === "stash" ? "stash" : "spending") as WalletKind,
        name: b.name,
        emoji: b.emoji,
        color: b.color,
        currency: (isSupportedCurrency(b.currency) ? b.currency : DEFAULT_CURRENCY) as SupportedCurrency,
        is_primary: Boolean(b.is_primary),
        track_balance: Boolean(b.track_balance),
        opening_balance: Number(b.opening_balance || 0),
        weekly_budget: b.weekly_budget !== null && b.weekly_budget !== undefined ? Number(b.weekly_budget) : null,
        monthly_budget: b.monthly_budget !== null && b.monthly_budget !== undefined ? Number(b.monthly_budget) : null,
        sort_order: Number(b.sort_order || 0),
        archived_at: b.archived_at,
        created_at: b.created_at || new Date().toISOString(),
        updated_at: b.updated_at || new Date().toISOString(),
        total_inflow: Number(b.total_inflow || 0),
        total_outflow: Number(b.total_outflow || 0),
        current_balance: Number(b.current_balance || 0),
      }));
    }
  } catch (err) {
    console.error("getWalletBalances error:", err);
  }
  return [];
}

/**
 * Get primary spending and stash wallets for a user with metadata fallback
 */
export async function getPrimaryWallets(
  supabase: SupabaseClient,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<{
  spendingWallet: WalletBalance | null;
  stashWallet: WalletBalance | null;
  defaultWalletId: string | null;
}> {
  const balances = await getWalletBalances(supabase, userId);

  let spending = balances.find((b) => b.is_primary && b.kind === "spending") || null;
  if (!spending) {
    spending = balances.find((b) => b.kind === "spending") || null;
  }

  let stash = balances.find((b) => b.kind === "stash") || null;

  // Fallback for spending wallet if not found in database (e.g. guest mode)
  if (!spending && userMetadata) {
    const weeklyBudget = Number(userMetadata.weekly_budget || 500000);
    const monthlyBudget = userMetadata.monthly_budget ? Number(userMetadata.monthly_budget) : null;
    spending = {
      id: "fallback-spending",
      user_id: userId,
      kind: "spending",
      name: "Dompet Utama",
      emoji: "👛",
      color: "#10b981",
      currency: DEFAULT_CURRENCY,
      is_primary: true,
      track_balance: false,
      opening_balance: 0,
      weekly_budget: weeklyBudget,
      monthly_budget: monthlyBudget,
      sort_order: 0,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_inflow: 0,
      total_outflow: 0,
      current_balance: 0,
    };
  }

  // Fallback for stash wallet if not found in database (e.g. guest mode)
  if (!stash && userMetadata) {
    const coreSavings = Number(userMetadata.savings_manual_deposit || 0);
    stash = {
      id: "fallback-stash",
      user_id: userId,
      kind: "stash",
      name: "Tabungan",
      emoji: "🏦",
      color: "#0d9488",
      currency: DEFAULT_CURRENCY,
      is_primary: false,
      track_balance: true,
      opening_balance: coreSavings,
      weekly_budget: null,
      monthly_budget: null,
      sort_order: 1,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_inflow: 0,
      total_outflow: 0,
      current_balance: coreSavings,
    };
  }

  return {
    spendingWallet: spending,
    stashWallet: stash,
    defaultWalletId: spending?.id || null,
  };
}

/**
 * Fetch savings goals from savings_goals table with fallback to user_metadata
 */
export async function getSavingsGoals(
  supabase: SupabaseClient,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<SavingsGoalItem[]> {
  try {
    const { data, error } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (data && !error && data.length > 0) {
      const rows = data as unknown as RawSavingsGoalRow[];
      return rows.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount || 0),
        allocatedAmount: Number(g.allocated_amount || 0),
        emoji: g.emoji || "🎯",
        createdAt: g.created_at,
      }));
    }
  } catch (err) {
    console.error("getSavingsGoals error:", err);
  }

  // Fallback to metadata
  if (Array.isArray(userMetadata?.savings_goals)) {
    return userMetadata.savings_goals as SavingsGoalItem[];
  }
  return [];
}

/**
 * Fetch savings transaction history with fallback to user_metadata
 */
export async function getSavingsHistory(
  supabase: SupabaseClient,
  userId: string,
  stashWalletId?: string,
  userMetadata?: Record<string, unknown>
): Promise<SavingsHistoryItem[]> {
  try {
    let query = supabase
      .from("wallet_transactions")
      .select(`
        id,
        type,
        amount,
        from_wallet_id,
        to_wallet_id,
        goal_id,
        note,
        occurred_on,
        created_at,
        savings_goals (
          name,
          emoji
        )
      `)
      .eq("user_id", userId);

    if (stashWalletId) {
      query = query.or(`from_wallet_id.eq.${stashWalletId},to_wallet_id.eq.${stashWalletId}`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: true });

    if (data && !error && data.length > 0) {
      const rows = data as unknown as RawTransactionRow[];
      // Calculate running balance chronologically
      let runningBalance = 0;
      const chronological = rows.map((tx) => {
        const amount = Number(tx.amount || 0);
        const isToStash = stashWalletId ? tx.to_wallet_id === stashWalletId : true;
        const isFromStash = stashWalletId ? tx.from_wallet_id === stashWalletId : false;

        let uiType: SavingsHistoryItem["type"] = "manual_deposit";
        if (tx.type === "surplus_sweep") {
          uiType = tx.goal_id ? "surplus_sweep_goal" : "surplus_sweep";
          runningBalance += amount;
        } else if (tx.type === "adjustment") {
          if (isFromStash) {
            uiType = "manual_withdraw";
            runningBalance = Math.max(0, runningBalance - amount);
          } else {
            uiType = "manual_deposit";
            runningBalance += amount;
          }
        } else if (tx.type === "goal_allocate") {
          uiType = "goal_allocate";
        } else if (tx.type === "goal_withdraw") {
          uiType = "goal_withdraw";
        } else if (isToStash) {
          uiType = "manual_deposit";
          runningBalance += amount;
        } else if (isFromStash) {
          uiType = "manual_withdraw";
          runningBalance = Math.max(0, runningBalance - amount);
        }

        const goalName = tx.savings_goals?.name || undefined;
        const goalEmoji = tx.savings_goals?.emoji || undefined;

        return {
          id: tx.id,
          type: uiType,
          amount,
          balanceAfter: runningBalance,
          note: tx.note || undefined,
          goalId: tx.goal_id || undefined,
          goalName,
          goalEmoji,
          createdAt: tx.created_at || `${tx.occurred_on}T00:00:00Z`,
        };
      });

      // Reverse so newest is first
      return chronological.reverse();
    }
  } catch (err) {
    console.error("getSavingsHistory error:", err);
  }

  // Fallback to metadata
  if (Array.isArray(userMetadata?.savings_history)) {
    return userMetadata.savings_history as SavingsHistoryItem[];
  }
  return [];
}
