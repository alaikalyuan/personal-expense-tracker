import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import SplitBillViewer from "./SplitBillViewer";
import {
  SplitBillRecord,
  SplitParticipantRecord,
  SplitItemRecord,
} from "@/utils/splitCalculator";

export default async function SplitBillPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // 1. Fetch Split Bill (Publicly readable via RLS)
  const { data: bill, error: billError } = await supabase
    .from("split_bills")
    .select("*")
    .eq("id", id)
    .single();

  if (billError || !bill) {
    notFound();
  }

  // 2. Fetch Participants
  const { data: participants } = await supabase
    .from("split_participants")
    .select("*")
    .eq("bill_id", id)
    .order("is_creator", { ascending: false });

  // 3. Fetch Items
  const { data: items } = await supabase
    .from("split_items")
    .select("*")
    .eq("bill_id", id);

  // 4. Check if current visitor is the host/creator
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isHost = Boolean(user && user.id === bill.creator_id);

  return (
    <main className="max-w-md mx-auto p-4 pb-28 font-sans">
      <SplitBillViewer
        bill={bill as SplitBillRecord}
        participants={(participants || []) as SplitParticipantRecord[]}
        items={(items || []) as SplitItemRecord[]}
        isHost={isHost}
      />
    </main>
  );
}
