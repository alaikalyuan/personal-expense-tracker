import type { CreateSubscriptionPayload, SplitFriend, SubscriptionSplitConfig } from "./types";

/** Same values as the column default in supabase/schema.sql. */
export const DEFAULT_SPLIT_CONFIG: SubscriptionSplitConfig = {
  split_mode: "equal",
  friends: [],
  auto_create_split_bill: true,
  auto_log_to_expenses: true,
};

type PayloadSplitConfig = NonNullable<CreateSubscriptionPayload["splitConfig"]>;

function readFriends(input: unknown): SplitFriend[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((f): f is { name: unknown; share?: unknown } => typeof f === "object" && f !== null)
    .map((f) => {
      const friend: SplitFriend = { name: typeof f.name === "string" ? f.name : "" };
      if (typeof f.share === "number" && Number.isFinite(f.share)) friend.share = f.share;
      return friend;
    });
}

function readBool(snake: unknown, camel: unknown, fallback: boolean): boolean {
  if (typeof snake === "boolean") return snake;
  if (typeof camel === "boolean") return camel;
  return fallback;
}

/**
 * Reads a stored `split_config` into the snake_case shape.
 *
 * Rows written before this fix hold the client payload's camelCase keys
 * (`splitMode`, `autoCreateSplitBill`, `autoLogToExpenses`), so those are
 * accepted as a fallback. Snake_case keys win when both are present.
 */
export function normalizeSplitConfig(raw: unknown): SubscriptionSplitConfig {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SPLIT_CONFIG, friends: [] };
  const c = raw as Record<string, unknown>;
  const mode = c.split_mode ?? c.splitMode;
  return {
    split_mode: mode === "custom" ? "custom" : "equal",
    friends: readFriends(c.friends),
    auto_create_split_bill: readBool(
      c.auto_create_split_bill,
      c.autoCreateSplitBill,
      DEFAULT_SPLIT_CONFIG.auto_create_split_bill
    ),
    auto_log_to_expenses: readBool(
      c.auto_log_to_expenses,
      c.autoLogToExpenses,
      DEFAULT_SPLIT_CONFIG.auto_log_to_expenses
    ),
  };
}

/** Converts the client's camelCase `splitConfig` into the stored snake_case shape. */
export function toDbSplitConfig(config: PayloadSplitConfig | undefined): SubscriptionSplitConfig {
  return normalizeSplitConfig(config);
}

/** Returns the row with `split_config` normalised; other fields are untouched. */
export function withNormalizedSplitConfig<T extends { split_config?: unknown }>(
  row: T
): T & { split_config: SubscriptionSplitConfig } {
  return { ...row, split_config: normalizeSplitConfig(row.split_config) };
}
