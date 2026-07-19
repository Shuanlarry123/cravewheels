import React from "react";
import { MousePointerClick, ShoppingBag, DollarSign, Clock, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CreatorStats({ profile }) {
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

  const cards = [
    { icon: MousePointerClick, label: "Clicks", value: profile.total_clicks || 0 },
    { icon: ShoppingBag, label: "Orders", value: profile.total_orders || 0 },
    { icon: DollarSign, label: "Earned", value: `$${(profile.total_earnings || 0).toFixed(2)}` },
    { icon: Clock, label: "Pending", value: `$${(profile.pending_earnings || 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-3">
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