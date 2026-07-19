import React from "react";
import { Sparkles, Check, Ban } from "lucide-react";

const STATUS = {
  pending: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  suspended: "bg-red-500/15 text-red-400",
};

function Stat({ label, value }) {
  return (
    <div className="bg-muted/40 rounded-lg py-1.5">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AdminInfluencers({ creators, onApprove, onSuspend, busy }) {
  return (
    <div className="space-y-2">
      {creators.map((c) => (
        <div key={c.id} className="bg-card border border-border rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{c.social_handle || c.referral_code}</p>
              <p className="text-xs text-muted-foreground truncate">
                Code: {c.referral_code} · {c.follower_count || 0} followers
              </p>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS[c.status] || ""}`}>
              {c.status}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <Stat label="Clicks" value={c.total_clicks || 0} />
            <Stat label="Orders" value={c.total_orders || 0} />
            <Stat label="Earned" value={`$${(c.total_earnings || 0).toFixed(0)}`} />
            <Stat label="Pending" value={`$${(c.pending_earnings || 0).toFixed(0)}`} />
          </div>
          <div className="flex gap-2 mt-3">
            {c.status !== "active" && (
              <button
                onClick={() => onApprove(c.id)}
                disabled={busy}
                className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
            )}
            {c.status !== "suspended" && (
              <button
                onClick={() => onSuspend(c.id)}
                disabled={busy}
                className="flex-1 h-9 rounded-xl bg-card border border-border text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}