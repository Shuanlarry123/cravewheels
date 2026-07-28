import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Minus, Plus, Trash2, MapPin, Tag, Clock, Store, Truck, X } from "lucide-react";
import { CartProvider, useCart, useReferral } from "@/lib/cartContext";
import CustomerLayout from "@/components/CustomerLayout";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { toast } from "react-hot-toast";

const DROPOFF_OPTIONS = ["Leave at door", "Hand to me", "Meet outside"];

function CartInner() {
  const navigate = useNavigate();
  const { items, updateQty, clearCart, subtotal, deliveryFee, restaurantId, restaurantName } = useCart();
  const { code: refCode, clear: clearRef } = useReferral();
  const [orderType, setOrderType] = useState("delivery");
  const [scheduleMode, setScheduleMode] = useState("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [dropoff, setDropoff] = useState(DROPOFF_OPTIONS[0]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [tipPct, setTipPct] = useState(15);
  const [tipCustom, setTipCustom] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    base44.entities.Restaurant.get(restaurantId).then(setRestaurant).catch(() => {});
  }, [restaurantId]);

  const effectiveFee = orderType === "pickup" ? 0 : deliveryFee;
  const tip = tipPct ? Math.round(((subtotal * tipPct) / 100) * 100) / 100 : Number(tipCustom) || 0;
  const total = Math.max(0, subtotal + effectiveFee - discount + tip);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    try {
      const found = await base44.entities.Promo.filter(
        { code: promoInput.trim().toUpperCase(), is_active: true },
        "-created_date",
        1
      );
      const p = found[0];
      if (!p) {
        toast.error("Invalid promo code");
        return;
      }
      if (p.valid_until && new Date(p.valid_until) < new Date()) {
        toast.error("This promo has expired");
        return;
      }
      if (p.restaurant_id && p.restaurant_id !== restaurantId) {
        toast.error(`Valid only at ${p.restaurant_name || "that restaurant"}`);
        return;
      }
      if (subtotal < (p.min_order || 0)) {
        toast.error(`Minimum order $${(p.min_order || 0).toFixed(2)} required`);
        return;
      }
      let d = p.discount_type === "percent" ? (subtotal * p.value) / 100 : p.value;
      if (p.max_discount && d > p.max_discount) d = p.max_discount;
      d = Math.round(d * 100) / 100;
      setPromo(p);
      setDiscount(d);
      toast.success(`Promo applied — you save $${d.toFixed(2)}`);
    } catch {
      toast.error("Failed to apply promo");
    } finally {
      setApplyingPromo(false);
    }
  };

  const clearPromo = () => {
    setPromo(null);
    setDiscount(0);
    setPromoInput("");
  };

  const placeOrder = async () => {
    if (orderType === "delivery" && !address.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }
    if (scheduleMode === "later" && !scheduledFor) {
      toast.error("Choose a time for your order");
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
        delivery_address: orderType === "pickup" ? restaurant?.address || "Pickup" : address,
        latitude: orderType === "delivery" ? lat : null,
        longitude: orderType === "delivery" ? lng : null,
        delivery_fee: effectiveFee,
        tip,
        notes,
        status: "pending",
        payment_status: "paid",
        referral_code: refCode || null,
        creator_id,
        commission_amount,
        order_type: orderType,
        scheduled_for: scheduleMode === "later" ? scheduledFor : null,
        delivery_instructions: orderType === "delivery" ? dropoff : null,
        promo_code: promo?.code || null,
        discount_amount: discount,
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

            {/* Order type */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Order Type</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType("delivery")}
                  className={`flex-1 h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${
                    orderType === "delivery" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  <Truck className="w-4 h-4" /> Delivery
                </button>
                <button
                  onClick={() => setOrderType("pickup")}
                  className={`flex-1 h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${
                    orderType === "pickup" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  <Store className="w-4 h-4" /> Pickup
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div className="mt-5">
              <p className="text-sm font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> When</p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setScheduleMode("asap")}
                  className={`flex-1 h-10 rounded-xl border text-sm font-medium ${
                    scheduleMode === "asap" ? "bg-primary/15 text-primary border-primary/40" : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  ASAP
                </button>
                <button
                  onClick={() => setScheduleMode("later")}
                  className={`flex-1 h-10 rounded-xl border text-sm font-medium ${
                    scheduleMode === "later" ? "bg-primary/15 text-primary border-primary/40" : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  Schedule for later
                </button>
              </div>
              {scheduleMode === "later" && (
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Delivery or pickup details */}
            {orderType === "delivery" ? (
              <div className="mt-5 space-y-3">
                <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Delivery Address</label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onPick={({ lat, lng }) => {
                    setLat(lat);
                    setLng(lng);
                  }}
                />
                <label className="text-sm font-medium">Drop-off</label>
                <select
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  {DROPOFF_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery notes (optional)"
                  rows={2}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-medium flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Pickup from</p>
                  <p className="text-sm text-muted-foreground mt-1">{restaurant?.address || restaurantName}</p>
                  {scheduleMode === "later" && scheduledFor && (
                    <p className="text-xs text-primary mt-1">Ready for pickup: {new Date(scheduledFor).toLocaleString()}</p>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pickup notes (optional)"
                  rows={2}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            )}

            {/* Tip */}
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">Add a tip</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "No tip", value: 0 },
                  { label: "10%", value: 10 },
                  { label: "15%", value: 15 },
                  { label: "20%", value: 20 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTipPct(opt.value);
                      setTipCustom("");
                    }}
                    className={`h-auto py-2 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center gap-0.5 ${
                      tipPct === opt.value && !tipCustom
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                    {opt.value > 0 && (
                      <span className="text-[10px] font-normal opacity-80">${((subtotal * opt.value) / 100).toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
              <input
                value={tipCustom}
                onChange={(e) => {
                  setTipCustom(e.target.value);
                  setTipPct(0);
                }}
                placeholder="Custom tip $"
                type="number"
                min="0"
                className="mt-2 w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Promo */}
            <div className="mt-5">
              <p className="text-sm font-medium mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> Promo Code</p>
              {promo ? (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{promo.code}</p>
                    <p className="text-xs text-muted-foreground">−${discount.toFixed(2)} applied</p>
                  </div>
                  <button onClick={clearPromo} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={applyingPromo}
                    className="px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {applyingPromo ? "..." : "Apply"}
                  </button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">Try WELCOME10, SAVE5, or LUNCH15</p>
            </div>

            {/* Summary */}
            <div className="mt-6 bg-card border border-border rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{orderType === "pickup" ? "Pickup" : "Delivery Fee"}</span>
                <span>{orderType === "pickup" ? "Free" : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span>−${discount.toFixed(2)}</span>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tip</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
              )}
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