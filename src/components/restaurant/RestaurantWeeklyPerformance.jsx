import React, { useMemo } from "react";
import moment from "moment";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Utensils } from "lucide-react";

const PRIMARY = "#FF6B2C";

export default function RestaurantWeeklyPerformance({ orders }) {
  const { sales, volume, avg, daily, topItems } = useMemo(() => {
    const start = moment().subtract(6, "days").startOf("day");
    const week = orders.filter(
      (o) => moment(o.created_date).isSameOrAfter(start) && o.status !== "cancelled"
    );
    const sales = week.reduce((s, o) => s + (o.total_amount || 0), 0);
    const volume = week.length;
    const avg = volume ? sales / volume : 0;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = moment().subtract(i, "days");
      const label = d.format("ddd");
      const total = orders
        .filter(
          (o) =>
            moment(o.created_date).isSame(d, "day") && o.status !== "cancelled"
        )
        .reduce((s, o) => s + (o.total_amount || 0), 0);
      days.push({ day: label, sales: Math.round(total) });
    }

    const map = {};
    week.forEach((o) =>
      (o.items || []).forEach((it) => {
        const key = it.menu_item_id || it.name || "Unknown";
        if (!map[key]) map[key] = { name: it.name || "Unknown", qty: 0, revenue: 0 };
        const qty = it.quantity || 1;
        map[key].qty += qty;
        map[key].revenue += qty * (it.price || 0);
      })
    );
    const topItems = Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { sales, volume, avg, daily: days, topItems };
  }, [orders]);

  const rangeLabel = `${moment().subtract(6, "days").format("MMM D")} – ${moment().format(
    "MMM D"
  )}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">This Week</h2>
        <span className="text-[11px] text-muted-foreground">{rangeLabel}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Metric icon={DollarSign} label="Total sales" value={`$${sales.toFixed(2)}`} />
        <Metric icon={ShoppingBag} label="Orders" value={volume} />
        <Metric icon={TrendingUp} label="Avg order" value={`$${avg.toFixed(2)}`} />
      </div>

      <div className="h-32 -ml-2 mb-4">
        {daily.some((d) => d.sales > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} barCategoryWidth="60%">
              <XAxis
                dataKey="day"
                tick={{ fill: "#999", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,107,44,0.08)" }}
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => [`$${v}`, "Sales"]}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {daily.map((d, i) => (
                  <Cell key={i} fill={i === daily.length - 1 ? PRIMARY : "rgba(255,107,44,0.45)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No sales yet this week
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Utensils className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Popular items
          </h3>
        </div>
        {topItems.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No orders this week yet.</p>
        ) : (
          <div className="space-y-2">
            {topItems.map((it, i) => {
              const max = topItems[0].qty || 1;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-[11px] text-muted-foreground font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate pr-2">{it.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {it.qty} sold · ${it.revenue.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(it.qty / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-background/60 rounded-xl p-2.5 flex flex-col gap-1">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-base font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}