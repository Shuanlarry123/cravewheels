import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Store, Navigation, DollarSign, Clock, Star, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { haversineKm } from "@/lib/distance";

const COUNTDOWN = 15;

export default function RideRequestCard({ request, driverLocation, onAccepted, onClose }) {
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(COUNTDOWN);
  const [accepting, setAccepting] = useState(false);
  const [taken, setTaken] = useState(false);
  const audioRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await base44.entities.Order.get(request.order_id);
        if (cancelled) return;
        setOrder(o);
        if (o?.restaurant_id)
          base44.entities.Restaurant.get(o.restaurant_id).then((r) => !cancelled && setRestaurant(r)).catch(() => {});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [request.order_id]);

  useEffect(() => {
    try {
      navigator.vibrate?.([200, 100, 200, 100, 300]);
    } catch {}
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    } catch {}
    return () => {
      try {
        audioRef.current?.close();
      } catch {}
    };
  }, []);

  const beep = (freq = 880, ms = 120) => {
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000);
    } catch {}
  };

  useEffect(() => {
    if (loading || accepting || taken) return;
    setRemaining(COUNTDOWN);
    let n = COUNTDOWN;
    tickRef.current = setInterval(() => {
      n -= 1;
      setRemaining(n);
      if (n <= 5 && n > 0) {
        beep(660, 100);
        try {
          navigator.vibrate?.(60);
        } catch {}
      }
      if (n <= 0) {
        clearInterval(tickRef.current);
        beep(300, 300);
        onClose?.(request.id);
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, accepting, taken]);

  const accept = async () => {
    if (accepting || taken) return;
    setAccepting(true);
    try {
      const res = await base44.functions.invoke("acceptRide", { order_id: request.order_id });
      if (res.data?.accepted) {
        beep(1200, 200);
        onAccepted?.(res.data.order);
        setTimeout(() => onClose?.(request.id), 700);
      } else {
        setTaken(true);
        beep(220, 400);
        setTimeout(() => onClose?.(request.id), 1600);
      }
    } catch {
      setTaken(true);
      setTimeout(() => onClose?.(request.id), 1600);
    } finally {
      setAccepting(false);
    }
  };

  const pickupKm =
    driverLocation && restaurant?.latitude != null
      ? haversineKm(driverLocation.lat, driverLocation.lng, restaurant.latitude, restaurant.longitude)
      : null;
  const pickupEta = pickupKm != null ? Math.max(1, Math.round(pickupKm * 2.5 + 2)) : null;
  const tripKm =
    restaurant?.latitude != null && order?.latitude != null
      ? haversineKm(restaurant.latitude, restaurant.longitude, order.latitude, order.longitude)
      : null;
  const earnings = Number(order?.delivery_fee || 2.99) + Number(order?.tip || 0);
  const fare = Number(order?.total_amount || 0);

  const pct = remaining / COUNTDOWN;
  const R = 26;
  const circ = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-bold uppercase tracking-wide text-primary">New Ride Request</p>
          </div>
          <button onClick={() => onClose?.(request.id)} className="text-muted-foreground p-1 -m-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : taken ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-base font-semibold">No longer available</p>
            <p className="text-sm text-muted-foreground mt-1">Another driver accepted this request.</p>
          </div>
        ) : (
          <>
            {/* Countdown ring */}
            <div className="flex flex-col items-center py-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                  <circle
                    cx="32"
                    cy="32"
                    r={R}
                    fill="none"
                    stroke={remaining <= 5 ? "#ef4444" : "#FF6B2C"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct)}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{remaining}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Auto-decline in {remaining}s</p>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {/* Pickup */}
              <div className="flex items-start gap-3 bg-background rounded-2xl p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pickup</p>
                  <p className="text-sm font-semibold truncate">{order?.restaurant_name || "Restaurant"}</p>
                  <p className="text-xs text-muted-foreground truncate">{restaurant?.address || "Address on file"}</p>
                </div>
                {pickupEta != null && (
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-primary leading-none">{pickupEta}</p>
                    <p className="text-[10px] text-muted-foreground">min away</p>
                  </div>
                )}
              </div>

              {/* Dropoff */}
              <div className="flex items-start gap-3 bg-background rounded-2xl p-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Drop-off</p>
                  <p className="text-sm font-semibold truncate">{order?.delivery_address || "Customer"}</p>
                  {tripKm != null && (
                    <p className="text-xs text-muted-foreground">{(tripKm * 0.621371).toFixed(1)} mi trip</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Stat icon={<DollarSign className="w-3.5 h-3.5" />} label="Earn" value={`$${earnings.toFixed(2)}`} highlight />
                <Stat icon={<Navigation className="w-3.5 h-3.5" />} label="Trip" value={tripKm != null ? `${(tripKm * 0.621371).toFixed(1)}mi` : "—"} />
                <Stat icon={<Star className="w-3.5 h-3.5" />} label="Rider" value="5.0" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => onClose?.(request.id)}
                  disabled={accepting}
                  className="flex-1 h-13 py-3.5 rounded-2xl bg-secondary text-secondary-foreground font-semibold disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={accept}
                  disabled={accepting}
                  className="flex-[1.6] h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {accepting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {accepting ? "Accepting…" : "Accept"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, highlight }) {
  return (
    <div className="bg-background rounded-2xl p-2.5 flex flex-col items-center text-center">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-bold mt-0.5 ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}