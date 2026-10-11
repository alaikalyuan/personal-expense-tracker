import { SupabaseClient, User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { getNowInTimezone } from "@/utils/date";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
}

export const DAILY_AI_LIMIT = 20;
export const PHOTO_AI_COST = 5;

/**
 * Checks and increments the daily AI advisor message count stored in user_metadata.
 * Bypassed if user provides their own DeepSeek API Key.
 *
 * @param cost Number of units to consume (1 for text message, 5 for photo upload)
 * @param limit Daily limit quota (default: 20)
 * @param allowOverflow If true, allows operations if currentCount < limit even if adding cost exceeds limit
 */
export async function checkAndIncrementAiUsage(
  supabase: SupabaseClient,
  user: User,
  cost: number = 1,
  limit: number = DAILY_AI_LIMIT,
  allowOverflow: boolean = true
): Promise<RateLimitResult> {
  const today = format(getNowInTimezone(), "yyyy-MM-dd");
  const aiUsage = user.user_metadata?.ai_usage as { date?: string; count?: number } | undefined;

  let currentCount = 0;
  if (aiUsage && aiUsage.date === today && typeof aiUsage.count === "number") {
    currentCount = aiUsage.count;
  }

  // If already at or above limit, reject
  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      count: currentCount,
    };
  }

  // If overflow is disallowed and adding cost would exceed limit, reject
  if (!allowOverflow && currentCount + cost > limit) {
    return {
      allowed: false,
      remaining: Math.max(0, limit - currentCount),
      limit,
      count: currentCount,
    };
  }

  const newCount = currentCount + cost;

  // Persist updated count to user_metadata asynchronously
  try {
    await supabase.auth.updateUser({
      data: {
        ai_usage: {
          date: today,
          count: newCount,
        },
      },
    });
  } catch (err) {
    console.warn("Failed to persist AI usage to metadata:", err);
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - newCount),
    limit,
    count: newCount,
  };
}

/**
 * Read-only getter for the current daily AI advisor message count stored in user_metadata.
 */
export function getDailyAiUsage(
  user: User,
  limit: number = DAILY_AI_LIMIT
): RateLimitResult {
  const today = format(getNowInTimezone(), "yyyy-MM-dd");
  const aiUsage = user.user_metadata?.ai_usage as { date?: string; count?: number } | undefined;

  let currentCount = 0;
  if (aiUsage && aiUsage.date === today && typeof aiUsage.count === "number") {
    currentCount = aiUsage.count;
  }

  return {
    allowed: currentCount < limit,
    remaining: Math.max(0, limit - currentCount),
    limit,
    count: currentCount,
  };
}
