import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Wallet, History, Settings as SettingsIcon, Bike, Star } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";
import DriverStats from "@/components/driver/DriverStats";
import { toast } from "react-hot-toast";

function LinkRow({ to, icon: Icon, title, desc }) {
  return (
    <a
      href={to}
      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </a>
  );
}

export default function DriverProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const profs = await base44.entities.DriverProfile.filter({});
        setProfile(profs.find((p) => p.created_by_id === u.id) || null);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const toggleOnline = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.DriverProfile.update(profile.id, {
        is_available: !profile.is_available,
      });
      setProfile({ ...profile, ...updated });
      toast.success(updated.is_available ? "You are now online" : "You are now offline");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  if (!user)
    return (
      <DriverLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );

  const rating = profile?.rating ?? 5;

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
            <Bike className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{user.full_name || "Driver"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {profile && (
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile.vehicle_type} driver</p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={"w-5 h-5 " + (i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")}
            />
          ))}
          <span className="text-sm font-semibold ml-1">{rating.toFixed(1)}</span>
        </div>

        {/* Online toggle + stats */}
        {profile && <DriverStats profile={profile} onToggleOnline={toggleOnline} busy={busy} />}

        {/* Quick links */}
        <div className="space-y-3 mt-6">
          <LinkRow to="/driver/earnings" icon={Wallet} title="Earnings" desc="Total, weekly, and per-trip breakdown." />
          <LinkRow to="/driver/history" icon={History} title="Delivery History" desc="All your past and current trips." />
          <LinkRow to="/driver/settings" icon={SettingsIcon} title="Settings" desc="Vehicle, account, and preferences." />
        </div>
      </div>
    </DriverLayout>
  );
}