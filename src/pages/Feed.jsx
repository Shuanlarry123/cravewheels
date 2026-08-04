import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Menu } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import PostVideoCard from "@/components/post/PostVideoCard";
import QuickAddSheet from "@/components/QuickAddSheet";
import ViewBasketBar from "@/components/ViewBasketBar";
import PullToRefresh from "@/components/PullToRefresh";
import { CartProvider, useCart, useReferral } from "@/lib/cartContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { haversineKm, estimateDeliveryMinutes, getUserLocation, timeOfDay } from "@/lib/distance";
import CustomerLayout from "@/components/CustomerLayout";
import { useLiteMode } from "@/lib/liteMode";
import { computeCraveScore, REACTION_STAR } from "@/lib/craveScore";
import RatingSummary from "@/components/RatingSummary";
import NotificationsBell from "@/components/NotificationsBell";

const FEED_SENTINEL = "__cravewheels_feed__";

function FeedInner() {
  const navigate = useNavigate();
  const { addItem, count, subtotal } = useCart();
  const { code: refCode } = useReferral();
  const [lite] = useLiteMode();
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
  const [posts, setPosts] = useState([]);
  const [ordersCount, setOrdersCount] = useState({});
  const [craveScores, setCraveScores] = useState({});
  const [ratingInfo, setRatingInfo] = useState({});
  const [orderInfoMap, setOrderInfoMap] = useState({});
  const containerRef = useRef(null);
  const ioRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const limit = lite ? 20 : 50;
      const [menuItems, rests, orders, likesAll, commentsAll, savedAll, triedAll, postsAll] = await Promise.all([
        base44.entities.MenuItem.filter({ is_available: true }, "-views", limit),
        base44.entities.Restaurant.filter({ is_approved: true }, "-created_date", 50),
        base44.entities.Order.filter({}, "-created_date", 500),
        base44.entities.Like.filter({}, "-created_date", 500),
        base44.entities.Comment.filter({}, "-created_date", 500),
        base44.entities.Saved.filter({}, "-created_date", 500),
        base44.entities.TriedIt.filter({}, "-created_date", 500),
        base44.entities.Post.filter({}, "-created_date", 50),
      ]);
      setRestaurants(rests);
      setPosts((postsAll || []).map((p) => ({ ...p, _type: "post" })));
      const restsById = Object.fromEntries(rests.map((r) => [r.id, r]));
      const enriched = menuItems.map((m) => ({ ...m, _restaurant: restsById[m.restaurant_id] }));
      // Aggregate reputation signals per dish → Crave Score + people-ordered count.
      const agg = {};
      const get = (mid) => {
        if (!agg[mid])
          agg[mid] = { likes: 0, comments: 0, saves: 0, reactions: [], commentRatings: [], ratings: [], orders: 0, customers: new Set(), customerOrders: {} };
        return agg[mid];
      };
      likesAll.forEach((l) => { if (l.menu_item_id) get(l.menu_item_id).likes++; });
      commentsAll.forEach((c) => { if (!c.menu_item_id) return; const a = get(c.menu_item_id); a.comments++; if (c.rating) { a.commentRatings.push(c.rating); a.ratings.push(c.rating); } });
      savedAll.forEach((s) => { if (s.menu_item_id) get(s.menu_item_id).saves++; });
      triedAll.forEach((t) => { if (!t.menu_item_id) return; const a = get(t.menu_item_id); a.reactions.push(t.reaction); a.ratings.push(REACTION_STAR[t.reaction] ?? 3); });
      const orderInfoByItem = {};
      orders.forEach((o) => {
        if (o.status === "cancelled") return;
        const person = o.created_by_id || o.id;
        const created = o.created_date;
        (o.items || []).forEach((it) => {
          if (!it?.menu_item_id) return;
          const a = get(it.menu_item_id);
          a.customers.add(person);
          a.customerOrders[person] = (a.customerOrders[person] || 0) + 1;
          a.orders++;
          const m = orderInfoByItem[it.menu_item_id] || (orderInfoByItem[it.menu_item_id] = {});
          const u = m[person] || (m[person] = { count: 0, lastDate: null });
          u.count++;
          if (!u.lastDate || new Date(created) > new Date(u.lastDate)) u.lastDate = created;
        });
      });
      const oCount = {};
      const scores = {};
      const rInfo = {};
      Object.entries(agg).forEach(([mid, a]) => {
        const distinctCustomers = a.customers.size;
        const repeatCustomers = Object.values(a.customerOrders).filter((n) => n > 1).length;
        oCount[mid] = distinctCustomers;
        scores[mid] = computeCraveScore({
          likes: a.likes,
          comments: a.comments,
          saves: a.saves,
          reactions: a.reactions,
          commentRatings: a.commentRatings,
          distinctCustomers,
          repeatCustomers,
        });
        rInfo[mid] = {
          avg: a.ratings.length ? a.ratings.reduce((s, r) => s + r, 0) / a.ratings.length : null,
          orders: a.orders,
        };
      });
      setOrdersCount(oCount);
      setCraveScores(scores);
      setRatingInfo(rInfo);
      setOrderInfoMap(orderInfoByItem);
      if (tab === "foryou" && !lite) {
        await rankWithAI(enriched);
      } else {
        setItems([...enriched].sort((a, b) => (b.views || 0) - (a.views || 0)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, lite]);

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
        prompt: `You are a food recommendation engine for Cravewheels, a video-first food delivery app. The current time-of-day is "${timeOfDay()}". From the following menu items, return a personalized ranking best suited for this time of day, each with a short appetizing reason (max 8 words). ${JSON.stringify(slim)}`,
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

  const feedItems = useMemo(() => {
    let vis = items;
    if (tab === "deals") {
      vis = items.filter((m) => m.is_featured || promoRestIds.has(m.restaurant_id));
    } else if (tab === "nearme" && loc) {
      vis = items
        .map((m) => {
          const r = m._restaurant;
          const d = r ? haversineKm(loc.lat, loc.lng, r.latitude, r.longitude) : null;
          return { ...m, _dist: d };
        })
        .filter((m) => m._dist == null || m._dist <= radius)
        .sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
    }
    if (tab !== "foryou") return vis;
    // Interleave posts into the For You feed (one post every 3 menu items)
    const result = [];
    let pi = 0;
    vis.forEach((m, i) => {
      result.push(m);
      if (i > 0 && i % 3 === 0 && pi < posts.length) result.push(posts[pi++]);
    });
    while (pi < posts.length) result.push(posts[pi++]);
    return result;
  }, [items, tab, loc, radius, promoRestIds, posts]);

  // IntersectionObserver for active video + view counting
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !feedItems.length) return;
    const cards = Array.from(root.querySelectorAll("[data-idx]"));
    ioRef.current?.disconnect();
    ioRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setActiveIdx(idx);
            const item = feedItems[idx];
            if (item && !item._viewed) {
              if (item._type === "post") {
                base44.entities.Post.update(item.id, { views: (item.views || 0) + 1 }).catch(() => {});
              } else {
                base44.entities.MenuItem.update(item.id, { views: (item.views || 0) + 1 }).catch(() => {});
              }
              item._viewed = true;
            }
          }
        });
      },
      { root, threshold: [0.6] }
    );
    cards.forEach((c) => ioRef.current.observe(c));
    return () => ioRef.current?.disconnect();
  }, [feedItems]);

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

  return (
    <CustomerLayout>
      <NotificationsBell />
      {/* Header tabs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-center gap-1 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 bg-gradient-to-b from-black/70 to-transparent">
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
        className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Near me radius filter */}
      {tab === "nearme" && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+3.5rem)] left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
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
      ) : feedItems.length === 0 ? (
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
        <PullToRefresh ref={containerRef} onRefresh={load} className="h-[100dvh] overflow-y-scroll snap-feed no-scrollbar">
          {feedItems.map((item, idx) => (
            <div key={item.id} data-idx={idx}>
              {item._type === "post" ? (
                <PostVideoCard post={item} active={idx === activeIdx} muted={muted} lite={lite} />
              ) : (
                <VideoCard
                  item={item}
                  active={idx === activeIdx}
                  muted={muted}
                  lite={lite}
                  distanceKm={item._dist}
                  etaMin={item._dist != null ? estimateDeliveryMinutes(item._dist) : null}
                  ordersCount={ordersCount[item.id] || 0}
                  craveScore={craveScores[item.id]}
                  ratingInfo={ratingInfo[item.id]}
                  orderInfoByUser={orderInfoMap[item.id] || {}}
                  onAdd={openQuickAdd}
                />
              )}
            </div>
          ))}
        </PullToRefresh>
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