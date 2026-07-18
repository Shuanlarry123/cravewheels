import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ArrowLeftRight, Settings as SettingsIcon, Bike } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";
import DriverStats from "@/components/driver/DriverStats";
import { toast } from "react-hot-toast";

export default function DriverProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const goCustomer = async () => {
    setSwitching(true);
    try {
      await base44.auth.updateMe({ role: "customer" });
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setSwitching(false);
    }
  };

  if (!user) {
    return (
      <DriverLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
            <Bike className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{user.full_name || "Driver"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {profile && <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile.vehicle_type}</p>}
        </div>

        {profile && <DriverStats profile={profile} onToggleOnline={toggleOnline} />}

        <Link
          to="/settings"
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-3 mt-4 active:scale-[0.99] transition-transform"
        >
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span className="flex-1 font-medium text-sm">Settings</span>
        </Link>

        <button
          onClick={goCustomer}
          disabled={switching}
          className="w-full h-11 rounded-xl bg-card border border-border text-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeftRight className="w-4 h-4" /> {switching ? "Switching..." : "Switch to Customer Mode"}
        </button>
      </div>
    </DriverLayout>
  );
}