import React, { useState } from "react";
import { MousePointerClick, ShoppingBag, Clock, Copy, Check, TrendingUp } from "lucide-react";

export default function CreatorStats({ profile, totals }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(profile.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusStyle =
    profile.status === "active"
      ? "bg-green-500/15 text-green-400"
      : profile.status === "suspended"
      ? "bg-destructive/15 text-destructive"
      : "bg-yellow-500/15 text-yellow-400";

  const earned = totals?.earned ?? profile.total_earnings ?? 0;
  const clicks = totals?.clicks ?? profile.total_clicks ?? 0;
  const orders = totals?.orders ?? profile.total_orders ?? 0;
  const pending = profile.pending_earnings ?? 0;
  const conversion = clicks > 0 ? ((orders / clicks) * 100).toFixed(1) : "0.0";

  const cards = [
    { icon: MousePointerClick, label: "Total Clicks", value: clicks },
    { icon: ShoppingBag, label: "Orders", value: orders },
    { icon: Clock, label: "Pending Payout", value: `$${pending.toFixed(2)}` },
    { icon: TrendingUp, label: "Conversion", value: `${conversion}%` },
  ];

  return (
    <div className="space-y-3">
      {/* Hero earnings — exactly how much made from referral links */}
      <div className="rounded-2xl p-4 border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
        <p className="text-xs text-muted-foreground">Total earned from your links</p>
        <p className="text-4xl font-bold text-primary mt-1 leading-none">${earned.toFixed(2)}</p>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> {orders} orders</span>
          <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> {clicks} clicks</span>
        </div>
      </div>

      {/* Referral code */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Your referral code</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusStyle}`}>
            {profile.status || "pending"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wider text-primary">{profile.referral_code}</span>
          <button
            onClick={copyCode}
            className="ml-auto h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Commission rate: {Math.round((profile.commission_rate || 0.1) * 100)}%
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-1">
            <c.icon className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold leading-none">{c.value}</span>
            <span className="text-[10px] text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}