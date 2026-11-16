"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/utils/i18n/context";
import { transferBetweenWallets } from "./actions";
import { WalletBalance } from "@/utils/wallets/server";
import { getTodayString } from "@/utils/date";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { MoneyField, SelectField, TextField } from "@/app/ui/Field";
import { parseRupiahInput } from "@/utils/money";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletBalance[];
  defaultFromId?: string;
}

export default function TransferModal({
  isOpen,
  onClose,
  wallets,
  defaultFromId,
}: TransferModalProps) {
  const { t, formatCurrency } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialFrom = defaultFromId || wallets[0]?.id || "";
  const initialTo = wallets.find((w) => w.id !== initialFrom)?.id || "";

  const [fromWalletId, setFromWalletId] = useState(initialFrom);
  const [toWalletId, setToWalletId] = useState(initialTo);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayString());

  if (!isOpen) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  // Matches the server: a stash or a saku that tracks its balance can't go below 0.
  const sourceLimited = Boolean(fromWallet && (fromWallet.kind === "stash" || fromWallet.track_balance));
  const sourceAvailable = sourceLimited && fromWallet ? Math.max(0, fromWallet.current_balance) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRupiahInput(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const numAmount = parsed.value;

    if (fromWalletId === toWalletId) {
      setError("Saku asal dan saku tujuan tidak boleh sama.");
      return;
    }

    if (sourceLimited && fromWallet && numAmount > fromWallet.current_balance) {
      setError(`Saldo saku ${fromWallet.name} tidak mencukupi (${formatCurrency(fromWallet.current_balance)}).`);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("from_wallet_id", fromWalletId);
    formData.append("to_wallet_id", toWalletId);
    formData.append("amount", String(numAmount));
    formData.append("note", note.trim() || `Transfer dari ${fromWallet?.name || "Saku"} ke ${toWallet?.name || "Saku"}`);
    formData.append("date", date);

    startTransition(async () => {
      try {
        await transferBetweenWallets(formData);
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
      title={t.saku.transfer}
      description={t.saku.transferSubtitle}
      closeLabel={t.common.close}
      footer={
        <>
          <Button block onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button block variant="primary" type="submit" form="saku-transfer-form" disabled={isPending}>
            {isPending ? t.common.saving : t.saku.transfer}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form id="saku-transfer-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          <SelectField label={t.saku.fromSaku} value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id} disabled={w.id === toWalletId}>
                {w.emoji} {w.name} {w.track_balance ? `(${formatCurrency(w.current_balance)})` : ""}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.saku.toSaku} value={toWalletId} onChange={(e) => setToWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                {w.emoji} {w.name}
              </option>
            ))}
          </SelectField>
        </div>

        <MoneyField
          label={t.saku.amount}
          hint={sourceAvailable !== undefined ? `Saldo tersedia: ${formatCurrency(sourceAvailable)}` : undefined}
          value={amount}
          onChange={setAmount}
          placeholder="150.000"
          max={sourceAvailable}
          maxError={
            sourceAvailable !== undefined && fromWallet
              ? `Saldo saku ${fromWallet.name} tidak mencukupi (${formatCurrency(sourceAvailable)}).`
              : undefined
          }
          required
        />

        <TextField
          label={t.saku.note}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: Pindah jajan ke tabungan darurat"
        />

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
