import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Receipt, LogOut, ChevronRight, Settings as SettingsIcon, Info } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

function ProfileInner() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

        <Link to="/orders" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-3 active:scale-[0.99] transition-transform">
          <Receipt className="w-5 h-5 text-primary" />
          <span className="flex-1 font-medium text-sm">Order History</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link to="/settings" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-3 active:scale-[0.99] transition-transform">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span className="flex-1 font-medium text-sm">Settings</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link to="/about" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-3 active:scale-[0.99] transition-transform">
          <Info className="w-5 h-5 text-primary" />
          <span className="flex-1 font-medium text-sm">About CraveReel</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

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