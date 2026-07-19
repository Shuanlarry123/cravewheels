import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  ShieldCheck,
  Bike,
  Utensils,
  Sparkles,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

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

function SettingsInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!user)
    return (
      <CustomerLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );

  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">General</h2>
        <div className="space-y-3 mb-6">
          <Row to="/about" icon={Info} title="About CraveReel" desc="What the platform does and how it works." />
          <Row to="/privacy" icon={ShieldCheck} title="Privacy & Security" desc="What data we collect and how we use GPS." />
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Join the platform
        </h2>
        <div className="space-y-3 mb-6">
          <Row to="/apply/driver" icon={Bike} title="Apply as Driver" desc="Deliver food and earn on your schedule." />
          <Row to="/apply/restaurant" icon={Utensils} title="Apply as Restaurant" desc="List your dishes and reach hungry customers." />
          <Row to="/apply/influencer" icon={Sparkles} title="Apply as Influencer" desc="Share dishes and earn commission per order." />
        </div>

        {user.role === "admin" && (
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Review applications & monitor performance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
          To switch between Browsing, Driver, Restaurant, or Influencer mode, log out and choose your role
          on the login screen.
        </p>
      </div>
    </CustomerLayout>
  );
}

export default function Settings() {
  return (
    <CartProvider>
      <SettingsInner />
    </CartProvider>
  );
}