import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Stretch to fill the row (dialog footers). */
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  // The single accent action on a screen.
  primary: "bg-accent text-on-accent hover:brightness-95 active:brightness-90",
  secondary: "border border-line bg-card text-ink hover:bg-paper active:bg-line",
  danger: "border border-danger text-danger hover:bg-danger-soft active:bg-danger-soft",
  ghost: "text-ink-soft hover:bg-paper hover:text-ink active:bg-line",
};

/** 44px minimum height, visible hover, active and disabled states. */
export default function Button({
  variant = "secondary",
  block = false,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
        block ? "flex-1" : ""
      } ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
