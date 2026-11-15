"use client";

import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { caretAfterDigits } from "@/utils/money";

/**
 * Keeps the caret beside the same digit when a field regroups its text
 * ("2500" → "2.500"). Call `remember` in the change handler, before the
 * state update that reformats the value, with the text being parsed and the
 * caret position in it.
 */
export function useGroupedCaret(inputRef: RefObject<HTMLInputElement | null>) {
  const pendingDigits = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const digits = pendingDigits.current;
    pendingDigits.current = null;
    if (!input || digits === null || document.activeElement !== input) return;
    const pos = caretAfterDigits(input.value, digits);
    input.setSelectionRange(pos, pos);
  });

  return (text: string, caret: number | null) => {
    pendingDigits.current = caret === null ? null : text.slice(0, caret).replace(/\D/g, "").length;
  };
}
