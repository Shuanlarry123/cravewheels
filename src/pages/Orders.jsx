import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronRight, Repeat } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import StaticMapImage from "@/components/StaticMapImage";
import { CartProvider, useCart } from "@/lib/cartContext";
import { toast } from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-yellow-500/15 text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  preparing: "bg-purple-500/15 text-purple-400",
  picked_up: "bg-cyan-500/15 text-cyan-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function OrdersInner() {
  const navigate = useNavigate();
  const { replaceCart } = useCart();
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
    const unsub = base44.entities.Order.subscribe(() => {
      load();
    });
    return unsub;
  }, []);

  const reorder = (o, e) => {
    e.preventDefault();
    e.stopPropagation();
    replaceCart(
      (o.items || []).map((i) => ({
        menu_item_id: i.menu_item_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        video_url: i.video_url,
      })),
      { id: o.restaurant_id, name: o.restaurant_name }
    );
    toast.success("Items added to cart");
    navigate("/cart");
  };

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
              <div key={o.id} className="bg-card border border-border rounded-2xl p-4">
                <Link to={`/order/${o.id}/tracking`} className="block active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{o.restaurant_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.items?.reduce((s, i) => s + i.quantity, 0)} items · ${o.total_amount?.toFixed(2)}
                      </p>
                      {o.order_type === "pickup" && (
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">Pickup</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[o.status] || ""}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                  {o.latitude != null && o.longitude != null && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border">
                      <StaticMapImage lon={o.longitude} lat={o.latitude} zoom={14} height={120} className="w-full h-[120px]" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(o.created_date).toLocaleString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
                <button
                  onClick={(e) => reorder(o, e)}
                  className="w-full mt-3 h-10 rounded-xl bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4" /> Reorder
                </button>
              </div>
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