import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Minus, Plus, Trash2, MapPin } from "lucide-react";
import { CartProvider, useCart, useReferral } from "@/lib/cartContext";
import CustomerLayout from "@/components/CustomerLayout";
import { toast } from "react-hot-toast";

function CartInner() {
  const navigate = useNavigate();
  const { items, updateQty, clearCart, subtotal, deliveryFee, restaurantId, restaurantName } = useCart();
  const { code: refCode, clear: clearRef } = useReferral();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    setPlacing(true);
    try {
      let commission_amount = 0;
      let creator_id = null;
      if (refCode) {
        try {
          const creators = await base44.entities.CreatorProfile.filter({ referral_code: refCode }, "-created_date", 1);
          if (creators[0]) {
            creator_id = creators[0].id;
            const rate = creators[0].commission_rate ?? 0.1;
            commission_amount = Math.round(subtotal * rate * 100) / 100;
          }
        } catch {}
      }
      const order = await base44.entities.Order.create({
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          video_url: i.video_url,
        })),
        total_amount: total,
        delivery_address: address,
        delivery_fee: deliveryFee,
        notes,
        status: "pending",
        payment_status: "paid",
        referral_code: refCode || null,
        creator_id,
        commission_amount,
      });
      clearRef();
      clearCart();
      toast.success("Order placed!");
      navigate(`/order/${order.id}/tracking`);
    } catch (e) {
      toast.error("Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-6 pb-40 min-h-screen">
        <h1 className="text-2xl font-bold mb-1">Your Cart</h1>
        <p className="text-sm text-muted-foreground mb-5">{restaurantName}</p>

        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.menu_item_id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{i.name}</p>
                    <p className="text-primary font-semibold text-sm">${i.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(i.menu_item_id, i.quantity - 1)} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{i.quantity}</span>
                    <button onClick={() => updateQty(i.menu_item_id, i.quantity + 1)} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => updateQty(i.menu_item_id, 0)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Delivery Address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, apt..."
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery notes (optional)"
                rows={2}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="mt-6 bg-card border border-border rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {placing ? "Placing..." : `Place Order · $${total.toFixed(2)}`}
            </button>
          </>
        )}
      </div>
    </CustomerLayout>
  );
}

export default function Cart() {
  return (
    <CartProvider>
      <CartInner />
    </CartProvider>
  );
}