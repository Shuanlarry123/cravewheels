import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const FEE_RATE = 0.02;

export default function CardWithdraw({ record, balance, onDone }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const amt = parseFloat(amount) || 0;
  const fee = +(amt * FEE_RATE).toFixed(2);
  const total = +(amt + fee).toFixed(2);
  const valid = amt > 0 && total <= (balance || 0);

  const submit = async () => {
    if (amt <= 0) {
      toast.error("Enter an amount to withdraw");
      return;
    }
    if (total > (balance || 0)) {
      toast.error("Insufficient balance for this withdrawal");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.DriverProfile.update(record.id, {
        total_earnings: +((balance || 0) - total).toFixed(2),
      });
      toast.success(`$${amt.toFixed(2)} sent to your card · fee $${fee.toFixed(2)}`);
      setAmount("");
      setOpen(false);
      onDone?.();
    } catch {
      toast.error("Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-10 rounded-xl bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center gap-2"
      >
        <ArrowDownToLine className="w-4 h-4" /> Withdraw to card
      </button>
    );
  }

  const maxReceivable = Math.floor(((balance || 0) / 1.02) * 100) / 100;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Withdraw to your debit card</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
          2% fee
        </span>
      </div>
      <div className="flex items-center rounded-xl bg-background border border-border px-3">
        <span className="text-muted-foreground">$</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 h-10 bg-transparent outline-none text-sm"
        />
      </div>

      {amt > 0 && (
        <div className="rounded-xl bg-background border border-border p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>You receive on card</span>
            <span className="font-medium text-foreground">${amt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Withdrawal fee (2%)</span>
            <span className="font-semibold">−${fee.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
            <span>Total deducted</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {amt > 0 && total > (balance || 0) && (
        <p className="text-xs text-red-400">
          Insufficient balance. The most you can receive is ${maxReceivable.toFixed(2)}.
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy || !valid}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowDownToLine className="w-4 h-4" />
        )}
        {amt > 0 && valid
          ? `Withdraw $${amt.toFixed(2)} · fee $${fee.toFixed(2)}`
          : "Enter an amount"}
      </button>
      <button onClick={() => setOpen(false)} className="w-full text-xs text-muted-foreground py-1">
        Cancel
      </button>
    </div>
  );
}