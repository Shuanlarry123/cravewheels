import React from "react";
import { CreditCard, Check, X, Phone, MapPin } from "lucide-react";

export default function AdminCardRequests({ drivers, users, onApprove, onReject, busy }) {
  const userById = Object.fromEntries((users || []).map((u) => [u.id, u]));
  const requested = (drivers || []).filter((d) => d.card_request_status === "requested");

  if (!requested.length) {
    return <p className="text-sm text-muted-foreground">No card requests pending approval.</p>;
  }

  return (
    <div className="space-y-2">
      {requested.map((d) => {
        const u = userById[d.created_by_id];
        return (
          <div key={d.id} className="bg-card border border-border rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {d.card_request_name || d.legal_full_name || u?.full_name || "Driver"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u?.email || "—"}</p>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {d.card_request_phone || "—"}
              </p>
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 mt-0.5" />
                {d.card_request_line1}, {d.card_request_city}, {d.card_request_state} {d.card_request_postal_code}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onApprove(d.id)}
                disabled={busy}
                className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve & issue
              </button>
              <button
                onClick={() => onReject(d.id)}
                disabled={busy}
                className="h-9 px-3 rounded-xl bg-red-500/15 text-red-400 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}