import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubscriptionsClient from "./SubscriptionsClient";
import { SubscriptionRecord } from "./types";
import { processSubscriptionRenewals } from "./actions";

export const metadata = {
  title: "Langganan Digital : SakuTrack",
  description: "Kelola langganan aplikasi digital, pengingat jatuh tempo, dan tagihan patungan",
};

export default async function SubscriptionsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/guest");
  }

  const isGuest = Boolean(user.is_anonymous);

  // Proactive sync: check and process any overdue / due renewals right as user loads the page
  if (!isGuest) {
    try {
      await processSubscriptionRenewals(user.id);
    } catch (e) {
      console.warn("Proactive subscription renewal sync failed:", e);
    }
  }

  // Fetch all subscriptions for user
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_renewal_date", { ascending: true });

  return (
    <SubscriptionsClient
      initialSubscriptions={(subscriptions || []) as SubscriptionRecord[]}
      isGuest={isGuest}
    />
  );
}
