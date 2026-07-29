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

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold">Withdraw to your debit card</p>
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
      <div className="text-xs space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Amount to card</span>
          <span>${amt.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Fee (2%)</span>
          <span>${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total deducted</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Available</span>
          <span>${(balance || 0).toFixed(2)}</span>
        </div>
      </div>
      <button
        onClick={submit}
        disabled={busy}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
        Confirm withdrawal
      </button>
      <button onClick={() => setOpen(false)} className="w-full text-xs text-muted-foreground py-1">
        Cancel
      </button>
    </div>
  );
}