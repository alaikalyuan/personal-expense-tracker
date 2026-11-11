"use client";

import { useEffect, useId, useRef } from "react";
import type { HTMLAttributes } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Drop-in replacement for the `<div className="fixed inset-0 ...">` backdrop
 * used by the older modals. It keeps their markup and adds what they lacked:
 * a dialog role and name, Escape to close, Tab kept inside, and focus handed
 * back to whatever opened the modal.
 *
 * New dialogs should use `app/ui/Dialog.tsx` instead.
 */
export default function ModalOverlay({ children, onMouseDown, onKeyDown, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const fallbackTitleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const opener = document.activeElement as HTMLElement | null;

    // Name the dialog after its first heading unless the caller already did.
    if (!el.getAttribute("aria-labelledby") && !el.getAttribute("aria-label")) {
      const heading = el.querySelector("h1, h2, h3");
      if (heading) {
        if (!heading.id) heading.id = fallbackTitleId;
        el.setAttribute("aria-labelledby", heading.id);
      }
    }

    // Leave focus alone if the modal placed it itself (for example on an amount field).
    if (!el.contains(document.activeElement)) {
      el.focus();
    }

    return () => {
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [fallbackTitleId]);

  const close = () => {
    const el = ref.current;
    if (!el) return;
    // Prefer the modal's own close button so its "busy" guards still apply.
    const closeButton = Array.from(el.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.querySelector("svg.lucide-x") && !button.closest("li, label")
    );
    if (closeButton) {
      if (!closeButton.disabled) closeButton.click();
      return;
    }
    // Otherwise behave like a tap on the backdrop.
    onMouseDown?.({ target: el, currentTarget: el } as unknown as React.MouseEvent<HTMLDivElement>);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;

    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;

    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (item) => item.offsetParent !== null
    );
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      {...rest}
      ref={ref}
      onMouseDown={onMouseDown}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
