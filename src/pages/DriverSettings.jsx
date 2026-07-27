import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, Info, ShieldCheck, Bike, ArrowLeftRight } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";
import { toast } from "react-hot-toast";

const VEHICLES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "scooter", label: "Scooter" },
];

function Row({ to, icon: Icon, title, desc }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

export default function DriverSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState("car");
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const profs = await base44.entities.DriverProfile.filter({});
        const mine = profs.find((p) => p.created_by_id === u.id) || null;
        setProfile(mine);
        setVehicle(mine?.vehicle_type || "car");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const saveVehicle = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await base44.entities.DriverProfile.update(profile.id, { vehicle_type: vehicle });
      setProfile({ ...profile, vehicle_type: vehicle });
      toast.success("Vehicle updated");
    } catch {
      toast.error("Failed to update vehicle");
    } finally {
      setSaving(false);
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

  if (!user)
    return (
      <DriverLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Account */}
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Account</h2>
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold">{user.full_name || "Driver"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {profile?.license_number && (
            <p className="text-xs text-muted-foreground mt-1">License: {profile.license_number}</p>
          )}
          <p
            className={
              "text-[11px] font-semibold mt-2 inline-block px-2 py-1 rounded-full " +
              (profile?.is_approved
                ? "bg-green-500/15 text-green-400"
                : "bg-amber-500/15 text-amber-300")
            }
          >
            {profile?.is_approved ? "Approved driver" : "Pending approval"}
          </p>
        </div>

        {/* Vehicle */}
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Vehicle</h2>
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {VEHICLES.map((v) => (
              <button
                key={v.value}
                onClick={() => setVehicle(v.value)}
                className={
                  "p-3 rounded-xl border text-left text-sm font-medium transition-all " +
                  (vehicle === v.value ? "border-primary bg-primary/10" : "border-border bg-background")
                }
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={saveVehicle}
            disabled={saving || vehicle === profile?.vehicle_type}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Vehicle"}
          </button>
        </div>

        {/* General */}
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1 mt-4">General</h2>
        <div className="space-y-3 mb-6">
          <Row to="/about" icon={Info} title="About CraveReel" desc="What the platform does and how it works." />
          <Row to="/privacy" icon={ShieldCheck} title="Privacy & Security" desc="How we use your location and data." />
        </div>

        <button
          onClick={goCustomer}
          disabled={switching}
          className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeftRight className="w-4 h-4" /> {switching ? "Switching..." : "Switch to Customer Mode"}
        </button>
      </div>
    </DriverLayout>
  );
}