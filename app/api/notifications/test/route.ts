import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { sendWebPushNotification } from "@/utils/pwa/webPushServer";
import { getRandomQuote } from "@/utils/pwa/quotes";
import { getDictionaryServer } from "@/utils/i18n/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's push subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id);

    if (subsError || !subs || subs.length === 0) {
      return NextResponse.json(
        { error: "Belum ada perangkat yang terdaftar untuk push notification. Aktifkan izin notifikasi terlebih dahulu." },
        { status: 400 }
      );
    }

    const { locale } = await getDictionaryServer();
    const quoteObj = getRandomQuote(locale);

    const payload = {
      title: "✨ SakuTrack: Tes Notifikasi Berhasil!",
      body: `Notifikasi PWA kamu sudah aktif.\n"${quoteObj.quote}" — ${quoteObj.author}`,
      url: "/",
      tag: "sakutrack-test",
    };

    let sentCount = 0;
    const deadEndpoints: string[] = [];

    for (const sub of subs) {
      const res = await sendWebPushNotification(sub, payload);
      if (res.success) {
        sentCount++;
      } else if (res.statusCode === 404 || res.statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
      }
    }

    // Clean up expired or unregistered endpoints
    if (deadEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", deadEndpoints);
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalEndpoints: subs.length,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
