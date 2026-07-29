import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Wallet, Package, Star, TrendingUp, DollarSign } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";
import StripeVirtualCard from "@/components/stripe/StripeVirtualCard";

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export default function DriverEarnings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const profs = await base44.entities.DriverProfile.filter({});
        setProfile(profs.find((p) => p.created_by_id === u.id) || null);
        const all = await base44.entities.Order.filter({});
        setOrders(
          all
            .filter((o) => o.driver_id === u.id && o.status === "delivered")
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        );
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <DriverLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );

  const weekStart = startOfWeek();
  const thisWeek = orders
    .filter((o) => new Date(o.created_date) >= weekStart)
    .reduce((s, o) => s + (o.delivery_fee || 2.99), 0);
  const total = profile?.total_earnings || 0;
  const deliveries = profile?.total_deliveries || orders.length;
  const avg = deliveries ? total / deliveries : 0;

  const reload = async () => {
    try {
      const u = await base44.auth.me();
      const profs = await base44.entities.DriverProfile.filter({});
      setProfile(profs.find((p) => p.created_by_id === u.id) || null);
    } catch {
      /* ignore */
    }
  };

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Earnings</h1>
        <p className="text-sm text-muted-foreground mb-6">Track what you earn on the road.</p>

        {/* Virtual card */}
        <StripeVirtualCard role="driver" record={profile} balance={total} balanceLabel="Earnings balance" onIssued={reload} />

        {/* Hero balance */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-orange-500 p-5 text-white mb-6">
          <p className="text-xs uppercase tracking-wide opacity-80">Total earnings</p>
          <p className="text-4xl font-bold mt-1">${total.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-3 text-sm bg-white/15 rounded-full px-3 py-1 w-fit">
            <TrendingUp className="w-3.5 h-3.5" /> {thisWeek.toFixed(2)} this week
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">{deliveries}</span>
            <span className="text-[10px] text-muted-foreground">Deliveries</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">${avg.toFixed(2)}</span>
            <span className="text-[10px] text-muted-foreground">Avg / trip</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">{profile?.rating?.toFixed(1) || "5.0"}</span>
            <span className="text-[10px] text-muted-foreground">Rating</span>
          </div>
        </div>

        {/* Recent earnings */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
          Recent payouts
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No completed deliveries yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 30).map((o) => (
              <div key={o.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{o.restaurant_name || "Restaurant"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">+${(o.delivery_fee || 2.99).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}