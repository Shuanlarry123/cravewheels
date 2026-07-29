import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Loader2 } from "lucide-react";

/**
 * Customers who signed up / ordered using the creator's referral code.
 * Derived from orders carrying the creator's referral_code, grouped by
 * customer so repeat buyers roll up into one row.
 */
export default function ReferredCustomers({ referralCode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const orders = await base44.entities.Order.filter(
          { referral_code: referralCode },
          "-created_date",
          500
        );
        const map = {};
        orders.forEach((o) => {
          const key = o.created_by_id || o.id;
          if (!map[key]) {
            map[key] = { id: key, label: `Customer • ${String(key).slice(-4)}`, orders: 0, spent: 0, commission: 0 };
          }
          map[key].orders += 1;
          map[key].spent += Number(o.total_amount || 0);
          map[key].commission += Number(o.commission_amount || 0);
        });
        setCustomers(Object.values(map).sort((a, b) => b.orders - a.orders));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [referralCode]);

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1 flex items-center gap-1.5">
        <Users className="w-4 h-4" /> Referred Customers ({customers.length})
      </h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1 py-6 text-center">
          No customers have used your code yet.
        </p>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {c.label[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.orders} order{c.orders !== 1 ? "s" : ""} · ${c.spent.toFixed(2)} spent
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">${c.commission.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">commission</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}