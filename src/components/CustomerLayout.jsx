import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Receipt, User, Settings, Info, ShieldCheck, MoreHorizontal, X, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
  { to: "/orders", icon: Receipt, label: "Orders" },
  { to: "/profile", icon: User, label: "Profile" },
];

const MORE = [
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/about", icon: Info, label: "About CraveReel" },
  { to: "/privacy", icon: ShieldCheck, label: "Privacy & Security" },
];

export default function CustomerLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const moreActive =
    MORE.some((m) => location.pathname === m.to) ||
    (isAdmin && location.pathname === "/admin-dashboard") ||
    moreOpen;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen relative bg-background">{children}</div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-50">
        <div className="flex items-center justify-around h-16 px-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors",
              moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">More</span>
              <button onClick={() => setMoreOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 bg-primary/15 border border-primary/30 rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="flex-1 font-medium text-sm">Admin Dashboard</span>
                </Link>
              )}
              {MORE.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 bg-background border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 font-medium text-sm">{label}</span>
                </Link>
              ))}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  base44.auth.logout("/login");
                }}
                className="w-full mt-1 flex items-center gap-3 bg-background border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform text-muted-foreground"
              >
                <LogOut className="w-5 h-5" />
                <span className="flex-1 font-medium text-sm">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}