"use client";

import { useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

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
  /** Digits only, for example "15000". */
  value: string;
  onChange: (digits: string) => void;
  /** Form field name; the submitted value is the plain digits. */
  name?: string;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

/** Groups thousands while typing ("15.000") and reports plain digits. */
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
}: MoneyFieldProps) {
  const display = value ? Number(value).toLocaleString("id-ID") : "";

  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-ink-soft">
            {prefix}
          </span>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={display}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            data-autofocus={autoFocus ? "" : undefined}
            className={`${CONTROL_CLASS} pl-11 text-lg font-bold`}
          />
          {name && <input type="hidden" name={name} value={value} />}
        </div>
      )}
    </FieldShell>
  );
}
