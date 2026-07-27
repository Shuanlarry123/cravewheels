import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Menu } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import QuickAddSheet from "@/components/QuickAddSheet";
import ViewBasketBar from "@/components/ViewBasketBar";
import { CartProvider, useCart, useReferral } from "@/lib/cartContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { haversineKm, estimateDeliveryMinutes, getUserLocation, timeOfDay } from "@/lib/distance";
import CustomerLayout from "@/components/CustomerLayout";

const FEED_SENTINEL = "__cravereel_feed__";

function FeedInner() {
  const navigate = useNavigate();
  const { addItem, count, subtotal } = useCart();
  const { code: refCode } = useReferral();
  const [quick, setQuick] = useState(null);
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [tab, setTab] = useState("foryou");
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loc, setLoc] = useState(null);
  const [radius, setRadius] = useState(10);
  const [muted, setMuted] = useState(true);
  const [promoRestIds, setPromoRestIds] = useState(new Set());
  const containerRef = useRef(null);
  const ioRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menuItems, rests] = await Promise.all([
        base44.entities.MenuItem.filter({ is_available: true }, "-views", 50),
        base44.entities.Restaurant.filter({ is_approved: true }, "-created_date", 50),
      ]);
      setRestaurants(rests);
      const restsById = Object.fromEntries(rests.map((r) => [r.id, r]));
      const enriched = menuItems.map((m) => ({ ...m, _restaurant: restsById[m.restaurant_id] }));
      if (tab === "foryou") {
        await rankWithAI(enriched);
      } else {
        setItems(enriched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const rankWithAI = async (menuItems) => {
    // fallback immediately so feed shows
    setItems([...menuItems].sort((a, b) => (b.views || 0) - (a.views || 0)));
    try {
      const slim = menuItems.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        price: m.price,
        restaurant: m.restaurant_name,
      }));
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a food recommendation engine for CraveReel, a video-first food delivery app. The current time-of-day is "${timeOfDay()}". From the following menu items, return a personalized ranking best suited for this time of day, each with a short appetizing reason (max 8 words). ${JSON.stringify(slim)}`,
        response_json_schema: {
          type: "object",
          properties: {
            rankings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
      });
      const order = res.rankings || [];
      const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
      const ranked = order
        .map((o) => (byId[o.id] ? { ...byId[o.id], _aiReason: o.reason } : null))
        .filter(Boolean);
      const leftover = menuItems.filter((m) => !order.find((o) => o.id === m.id));
      if (ranked.length) setItems([...ranked, ...leftover]);
    } catch (e) {
      // keep fallback
    }
  };

  useEffect(() => {
    getUserLocation().then(setLoc);
  }, []);

  useEffect(() => {
    base44.entities.Promo
      .filter({ is_active: true }, "-created_date", 50)
      .then((ps) => setPromoRestIds(new Set(ps.map((p) => p.restaurant_id).filter(Boolean))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // IntersectionObserver for active video + view counting
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !items.length) return;
    const cards = Array.from(root.querySelectorAll("[data-idx]"));
    ioRef.current?.disconnect();
    ioRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setActiveIdx(idx);
            const item = items[idx];
            if (item && !item._viewed) {
              base44.entities.MenuItem.update(item.id, { views: (item.views || 0) + 1 }).catch(() => {});
              items[idx]._viewed = true;
            }
          }
        });
      },
      { root, threshold: [0.6] }
    );
    cards.forEach((c) => ioRef.current.observe(c));
    return () => ioRef.current?.disconnect();
  }, [items]);

  const openQuickAdd = (item) => setQuick(item);

  const confirmQuickAdd = (item, qty) => {
    const res = addItem(item, item._restaurant || { id: item.restaurant_id, name: item.restaurant_name }, qty);
    if (res.added) {
      toast.success(`${qty} × ${item.name} added`);
      setQuick(null);
    } else {
      toast.error(`Cart has items from ${res.conflict}. Clear it first.`);
    }
  };

  let visibleItems = items;
  if (tab === "deals") {
    visibleItems = items.filter((m) => m.is_featured || promoRestIds.has(m.restaurant_id));
  } else if (tab === "nearme" && loc) {
    visibleItems = items
      .map((m) => {
        const r = m._restaurant;
        const d = r ? haversineKm(loc.lat, loc.lng, r.latitude, r.longitude) : null;
        return { ...m, _dist: d };
      })
      .filter((m) => m._dist == null || m._dist <= radius)
      .sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
  }

  return (
    <CustomerLayout>
      {/* Header tabs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-center gap-1 pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={() => setTab("foryou")}
          className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
            tab === "foryou" ? "text-white" : "text-white/50"
          }`}
        >
          For You
        </button>
        <span className="text-white/30">|</span>
        <button
          onClick={() => setTab("nearme")}
          className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
            tab === "nearme" ? "text-white" : "text-white/50"
          }`}
        >
          Near Me
        </button>
        <span className="text-white/30">|</span>
        <button
          onClick={() => setTab("deals")}
          className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors ${
            tab === "deals" ? "text-white" : "text-white/50"
          }`}
        >
          Deals
        </button>
      </div>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="fixed top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Near me radius filter */}
      {tab === "nearme" && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
          {[2, 5, 10, 999].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1 text-xs rounded-full backdrop-blur transition-colors ${
                radius === r ? "bg-primary text-white" : "bg-black/50 text-white/70"
              }`}
            >
              {r === 999 ? "Any" : `${r}km`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="h-[100dvh] flex flex-col items-center justify-center text-center px-8">
          <Menu className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {tab === "nearme"
              ? "No restaurants delivering to your area yet."
              : tab === "deals"
              ? "No active deals right now."
              : "No dishes available right now."}
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="h-[100dvh] overflow-y-scroll snap-feed no-scrollbar">
          {visibleItems.map((item, idx) => (
            <div key={item.id} data-idx={idx}>
              <VideoCard
                item={item}
                active={idx === activeIdx}
                muted={muted}
                distanceKm={item._dist}
                etaMin={item._dist != null ? estimateDeliveryMinutes(item._dist) : null}
                onAdd={openQuickAdd}
              />
            </div>
          ))}
        </div>
      )}
      <ViewBasketBar count={count} subtotal={subtotal} onClick={() => navigate("/cart")} />
      <QuickAddSheet item={quick} onAdd={confirmQuickAdd} onClose={() => setQuick(null)} />
    </CustomerLayout>
  );
}

export default function Feed() {
  return (
    <CartProvider>
      <FeedInner />
    </CartProvider>
  );
}