import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SplitBillCreator from "./SplitBillCreator";
import { getWallets, getUserSettings } from "@/utils/wallets/server";

export default async function NewSplitBillPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strict Auth Guard: Only logged in users (not guests) can access Creator UI
  if (!user || user.is_anonymous) {
    redirect("/login?next=/split/new");
  }

  const userSettings = await getUserSettings(supabase, user.id);
  const wallets = await getWallets(supabase, user.id);

  const defaultPayment = user.user_metadata?.default_split_payment || null;
  const creatorName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Saya";

  return (
    <main className="max-w-md mx-auto p-4 pb-36 font-sans">
      <SplitBillCreator
        creatorName={creatorName}
        defaultPayment={defaultPayment}
        wallets={wallets}
        multiSakuEnabled={userSettings.multi_saku_enabled}
        defaultWalletId={userSettings.default_wallet_id}
      />
    </main>
  );
}
