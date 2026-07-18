import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Receipt, LogOut, ChevronRight, Store, Bike, Video, Shield } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import { toast } from "react-hot-toast";

const ROLES = [
  { value: "customer", label: "Customer", icon: Video },
  { value: "restaurant", label: "Restaurant", icon: Store },
  { value: "driver", label: "Driver", icon: Bike },
  { value: "creator", label: "Creator", icon: Receipt },
  { value: "admin", label: "Admin", icon: Shield },
];

const DASHBOARDS = {
  restaurant: "/restaurant",
  driver: "/driver",
  creator: "/creator",
  admin: "/admin",
};

function ProfileInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const switchRole = async (role) => {
    setSwitching(true);
    try {
      await base44.auth.updateMe({ role });
      setUser((u) => ({ ...u, role }));
      toast.success(`Switched to ${role}`);
      if (role !== "customer" && DASHBOARDS[role]) {
        navigate(DASHBOARDS[role]);
      }
    } catch {
      toast.error("Failed to switch role");
    } finally {
      setSwitching(false);
    }
  };

  const logout = () => base44.auth.logout("/login");

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
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-3">
            {(user.full_name || user.email || "U")[0].toUpperCase()}
          </div>
          <h1 className="text-xl font-bold">{user.full_name || "Member"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <Link to="/orders" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-4 active:scale-[0.99] transition-transform">
          <Receipt className="w-5 h-5 text-primary" />
          <span className="flex-1 font-medium text-sm">Order History</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        {/* Role switcher */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Switch Role</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => {
              const active = user.role === value;
              return (
                <button
                  key={value}
                  onClick={() => switchRole(value)}
                  disabled={switching}
                  className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">{label}</span>
                </button>
              );
            })}
          </div>
          {user.role && user.role !== "customer" && (
            <button
              onClick={() => navigate(DASHBOARDS[user.role] || "/")}
              className="w-full mt-3 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Open {user.role} Dashboard
            </button>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full mt-6 h-11 rounded-xl bg-card border border-border text-muted-foreground font-medium text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </CustomerLayout>
  );
}

export default function Profile() {
  return (
    <CartProvider>
      <ProfileInner />
    </CartProvider>
  );
}