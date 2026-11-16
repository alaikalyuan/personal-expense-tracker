"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/utils/i18n/context";
import { createWallet, updateWallet } from "./actions";
import { WalletBalance } from "@/utils/wallets/server";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { CheckboxField, MoneyField, TextField } from "@/app/ui/Field";
import { ToggleChip } from "@/app/ui/Toggle";
import { parseRupiahInput, toRupiahFieldValue } from "@/utils/money";

interface SakuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: WalletBalance | null;
}

const EMOJI_PRESETS = ["👛", "🏦", "💵", "☕", "🚗", "✈️", "💻", "🎮", "🛡️", "🏠", "🎁", "🎯"];

const COLOR_PRESETS = [
  { hex: "#10b981", name: "emerald" },
  { hex: "#0d9488", name: "teal" },
  { hex: "#3b82f6", name: "blue" },
  { hex: "#6366f1", name: "indigo" },
  { hex: "#8b5cf6", name: "violet" },
  { hex: "#ec4899", name: "pink" },
  { hex: "#f59e0b", name: "amber" },
  { hex: "#f43f5e", name: "rose" },
  { hex: "#71717a", name: "zinc" },
] as const;

export default function SakuFormModal({
  isOpen,
  onClose,
  wallet,
}: SakuFormModalProps) {
  if (!isOpen) return null;

  return (
    <SakuFormModalContent
      key={wallet ? wallet.id : "new"}
      wallet={wallet}
      onClose={onClose}
    />
  );
}

