"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/utils/i18n/context";
import { recordWalletIncome } from "./actions";
import { WalletBalance } from "@/utils/wallets/server";
import { getTodayString } from "@/utils/date";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField, SelectField, TextField } from "@/app/ui/Field";
import { parseRupiahInput } from "@/utils/money";

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletBalance[];
  defaultWalletId?: string;
}

const QUICK_INCOME_NOTES = ["Gaji", "Uang Saku", "Freelance", "Bonus", "Hadiah", "Kembalian"];

export default function IncomeModal({
  isOpen,
  onClose,
  wallets,
  defaultWalletId,
}: IncomeModalProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialWallet = defaultWalletId || wallets[0]?.id || "";

  const [walletId, setWalletId] = useState(initialWallet);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiahInput(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const numAmount = parsed.value;

    if (!walletId) {
      setError("Silakan pilih saku tujuan.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("wallet_id", walletId);
    formData.append("amount", String(numAmount));
    formData.append("note", note.trim() || "Pemasukan");
    formData.append("date", date);

    startTransition(async () => {
      try {
        await recordWalletIncome(formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      }
    });
  };

  return (
    <Dialog
      isOpen
      onClose={onClose}
      busy={isPending}
      title={t.saku.recordIncome}
      description={t.saku.incomeSubtitle}
      closeLabel={t.common.close}
      footer={
        <>
          <Button block onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button block variant="primary" type="submit" form="saku-income-form" disabled={isPending}>
            {isPending ? t.common.saving : t.saku.recordIncome}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form id="saku-income-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SelectField label={t.saku.toSaku} value={walletId} onChange={(e) => setWalletId(e.target.value)}>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.emoji} {w.name} ({w.kind === "spending" ? "Belanja" : "Tabungan"})
            </option>
          ))}
        </SelectField>

        <MoneyField label={t.saku.amount} value={amount} onChange={setAmount} placeholder="500.000" required />

        <div className="flex flex-col gap-2">
          <TextField
            label={t.saku.note}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Gaji bulanan, Uang jajan orang tua"
          />
          {/* Fill-in shortcuts, not toggles: each one writes its word into the note. */}
          <div role="group" aria-label={t.saku.quickNotesLabel} className="flex flex-wrap gap-1.5">
            {QUICK_INCOME_NOTES.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setNote(chip)}
                className="min-h-11 rounded-xl border border-field-line bg-card px-3 text-sm font-semibold text-ink hover:bg-paper"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <TextField
          label={t.saku.date}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="scheme-light dark:scheme-dark"
        />
      </form>
    </Dialog>
  );
}
