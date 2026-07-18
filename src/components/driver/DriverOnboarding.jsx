import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bike, Car, Bike as Motorcycle } from "lucide-react";
import { toast } from "react-hot-toast";

const VEHICLES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "scooter", label: "Scooter" },
];

export default function DriverOnboarding({ userId, onCreated }) {
  const [vehicle, setVehicle] = useState("car");
  const [license, setLicense] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!license.trim()) {
      toast.error("Enter your license number");
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.DriverProfile.create({
        vehicle_type: vehicle,
        license_number: license.trim(),
        is_available: false,
        is_approved: false,
        total_earnings: 0,
        total_deliveries: 0,
        rating: 5,
      });
      toast.success("Driver profile created — pending approval");
      onCreated(created);
    } catch {
      toast.error("Failed to create driver profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Bike className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Become a Driver</h1>
          <p className="text-sm text-muted-foreground">Set up your delivery profile</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Vehicle Type</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {VEHICLES.map((v) => (
          <button
            key={v.value}
            onClick={() => setVehicle(v.value)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              vehicle === v.value ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <span className="block text-sm font-semibold">{v.label}</span>
          </button>
        ))}
      </div>

      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
        License Number
      </label>
      <input
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        placeholder="e.g. DL-1234567"
        className="w-full h-12 px-4 rounded-2xl bg-card border border-border text-sm mb-6 outline-none focus:border-primary"
      />

      <button
        onClick={submit}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create Driver Profile"}
      </button>
    </div>
  );
}