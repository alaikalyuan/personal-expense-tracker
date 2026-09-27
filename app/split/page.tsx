import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SplitBillHistoryClient, { HistoryBillRecord } from "./SplitBillHistoryClient";

export default async function SplitHistoryPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strict Auth Guard: Only logged in users can view history
  if (!user || user.is_anonymous) {
    redirect("/login?next=/split");
  }

  // Fetch all bills created by this host along with participants and items
  const { data: rawBills, error } = await supabase
    .from("split_bills")
    .select(`
      id,
      creator_id,
      title,
      split_mode,
      tax_percentage,
      service_percentage,
      discount_amount,
      extra_fee,
      rounding_step,
      payment_info,
      category,
      logged_expense_id,
      status,
      created_at,
      updated_at,
      split_participants (
        id,
        bill_id,
        name,
        is_creator,
        is_paid,
        paid_at
      ),
      split_items (
        id,
        bill_id,
        name,
        price,
        quantity,
        assigned_participant_ids
      )
    `)
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching split bills:", error);
  }

  const bills = (rawBills || []) as unknown as HistoryBillRecord[];

  return (
    <main className="max-w-md mx-auto p-4 pb-28 font-sans">
      <SplitBillHistoryClient initialBills={bills} />
    </main>
  );
}
