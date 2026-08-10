import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navigation, Wallet, History, User, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/driver", icon: Navigation, label: "On Road" },
  { to: "/driver/earnings", icon: Wallet, label: "Earnings" },
  { to: "/driver/history", icon: History, label: "History" },
  { to: "/driver/profile", icon: User, label: "Profile" },
  { to: "/driver/settings", icon: CircleUser, label: "Account" },
];

export default function DriverLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen relative">{children}</div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-0.5">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== "/driver" && location.pathname.startsWith(to));
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
        </div>
      </nav>
    </div>
  );
}