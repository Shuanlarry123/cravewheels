import React from "react";
import { Store, Check, Radio } from "lucide-react";

export default function AdminRestaurants({ restaurants, orders, onApprove, busy }) {
  const byId = {};
  orders.forEach((o) => {
    byId[o.restaurant_id] = byId[o.restaurant_id] || { count: 0, rev: 0 };
    byId[o.restaurant_id].count++;
    byId[o.restaurant_id].rev += o.total_amount || 0;
  });

  return (
    <div className="space-y-2">
      {restaurants.map((r) => {
        const s = byId[r.id] || { count: 0, rev: 0 };
        return (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{r.name}</p>
                {r.is_live && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold flex items-center gap-0.5">
                    <Radio className="w-2.5 h-2.5" /> LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {r.cuisine_type || "—"} · ★ {r.rating?.toFixed?.(1) || "—"} · {s.count} orders
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">${s.rev.toFixed(0)}</p>
              {r.is_approved ? (
                <span className="text-[11px] text-green-400 font-semibold">Approved</span>
              ) : (
                <button
                  onClick={() => onApprove(r.id)}
                  disabled={busy}
                  className="text-[11px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}