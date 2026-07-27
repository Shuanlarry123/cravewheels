import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, Package, Star, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DriverStatsOverview({ profile, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Order.filter({}, "-created_date", 500);
        setOrders(all.filter((o) => o.driver_id === user?.id && o.status === "delivered"));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const { series, totals } = useMemo(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d,
        label: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
        earnings: 0,
        deliveries: 0,
      });
    }
    orders.forEach((o) => {
      const d = new Date(o.created_date);
      d.setHours(0, 0, 0, 0);
      const idx = buckets.findIndex((b) => b.date.getTime() === d.getTime());
      if (idx >= 0) {
        buckets[idx].earnings += o.delivery_fee || 2.99;
        buckets[idx].deliveries += 1;
      }
    });
    const totalEarnings = orders.reduce((s, o) => s + (o.delivery_fee || 2.99), 0);
    return {
      series: buckets,
      totals: { earnings: totalEarnings, deliveries: orders.length, rating: profile?.rating || 5 },
    };
  }, [orders, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weekEarnings = series.slice(-7).reduce((s, b) => s + b.earnings, 0);
  const weekDeliveries = series.slice(-7).reduce((s, b) => s + b.deliveries, 0);

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Summary icon={Wallet} label="Total earnings" value={`$${totals.earnings.toFixed(2)}`} sub={`$${weekEarnings.toFixed(2)} / 7d`} />
        <Summary icon={Package} label="Deliveries" value={totals.deliveries} sub={`${weekDeliveries} / 7d`} />
        <Summary icon={Star} label="Avg rating" value={totals.rating.toFixed(1)} sub="★" />
      </div>

      {/* Earnings over time */}
      <div className="bg-card border border-border rounded-2xl p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Earnings · last 14 days</p>
        <div className="h-36 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Earnings"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#earnFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deliveries over time */}
      <div className="bg-card border border-border rounded-2xl p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Deliveries · last 14 days</p>
        <div className="h-36 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [v, "Deliveries"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Bar dataKey="deliveries" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {totals.deliveries === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          No completed deliveries yet — your stats will appear here once you finish deliveries.
        </p>
      )}
    </div>
  );
}

function Summary({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-primary font-medium">{sub}</span>}
    </div>
  );
}