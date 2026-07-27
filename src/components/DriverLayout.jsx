import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation, Wallet, History, User, Settings as SettingsIcon, Info, ShieldCheck, MoreHorizontal, X, LogOut, ArrowLeftRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/driver", icon: Navigation, label: "On Road" },
  { to: "/driver/earnings", icon: Wallet, label: "Earnings" },
  { to: "/driver/history", icon: History, label: "History" },
  { to: "/driver/profile", icon: User, label: "Profile" },
];

const MORE = [
  { to: "/driver/settings", icon: SettingsIcon, label: "Settings" },
  { to: "/about", icon: Info, label: "About CraveReel" },
  { to: "/privacy", icon: ShieldCheck, label: "Privacy & Security" },
];

export default function DriverLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const moreActive = MORE.some((m) => location.pathname === m.to) || moreOpen;

  const goCustomer = async () => {
    setSwitching(true);
    setMoreOpen(false);
    try {
      await base44.auth.updateMe({ role: "customer" });
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen relative">{children}</div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-50">
        <div className="flex items-center justify-around h-16 px-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
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
                onClick={goCustomer}
                disabled={switching}
                className="w-full flex items-center gap-3 bg-background border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
              >
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                <span className="flex-1 font-medium text-sm">{switching ? "Switching..." : "Switch to Customer Mode"}</span>
              </button>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  base44.auth.logout("/login");
                }}
                className="w-full flex items-center gap-3 bg-background border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform text-muted-foreground"
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