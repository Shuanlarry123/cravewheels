import React from "react";
import { Wallet, Package, Star, Power } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverStats({ profile, onToggleOnline, statsOnly }) {
  const approved = profile?.is_approved;
  return (
    <div>
      {!approved && (
        <div className="mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
          Your driver account is pending admin approval. You can browse deliveries but cannot accept until approved.
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat icon={Wallet} label="Earnings" value={`$${(profile?.total_earnings || 0).toFixed(2)}`} />
        <Stat icon={Package} label="Deliveries" value={profile?.total_deliveries || 0} />
        <Stat icon={Star} label="Rating" value={profile?.rating?.toFixed(1) || "5.0"} />
      </div>
      {!statsOnly && (
      <button
        onClick={onToggleOnline}
        disabled={!approved}
        className={cn(
          "w-full h-13 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors",
          profile?.is_available
            ? "bg-green-500/15 text-green-400 border border-green-500/40"
            : "bg-card border border-border text-muted-foreground",
          !approved && "opacity-50"
        )}
      >
        <Power className="w-4 h-4" />
        {profile?.is_available ? "Online — Accepting Deliveries" : "Go Online"}
      </button>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}