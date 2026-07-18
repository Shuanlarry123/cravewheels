import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronRight } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

const STATUS_STYLES = {
  pending: "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  preparing: "bg-purple-500/15 text-purple-400",
  picked_up: "bg-cyan-500/15 text-cyan-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function OrdersInner() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await base44.entities.Order.filter({}, "-created_date", 50);
      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Order.subscribe((event) => {
      load();
    });
    return unsub;
  }, []);

  return (
    <CustomerLayout>
      <div className="px-4 pt-6 pb-24 min-h-screen">
        <h1 className="text-2xl font-bold mb-5">Orders</h1>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/order/${o.id}/tracking`}
                className="block bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{o.restaurant_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.items?.reduce((s, i) => s + i.quantity, 0)} items · ${o.total_amount?.toFixed(2)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[o.status] || ""}`}>
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(o.created_date).toLocaleString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default function Orders() {
  return (
    <CartProvider>
      <OrdersInner />
    </CartProvider>
  );
}