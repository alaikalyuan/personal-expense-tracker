import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWebPushNotification } from "@/utils/pwa/webPushServer";
import { getDailyQuote } from "@/utils/pwa/quotes";
import { getTodayString, getNowInTimezone } from "@/utils/date";
import { computeNextRenewalDate } from "@/app/subscriptions/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secretParam = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET || "sakutrack_secret_cron_key_2026";

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    secretParam === cronSecret ||
    process.env.NODE_ENV === "development";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const todayStr = getTodayString();
  const now = getNowInTimezone();
  const currentHour = now.getHours();

  let sentPushes = 0;
  let processedRenewals = 0;

  // 1. Process Due & Approaching Subscriptions
  try {
    const { data: subs, error: subsError } = await supabase.rpc(
      "get_due_subscriptions_for_cron"
    );

    if (!subsError && subs && subs.length > 0) {
      for (const sub of subs) {
        const daysDiff = Math.ceil(
          (new Date(sub.next_renewal_date).getTime() - new Date(todayStr).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Fetch user push subscriptions
        const { data: userPushSubs } = await supabase.rpc(
          "get_push_subscriptions_for_user",
          { target_user_id: sub.user_id }
        );

        const pushSubs = userPushSubs || [];

        // CASE A: Renewal Day Has Arrived (daysDiff <= 0)
        if (daysDiff <= 0 && sub.last_processed_date !== sub.next_renewal_date) {
          const nextDate = computeNextRenewalDate(sub.next_renewal_date, sub.billing_cycle);

          // Update subscription cycle
          await supabase
            .from("subscriptions")
            .update({
              next_renewal_date: nextDate,
              last_processed_date: sub.next_renewal_date,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);

          processedRenewals++;

          // Send push notification
          for (const pSub of pushSubs) {
            await sendWebPushNotification(pSub, {
              title: sub.is_split
                ? `✨ Jadwal Split Bill: ${sub.name}`
                : `📅 Perpanjangan Langganan: ${sub.name}`,
              body: sub.is_split
                ? `Langganan patungan ${sub.name} jatuh tempo hari ini. Buka aplikasi untuk memeriksa rincian patungan.`
                : `${sub.name} diperpanjang hari ini (Rp ${Number(sub.price).toLocaleString("id-ID")}).`,
              url: sub.is_split ? "/split" : "/subscriptions",
              tag: `renewal-${sub.id}`,
            });
            sentPushes++;
          }
        }
        // CASE B: Approaching Renewal Warning (e.g. 1-3 days prior)
        else if (daysDiff > 0 && daysDiff <= (sub.reminder_days_before || 2)) {
          for (const pSub of pushSubs) {
            await sendWebPushNotification(pSub, {
              title: `⏰ Pengingat Langganan: ${sub.name}`,
              body: `${sub.name} akan diperpanjang dalam ${daysDiff} hari (${sub.next_renewal_date}).`,
              url: "/subscriptions",
              tag: `upcoming-${sub.id}`,
            });
            sentPushes++;
          }
        }
      }
    }
  } catch (err) {
    console.error("Cron subscription processing error:", err);
  }

  // 2. Daily Record Reminders & Motivational Quotes
  // Run during evening hours (e.g. 19:00 - 22:00)
  if (currentHour >= 19 && currentHour <= 22) {
    try {
      // Find users with push subscriptions
      const { data: allPushUsers } = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth");

      if (allPushUsers && allPushUsers.length > 0) {
        // Group by user_id
        const userMap = new Map<string, typeof allPushUsers>();
        for (const item of allPushUsers) {
          const list = userMap.get(item.user_id) || [];
          list.push(item);
          userMap.set(item.user_id, list);
        }

        const quoteObj = getDailyQuote("id");

        for (const [userId, userDevices] of userMap.entries()) {
          // Check if user has logged any expense today
          const { count } = await supabase
            .from("expenses")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("spent_at", todayStr);

          // If no expenses logged today, send daily reminder with quote
          if (count === 0) {
            for (const dev of userDevices) {
              await sendWebPushNotification(dev, {
                title: "📝 Pengingat Catat Pengeluaran Hari Ini",
                body: `Belum ada catatan hari ini!\n"${quoteObj.quote}"`,
                url: "/",
                tag: `daily-reminder-${todayStr}`,
              });
              sentPushes++;
            }
          }
        }
      }
    } catch (err) {
      console.error("Cron daily reminder error:", err);
    }
  }

  return NextResponse.json({
    success: true,
    processedRenewals,
    sentPushes,
    timestamp: new Date().toISOString(),
  });
}
