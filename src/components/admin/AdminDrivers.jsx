import React from "react";
import { Bike, Check } from "lucide-react";

export default function AdminDrivers({ drivers, onApprove, busy }) {
  return (
    <div className="space-y-2">
      {drivers.map((d) => (
        <div key={d.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold capitalize">{d.vehicle_type} driver</p>
            <p className="text-xs text-muted-foreground truncate">
              License {d.license_number || "—"} · ★ {d.rating?.toFixed?.(1) || "5.0"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {d.total_deliveries || 0} deliveries · ${(d.total_earnings || 0).toFixed(0)} earned
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-[11px] font-semibold ${d.is_available ? "text-green-400" : "text-muted-foreground"}`}>
              {d.is_available ? "Online" : "Offline"}
            </span>
            {!d.is_approved ? (
              <button
                onClick={() => onApprove(d.id)}
                disabled={busy}
                className="mt-1 text-[11px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1 disabled:opacity-50 ml-auto"
              >
                <Check className="w-3 h-3" /> Approve
              </button>
            ) : (
              <p className="text-[11px] text-green-400 font-semibold mt-1">Approved</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}