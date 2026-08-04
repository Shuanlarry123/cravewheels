import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Receipt, User, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", icon: Home, label: "Feed" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/cart", icon: ShoppingBag, label: "Cart" },
  { to: "/orders", icon: Receipt, label: "Orders" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/account", icon: CircleUser, label: "Account" },
];

export default function CustomerLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen relative bg-background">{children}</div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-0.5">
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
        </div>
      </nav>
    </div>
  );
}