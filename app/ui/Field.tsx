"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { formatRupiahInput, parseRupiahInput } from "@/utils/money";

export const CONTROL_CLASS =
  "min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink placeholder:text-ink-soft/70 hover:border-ink-soft disabled:opacity-50";

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
        <select id={id} aria-describedby={describedBy} className={`${CONTROL_CLASS} ${className}`} {...rest}>
          {children}
        </select>
      )}
    </FieldShell>
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
  const display = parsed?.ok ? formatRupiahInput(parsed.value) : value;
  // An amount above `max` is shown straight away; a typing error once the field is left.
  const overMax = parsed && !parsed.ok && max !== undefined && parseRupiahInput(value, { allowZero }).ok;
  const shownError = error || (touched || overMax ? parseError : null);

  useEffect(() => {
    inputRef.current?.setCustomValidity(parseError ?? "");
  }, [parseError]);

  const handleChange = (text: string) => {
    const result = parseRupiahInput(text, { allowZero: true });
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
            onChange={(e) => handleChange(e.target.value)}
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
