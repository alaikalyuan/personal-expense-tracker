import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import SplitBillViewer from "./SplitBillViewer";
import {
  SplitBillRecord,
  SplitParticipantRecord,
  SplitItemRecord,
} from "@/utils/splitCalculator";

type SharedSplitBill = {
  is_host: boolean;
  bill: Omit<SplitBillRecord, "creator_id"> & { creator_id: string | null };
  participants: SplitParticipantRecord[];
  items: SplitItemRecord[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SplitBillPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // The split tables are readable by their creator only. Anyone with the link
  // reads this one bill through a SECURITY DEFINER function that can't list others.
  const { data, error } = await supabase.rpc("get_shared_split_bill", {
    p_bill_id: id,
  });

  const shared = data as SharedSplitBill | null;
  if (error || !shared) {
    notFound();
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-28 font-sans">
      <SplitBillViewer
        bill={{ ...shared.bill, creator_id: shared.bill.creator_id ?? "" }}
        participants={shared.participants}
        items={shared.items}
        isHost={shared.is_host}
      />
    </main>
  );
}
