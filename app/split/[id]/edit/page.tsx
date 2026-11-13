import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import SplitBillCreator from "@/app/split/new/SplitBillCreator";
import { getWallets, getUserSettings } from "@/utils/wallets/server";
import {
  SplitBillRecord,
  SplitParticipantRecord,
  SplitItemRecord,
} from "@/utils/splitCalculator";

export default async function EditSplitBillPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    redirect(`/login?next=/split/${id}/edit`);
  }

  // Fetch Split Bill
  const { data: bill, error: billError } = await supabase
    .from("split_bills")
    .select("*")
    .eq("id", id)
    .single();

  // RLS returns no row to anyone but the creator, so a missing bill here can also
  // mean "not yours". The friend view decides between showing it and a 404.
  if (billError || !bill || bill.creator_id !== user.id) {
    redirect(`/split/${id}`);
  }

  // Fetch Participants & Items
  const [{ data: participants }, { data: items }, userSettings, wallets] =
    await Promise.all([
      supabase
        .from("split_participants")
        .select("*")
        .eq("bill_id", id)
        .order("is_creator", { ascending: false }),
      supabase.from("split_items").select("*").eq("bill_id", id),
      getUserSettings(supabase, user.id),
      getWallets(supabase, user.id),
    ]);

  // If linked expense exists, read its wallet_id so the wallet selector matches
  let loggedWalletId: string | null = null;
  if (bill.logged_expense_id) {
    const { data: linkedExpense } = await supabase
      .from("expenses")
      .select("wallet_id")
      .eq("id", bill.logged_expense_id)
      .eq("user_id", user.id)
      .maybeSingle();
    loggedWalletId = linkedExpense?.wallet_id || null;
  }

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
        mode="edit"
        initialData={{
          bill: bill as SplitBillRecord,
          participants: (participants || []) as SplitParticipantRecord[],
          items: (items || []) as SplitItemRecord[],
          loggedWalletId,
        }}
      />
    </main>
  );
}
