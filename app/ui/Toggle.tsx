"use client";

import { useRef } from "react";
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { Check } from "lucide-react";

interface ToggleChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> {
  pressed: boolean;
  /**
   * `chip` for text pickers (categories, presets, people); `swatch` for a
   * 44px square holding an emoji or a colour, which needs an `aria-label`
   * naming its value ("Warna hijau").
   */
  variant?: "chip" | "swatch";
}

/**
 * A button that stays on or off. The state is exposed with `aria-pressed`
 * and shown by a check mark and a heavier ink border, not by colour alone
 * (WCAG 1.4.1, 4.1.2).
 */
export function ToggleChip({ pressed, variant = "chip", className = "", children, type = "button", ...rest }: ToggleChipProps) {
  if (variant === "swatch") {
    return (
      <button
        type={type}
        aria-pressed={pressed}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-xl disabled:opacity-50 ${
          pressed ? "border-ink" : "border-transparent hover:border-field-line"
        } ${className}`}
        {...rest}
      >
        {children}
        {pressed && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-card">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm disabled:opacity-50 ${
        pressed
          ? "border-ink bg-ink text-card font-bold ring-1 ring-ink"
          : "border-field-line bg-card text-ink font-semibold hover:bg-paper active:bg-line"
      } ${className}`}
      {...rest}
    >
      {pressed && <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={3} />}
      {children}
    </button>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when `label` is not plain text. */
  ariaLabel?: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  /** Names the group, for example "Cara mencatat". */
  ariaLabel: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * One choice out of a few, as an ARIA radio group: arrow keys move the
 * choice, Tab enters and leaves the group once. The chosen segment has an
 * ink border and bold text, so it doesn't rely on colour.
 */
export function SegmentedControl<T extends string>({ ariaLabel, options, value, onChange, className = "" }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((o) => !o.disabled);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step || enabled.length === 0) return;
    e.preventDefault();
    const current = enabled.findIndex((o) => o.value === value);
    const next = enabled[(current + step + enabled.length) % enabled.length];
    onChange(next.value);
    refs.current[options.indexOf(next)]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} onKeyDown={handleKeyDown} className={`flex gap-1 rounded-xl bg-paper p-1 ${className}`}>
      {options.map((option, i) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.ariaLabel}
            tabIndex={checked || (!options.some((o) => o.value === value) && option === enabled[0]) ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-3 text-sm disabled:opacity-50 ${
              checked ? "border-ink bg-card font-bold text-ink" : "border-transparent font-semibold text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
