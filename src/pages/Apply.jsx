import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import DriverOnboarding from "@/components/driver/DriverOnboarding";
import RestaurantOnboarding from "@/components/restaurant/RestaurantOnboarding";
import CreatorOnboarding from "@/components/creator/CreatorOnboarding";

const META = {
  driver: { label: "Driver", entity: "DriverProfile", Comp: DriverOnboarding, approveField: "is_approved" },
  restaurant: { label: "Restaurant", entity: "Restaurant", Comp: RestaurantOnboarding, approveField: "is_approved" },
  influencer: { label: "Influencer", entity: "CreatorProfile", Comp: CreatorOnboarding, approveField: "status" },
};

function ApplyInner() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const m = META[type];
    if (!m) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const mine = await base44.entities[m.entity].filter({ created_by_id: u.id });
        setExisting(mine[0] || null);
      } catch {
        navigate("/login");
        return;
      } finally {
        setChecking(false);
      }
    })();
  }, [type]);

  const meta = META[type];

  if (!meta) {
    return (
      <CustomerLayout>
        <div className="p-8 text-center text-sm text-muted-foreground">Unknown application type.</div>
      </CustomerLayout>
    );
  }

  if (checking) {
    return (
      <CustomerLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );
  }

  const Onboarding = meta.Comp;

  if (existing) {
    const approved =
      meta.approveField === "status" ? existing.status === "active" : existing[meta.approveField];
    return (
      <CustomerLayout>
        <div className="px-4 pt-8 pb-24 min-h-screen">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-lg font-bold mb-1">Application submitted</h1>
            <p className="text-sm text-muted-foreground">
              {approved
                ? "Your application has been approved."
                : "Your application is pending review. We'll notify you once it's approved."}
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Settings
        </button>
      </div>
      <div className="pb-24">
        <Onboarding userId={user?.id} onCreated={() => navigate("/settings")} />
      </div>
    </CustomerLayout>
  );
}

export default function Apply() {
  return (
    <CartProvider>
      <ApplyInner />
    </CartProvider>
  );
}