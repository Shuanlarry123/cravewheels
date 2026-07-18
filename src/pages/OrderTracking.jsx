import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check } from "lucide-react";

const STEPS = ["pending", "confirmed", "preparing", "picked_up", "delivered"];
const LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  picked_up: "Picked Up",
  delivered: "Delivered",
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setOrder(await base44.entities.Order.get(id));
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.id === id) {
        base44.entities.Order.get(id).then(setOrder).catch(() => {});
      }
    });
    return unsub;
  }, [id]);

  if (loading)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found.</div>;

  const cancelled = order.status === "cancelled";
  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate("/orders")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Order Tracking</h1>
      </div>

      <div className="px-4">
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <p className="font-semibold">{order.restaurant_name}</p>
          <p className="text-xs text-muted-foreground mt-1">{order.delivery_address}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleString()}</p>
        </div>

        {/* Timeline */}
        {cancelled ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center text-red-400 font-medium">
            Order cancelled
          </div>
        ) : (
          <div className="relative pl-2">
            {STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div key={step} className="flex gap-4 pb-7 last:pb-0 relative">
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${done && idx < currentStep ? "bg-primary" : "bg-border"}`} />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                    } ${active ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <div className="pt-1">
                    <p className={`font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{LABELS[step]}</p>
                    {active && <p className="text-xs text-primary mt-0.5">In progress...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-2xl p-4 mt-5">
          <p className="text-sm font-semibold mb-3">Items</p>
          <div className="space-y-2">
            {order.items?.map((i) => (
              <div key={i.menu_item_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.quantity}× {i.name}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border my-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery Fee</span>
            <span>${order.delivery_fee?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-1">
            <span>Total</span>
            <span>${order.total_amount?.toFixed(2)}</span>
          </div>
        </div>

        {order.status === "delivered" && (
          <Link
            to={`/orders`}
            className="block mt-5 w-full h-11 rounded-xl bg-primary/15 text-primary font-medium text-center leading-[44px]"
          >
            Rate your order
          </Link>
        )}
      </div>
    </div>
  );
}