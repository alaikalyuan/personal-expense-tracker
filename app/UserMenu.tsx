"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import {
  MoreVertical,
  Archive,
  Wallet,
  ArrowLeftRight,
  LogOut,
  Languages,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isArchive = pathname.startsWith("/archive");
  const isTracker = pathname === "/";
  const isCompare = pathname.startsWith("/compare");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.nav.openMenu}
        aria-expanded={isOpen}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl shadow-black/80 backdrop-blur-md animate-modal-in"
        >
          {/* Menu Items */}
          <div className="flex flex-col gap-0.5">
            {!isTracker && (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.nav.tracker}</span>
              </Link>
            )}

            {!isArchive && (
              <Link
                href="/archive"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.nav.archive}</span>
              </Link>
            )}

            {!isCompare && (
              <Link
                href="/compare"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.nav.compare}</span>
              </Link>
            )}

            <div className="my-1 border-t border-zinc-800/80" />

            {/* Language Selector */}
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-zinc-300">
              <span className="flex items-center gap-2 text-zinc-400">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">{t.nav.language}</span>
              </span>
              <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setLocale("id")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    locale === "id"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    locale === "en"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="my-1 border-t border-zinc-800/80" />

            {/* Logout Action */}
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.signOut}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

