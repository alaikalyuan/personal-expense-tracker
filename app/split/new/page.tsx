import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SplitBillCreator from "./SplitBillCreator";

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

  const defaultPayment = user.user_metadata?.default_split_payment || null;
  const creatorName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Saya";

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-36 pt-4 sm:pt-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <SplitBillCreator
          creatorName={creatorName}
          defaultPayment={defaultPayment}
        />
      </div>
    </main>
  );
}
