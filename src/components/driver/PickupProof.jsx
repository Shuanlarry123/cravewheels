import React, { useState } from "react";
import { X, ShieldCheck, Loader2 } from "lucide-react";

/**
 * Proof-of-pickup modal: the driver enters the pickup code from the
 * restaurant receipt to confirm they collected the correct order.
 */
export default function PickupProof({ order, onClose, onConfirm, busy }) {
  const [code, setCode] = useState("");

  return (
    <div className="absolute inset-0 z-[70] flex items-end bg-black/60" onClick={onClose}>
      <div className="w-full bg-card border-t border-border rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" /> Confirm Pickup
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Enter the pickup code from the restaurant's order receipt to confirm you've collected the right order.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="••••"
          className="w-full h-12 rounded-xl bg-background border border-border px-4 text-center text-lg font-bold tracking-[0.5em]"
        />
        {order.pickup_code && (
          <p className="text-[11px] text-muted-foreground mt-2">Receipt code: {order.pickup_code}</p>
        )}
        <button
          onClick={() => onConfirm(order, code)}
          disabled={busy || code.length !== 4}
          className="w-full h-12 mt-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Confirm Pickup
        </button>
      </div>
    </div>
  );
}