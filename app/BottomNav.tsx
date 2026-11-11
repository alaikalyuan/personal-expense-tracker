"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, PiggyBank, Wallet, ArrowLeftRight } from "lucide-react";
import { getTodayString } from "@/utils/date";
import { useTranslation } from "@/utils/i18n/context";

// The add-expense modal is large, so it is fetched on the first tap (or when
// the pointer first reaches the button) instead of with every page.
const loadQuickAdd = () => import("./QuickAddExpense").then((mod) => mod.QuickAddModal);
const QuickAddModal = dynamic(loadQuickAdd, { ssr: false });

interface BottomNavProps {
  initialMultiSaku?: boolean;
  /** False for visitors with no session: they only see the welcome screen. */
  signedIn?: boolean;
}

export default function BottomNav({ initialMultiSaku = false, signedIn = true }: BottomNavProps) {
  const pathname = usePathname();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoaded, setAddLoaded] = useState(false);
  const multiSaku = initialMultiSaku;
  const today = getTodayString();
  const { t } = useTranslation();

  // The split bill creator and the shared bill view have their own bottom actions.
  const isSplitDetail = pathname.startsWith("/split/");
  if (!signedIn || pathname === "/login" || isSplitDetail) {
    return null;
  }

  const items = [
    { href: "/", label: t.home.navHome, Icon: Home, active: pathname === "/" },
    { href: "/split", label: t.home.navSplit, Icon: Users, active: pathname.startsWith("/split") },
    null,
    multiSaku
      ? {
          href: "/saku",
          label: t.saku.title,
          Icon: Wallet,
          active: pathname.startsWith("/saku") || pathname.startsWith("/savings"),
        }
      : { href: "/savings", label: t.nav.savings, Icon: PiggyBank, active: pathname.startsWith("/savings") },
    { href: "/compare", label: t.nav.compare, Icon: ArrowLeftRight, active: pathname.startsWith("/compare") },
  ];

  const openAdd = () => {
    setAddLoaded(true);
    setIsAddOpen(true);
  };

  return (
    <>
      <nav
        aria-label={t.home.navLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(43_33_24/0.06)]"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-1">
          {items.map((item) =>
            item === null ? (
              <li key="add" className="flex justify-center">
                <button
                  type="button"
                  onClick={openAdd}
                  onPointerEnter={() => void loadQuickAdd()}
                  onFocus={() => void loadQuickAdd()}
                  aria-label={t.nav.addExpense}
                  className="-mt-5 mb-1.5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-accent text-on-accent hover:brightness-95 active:brightness-90"
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
                </button>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs ${
                    item.active ? "font-bold text-ink" : "font-medium text-ink-soft hover:text-ink active:bg-paper"
                  }`}
                >
                  <item.Icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} aria-hidden="true" />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>

      {addLoaded && (
        <QuickAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} today={today} multiSakuEnabled={multiSaku} />
      )}
    </>
  );
}