function SakuFormModalContent({
  onClose,
  wallet,
}: {
  onClose: () => void;
  wallet?: WalletBalance | null;
}) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(wallet);

  const [name, setName] = useState(wallet?.name || "");
  const [kind, setKind] = useState<"spending" | "stash">(wallet?.kind || "spending");
  const [emoji, setEmoji] = useState(wallet?.emoji || (wallet?.kind === "stash" ? "🏦" : "👛"));
  const [color, setColor] = useState(wallet?.color || (wallet?.kind === "stash" ? "#0d9488" : "#10b981"));
  const [trackBalance, setTrackBalance] = useState(Boolean(wallet?.track_balance));
  const [openingBalance, setOpeningBalance] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState(wallet?.weekly_budget ? toRupiahFieldValue(wallet.weekly_budget) : "");
  const [monthlyBudget, setMonthlyBudget] = useState(wallet?.monthly_budget ? toRupiahFieldValue(wallet.monthly_budget) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.saku.name + " tidak boleh kosong.");
      return;
    }

    const opening = parseRupiahInput(openingBalance, { allowEmpty: true, allowZero: true });
    const weekly = parseRupiahInput(weeklyBudget, { allowEmpty: true, allowZero: true });
    const monthly = parseRupiahInput(monthlyBudget, { allowEmpty: true, allowZero: true });
    for (const result of [opening, weekly, monthly]) {
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }

    setError(null);
    const formData = new FormData();
    if (wallet) {
      formData.append("id", wallet.id);
    }
    formData.append("name", name.trim());
    formData.append("kind", kind);
    formData.append("emoji", emoji);
    formData.append("color", color);
    formData.append("track_balance", String(kind === "stash" ? true : trackBalance));

    if (!isEditing && openingBalance && (kind === "stash" || trackBalance)) {
      formData.append("opening_balance", openingBalance);
    }
    if (kind === "spending") {
      if (weeklyBudget) formData.append("weekly_budget", weeklyBudget);
      if (monthlyBudget) formData.append("monthly_budget", monthlyBudget);
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateWallet(formData);
        } else {
          await createWallet(formData);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      }
    });
  };

  const chooseKind = (next: "spending" | "stash") => {
    setKind(next);
    if (next === "spending") {
      if (emoji === "🏦") setEmoji("👛");
      if (color === "#0d9488") setColor("#10b981");
    } else {
      if (emoji === "👛") setEmoji("🏦");
      if (color === "#10b981") setColor("#0d9488");
    }
  };

  const kindOptions = [
    { value: "spending" as const, emoji: "👛", title: t.saku.kindSpendingTitle, desc: t.saku.kindSpendingDesc },
    { value: "stash" as const, emoji: "🏦", title: t.saku.kindStashTitle, desc: t.saku.kindStashDesc },
  ];

  return (
    <Dialog
      isOpen
      onClose={onClose}
      busy={isPending}
      title={isEditing ? t.saku.editSaku : t.saku.addSaku}
      description={isEditing ? t.saku.details : t.saku.subtitle}
      closeLabel={t.common.close}
      footer={
        <>
          <Button block onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button block variant="primary" type="submit" form="saku-form" disabled={isPending}>
            {isPending ? t.common.saving : isEditing ? t.common.save : t.saku.addSaku}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form id="saku-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Kind is chosen once, when the Saku is created. */}
        {!isEditing ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-ink">{t.saku.kindLabel}</legend>
            <div className="grid grid-cols-2 gap-2">
              {kindOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-2xl border p-3 transition-colors ${
                    kind === option.value ? "border-ink ring-1 ring-ink bg-paper" : "border-field-line hover:bg-paper"
                  }`}
                >
                  <input
                    type="radio"
                    name="saku-kind"
                    value={option.value}
                    checked={kind === option.value}
                    onChange={() => chooseKind(option.value)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      <span aria-hidden="true">{option.emoji}</span>
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{option.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink-soft">
            <span className="font-semibold text-ink">{t.saku.kindReadOnly}:</span>{" "}
            {kind === "spending" ? `👛 ${t.saku.kindSpendingTitle}` : `🏦 ${t.saku.kindStashTitle}`}
          </p>
        )}

        <div className="flex items-end gap-2">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-paper text-xl"
          >
            {emoji}
          </span>
          <div className="min-w-0 flex-1">
            <TextField
              label={t.saku.name}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "spending" ? "Contoh: Jajan & Kopi, Bensin" : "Contoh: Dana Darurat, Liburan"}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="saku-emoji-label" className="text-sm font-semibold text-ink">
            {t.saku.emojiPickerLabel}
          </span>
          <div role="group" aria-labelledby="saku-emoji-label" className="flex flex-wrap gap-1.5">
            {EMOJI_PRESETS.map((item) => (
              <ToggleChip
                key={item}
                variant="swatch"
                pressed={emoji === item}
                onClick={() => setEmoji(item)}
                aria-label={`${t.saku.emojiPickerLabel} ${item}`}
                className="bg-paper"
              >
                <span aria-hidden="true">{item}</span>
              </ToggleChip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="saku-color-label" className="text-sm font-semibold text-ink">
            {t.saku.colorPickerLabel}
          </span>
          <div role="group" aria-labelledby="saku-color-label" className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((preset) => (
              <ToggleChip
                key={preset.hex}
                variant="swatch"
                pressed={color === preset.hex}
                onClick={() => setColor(preset.hex)}
                aria-label={t.saku.colorNames[preset.name]}
              >
                <span aria-hidden="true" className="h-7 w-7 rounded-full" style={{ backgroundColor: preset.hex }} />
              </ToggleChip>
            ))}
          </div>
        </div>

        {/* Opening Balance (only on create). It is recorded only when the balance is
            tracked, so it is asked for only then; otherwise it would vanish. */}
        {!isEditing && (kind === "stash" || trackBalance) && (
          <MoneyField
            label={`${t.saku.openingBalance} (Opsional)`}
            value={openingBalance}
            onChange={setOpeningBalance}
            allowZero
          />
        )}

        {kind === "spending" && (
          <div className="flex flex-col gap-3 border-t border-line pt-3">
            <CheckboxField
              className="rounded-xl border border-line px-3 py-1"
              checked={trackBalance}
              onChange={(e) => setTrackBalance(e.target.checked)}
              label={t.saku.trackBalance}
              hint={t.saku.trackBalanceDesc}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MoneyField
                label={t.saku.weeklyBudget}
                value={weeklyBudget}
                onChange={setWeeklyBudget}
                placeholder="300.000"
                allowZero
              />
              <MoneyField
                label={t.saku.monthlyBudget}
                value={monthlyBudget}
                onChange={setMonthlyBudget}
                placeholder="1.200.000"
                allowZero
              />
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
