import { SupabaseClient, User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { getNowInTimezone } from "@/utils/date";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
}

export const DAILY_AI_LIMIT = 30;

/**
 * Checks and increments the daily AI advisor message count stored in user_metadata.
 * Bypassed if user provides their own DeepSeek API Key.
 */
export async function checkAndIncrementAiUsage(
  supabase: SupabaseClient,
  user: User,
  limit: number = DAILY_AI_LIMIT
): Promise<RateLimitResult> {
  const today = format(getNowInTimezone(), "yyyy-MM-dd");
  const aiUsage = user.user_metadata?.ai_usage as { date?: string; count?: number } | undefined;

  let currentCount = 0;
  if (aiUsage && aiUsage.date === today && typeof aiUsage.count === "number") {
    currentCount = aiUsage.count;
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      count: currentCount,
    };
  }

  const newCount = currentCount + 1;

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
