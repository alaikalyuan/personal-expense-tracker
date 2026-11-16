"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { deleteAcrossSeparator, formatRupiahInput, parseMoneyTyping, parseRupiahInput, parseRupiahTyping } from "@/utils/money";
import type { SupportedCurrency } from "@/utils/money";
import { useGroupedCaret } from "./useGroupedCaret";

export const CONTROL_CLASS =
  "min-h-11 w-full rounded-xl border border-field-line bg-paper px-3 text-base text-ink placeholder:text-ink-soft/70 hover:border-ink-soft disabled:opacity-50";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: (ids: { id: string; describedBy?: string }) => React.ReactNode;
}

/** A visible label wired to its control, with optional hint and error text. */
export function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, className = "", ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL_CLASS} ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function SelectField({ label, hint, error, className = "", children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL_CLASS} ${className}`}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function TextareaField({ label, hint, error, className = "", rows = 3, ...rest }: TextareaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL_CLASS} py-2.5 ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  label: ReactNode;
  hint?: string;
}

/**
 * A checkbox inside its label, so the whole row (at least 44px tall) is the
 * target and the label text is its accessible name.
 */
export function CheckboxField({ label, hint, className = "", ...rest }: CheckboxFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-sm font-medium text-ink">
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? hintId : undefined}
          className="h-5 w-5 shrink-0 accent-[var(--accent)]"
          {...rest}
        />
        <span className="min-w-0 flex-1">{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="pl-8 text-xs text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

interface MoneyFieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  /**
   * Plain digits ("15000") once the text parses, otherwise the text as
   * typed ("15.000,50"). Read it with `parseRupiahInput`.
   */
  value: string;
  onChange: (value: string) => void;
  /** Form field name; the submitted value is the plain digits. */
  name?: string;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Accept 0 as a valid amount. */
  allowZero?: boolean;
  /** Largest amount allowed, for example the balance that can be withdrawn. */
  max?: number;
  /** Message shown when the amount is above `max`. */
  maxError?: string;
}

/**
 * A rupiah amount. Groups thousands while typing ("15.000"); text that
 * does not parse (a decimal comma, letters, a minus sign) is kept as typed,
 * shown with an inline error once the field is left, and blocks the form.
 */
export function MoneyField({
  label,
  hint,
  error,
  value,
  onChange,
  name,
  prefix = "Rp",
  placeholder = "0",
  required,
  autoFocus,
  disabled,
  allowZero,
  max,
  maxError,
}: MoneyFieldProps) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = value ? parseRupiahInput(value, { allowZero, max, maxError }) : null;
  const parseError = parsed && !parsed.ok ? parsed.error : null;
  // Grouped whenever it is a valid number, even one above `max`.
  const plain = value ? parseRupiahInput(value, { allowZero: true }) : null;
  const display = plain?.ok ? formatRupiahInput(plain.value) : value;
  // An amount above `max` is shown straight away; a typing error once the field is left.
  const overMax = parsed && !parsed.ok && max !== undefined && plain?.ok === true;
  const shownError = error || (touched || overMax ? parseError : null);

  useEffect(() => {
    inputRef.current?.setCustomValidity(parseError ?? "");
  }, [parseError]);

  const rememberCaret = useGroupedCaret(inputRef);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const { text, caret } = deleteAcrossSeparator(
      display,
      input.value,
      input.selectionStart ?? input.value.length,
      (e.nativeEvent as InputEvent).inputType
    );
    rememberCaret(text, input.selectionStart === null ? null : caret);
    // The field regroups as it goes, so its own dots may be out of place mid-edit.
    const result = parseRupiahTyping(text, { allowZero: true });
    onChange(result.ok && text.trim() ? String(result.value) : text);
  };

  return (
    <FieldShell label={label} hint={hint} error={shownError}>
      {({ id, describedBy }) => (
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-ink-soft">
            {prefix}
          </span>
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            value={display}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            onInvalid={() => setTouched(true)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            data-autofocus={autoFocus ? "" : undefined}
            className={`${CONTROL_CLASS} pl-11 text-lg font-bold`}
          />
          {name && <input type="hidden" name={name} value={parsed?.ok ? String(parsed.value) : value} />}
        </div>
      )}
    </FieldShell>
  );
}

interface AmountInputProps {
  /** The amount as a number; 0 shows as empty. */
  value: number;
  onChange: (value: number) => void;
  currency: SupportedCurrency;
  /** Accessible name; the input has no visible label of its own. */
  ariaLabel: string;
  prefix?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * A compact amount input for dense rows (split bill items, fees). It parses
 * with the same rules as `MoneyField`, in the given currency, keeps the text
 * while it doesn't parse, and reports only valid amounts through `onChange`.
 */
export function AmountInput({
  value,
  onChange,
  currency,
  ariaLabel,
  prefix,
  className = "",
  inputClassName = "",
}: AmountInputProps) {
  const errorId = useId();
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value ? (currency === "IDR" ? formatRupiahInput(value) : String(value)) : "");
  const parsed = text !== null && text.trim() ? parseMoneyTyping(text, currency, { allowZero: true }) : null;
  const error = parsed && !parsed.ok ? parsed.error : null;

  return (
    <div className={className}>
      <div className="relative">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-soft">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode={currency === "IDR" ? "numeric" : "decimal"}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={shown}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (!next.trim()) {
              onChange(0);
              return;
            }
            const result = parseMoneyTyping(next, currency, { allowZero: true });
            if (result.ok) onChange(result.value);
          }}
          onBlur={() => {
            // Once the text parses, show it in the standard format again.
            if (text === null || !text.trim() || parseMoneyTyping(text, currency, { allowZero: true }).ok) setText(null);
          }}
          placeholder="0"
          className={`${inputClassName} ${error ? "border-danger" : ""}`}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
