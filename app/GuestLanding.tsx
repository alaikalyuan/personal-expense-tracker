"use client";

import { useEffect, useState } from "react";
import WelcomeGuestModal from "./WelcomeGuestModal";
import UpgradeAccountModal from "./UpgradeAccountModal";

interface GuestLandingProps {
  next?: string;
  initialAuthMode?: "login" | "signup";
  initialAuthError?: string;
}

/**
 * Shown on "/" to visitors without a session. Nothing is created in Supabase
 * until they choose to continue as a guest, log in, or sign up.
 */
export default function GuestLanding({ next, initialAuthMode, initialAuthError }: GuestLandingProps) {
  const [authMode, setAuthMode] = useState<"signup" | "login" | null>(initialAuthMode ?? null);

  // Strip one-shot params (?auth, ?error) so a refresh doesn't reopen the modal.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("auth") || url.searchParams.has("error")) {
      url.searchParams.delete("auth");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  return (
    <>
      {authMode === null && <WelcomeGuestModal next={next} onOpenAuth={setAuthMode} />}
      <UpgradeAccountModal
        isOpen={authMode !== null}
        onClose={() => setAuthMode(null)}
        initialMode={authMode ?? "signup"}
        initialError={initialAuthError ?? null}
      />
    </>
  );
}
