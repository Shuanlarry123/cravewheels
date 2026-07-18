import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import { toast } from "react-hot-toast";

function SettingsInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const goDriver = async () => {
    setSwitching(true);
    try {
      if (user.role !== "driver") {
        await base44.auth.updateMe({ role: "driver" });
      }
      navigate("/driver");
    } catch {
      toast.error("Failed to switch to driver mode");
    } finally {
      setSwitching(false);
    }
  };

  if (!user)
    return (
      <CustomerLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );

  const isDriver = user.role === "driver";

  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Driver Mode</p>
              <p className="text-xs text-muted-foreground">Switch to the driver dashboard to accept deliveries</p>
            </div>
            {isDriver && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold">Active</span>
            )}
          </div>
          <button
            onClick={goDriver}
            disabled={switching}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {switching ? "Switching..." : isDriver ? "Open Driver Dashboard" : "Switch to Driver Mode"}
            {!switching && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
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