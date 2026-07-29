import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Minus, Plus, ShoppingBag, Store } from "lucide-react";
import { CartProvider, useCart, useReferral } from "@/lib/cartContext";
import { toast } from "react-hot-toast";
import CommentSection from "@/components/CommentSection";
import CraveScoreBadge from "@/components/CraveScoreBadge";
import { computeCraveScore } from "@/lib/craveScore";

function ItemInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { code: refCode } = useReferral();
  const [item, setItem] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [crave, setCrave] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const m = await base44.entities.MenuItem.get(id);
        setItem(m);
        if (m.restaurant_id) {
          try {
            setRestaurant(await base44.entities.Restaurant.get(m.restaurant_id));
          } catch {}
        }
        base44.entities.MenuItem.update(id, { views: (m.views || 0) + 1 }).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const [likes, comments, saved, tried, orders] = await Promise.all([
          base44.entities.Like.filter({ menu_item_id: id }, "-created_date", 500),
          base44.entities.Comment.filter({ menu_item_id: id }, "-created_date", 500),
          base44.entities.Saved.filter({ menu_item_id: id }, "-created_date", 500),
          base44.entities.TriedIt.filter({ menu_item_id: id }, "-created_date", 500),
          base44.entities.Order.filter({}, "-created_date", 500),
        ]);
        const customers = new Set();
        const customerOrders = {};
        orders.forEach((o) => {
          if (o.status === "cancelled") return;
          const person = o.created_by_id || o.id;
          (o.items || []).forEach((it) => {
            if (it?.menu_item_id === id) {
              customers.add(person);
              customerOrders[person] = (customerOrders[person] || 0) + 1;
            }
          });
        });
        const repeatCustomers = Object.values(customerOrders).filter((n) => n > 1).length;
        setCrave(
          computeCraveScore({
            likes: likes.length,
            comments: comments.length,
            saves: saved.length,
            reactions: tried.map((t) => t.reaction),
            commentRatings: comments.map((c) => c.rating).filter(Boolean),
            distinctCustomers: customers.size,
            repeatCustomers,
          })
        );
      } catch {
        /* ignore */
      }
    })();
  }, [id]);

  const handleAdd = () => {
    const res = addItem(item, restaurant || { id: item.restaurant_id, name: item.restaurant_name });
    if (res.added) {
      toast.success(`${qty} × ${item.name} added`);
      navigate("/cart");
    } else {
      toast.error(`Cart has items from ${res.conflict}. Clear it first.`);
    }
  };

  if (loading)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  if (!item) return <div className="p-8 text-center text-muted-foreground">Item not found.</div>;

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      <div className="relative w-full aspect-[9/14] bg-black max-h-[70vh]">
        <video
          ref={videoRef}
          src={item.video_url}
          poster={item.thumbnail_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {restaurant && (
          <Link
            to={`/restaurant/${restaurant.id}`}
            className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 mb-4"
          >
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">{restaurant.name}</p>
              <p className="text-xs text-muted-foreground">{restaurant.cuisine_type}</p>
            </div>
            <span className="text-xs text-primary font-medium">View</span>
          </Link>
        )}

        <h1 className="text-2xl font-bold">{item.name}</h1>
        <p className="text-primary text-xl font-bold mt-1">${item.price.toFixed(2)}</p>
        <div className="mt-3">
          <CraveScoreBadge score={crave?.score} hasData={crave?.hasData} />
        </div>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center justify-between mt-6">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {refCode && (
          <p className="text-xs text-muted-foreground mt-4">🎁 Referral code <span className="text-primary font-medium">{refCode}</span> applied — creator earns commission.</p>
        )}
      </div>

      <div className="px-4 pb-4">
        <CommentSection itemId={item.id} itemName={item.name} restaurantId={item.restaurant_id} />
      </div>

      {/* Sticky add bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <button
          onClick={handleAdd}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ShoppingBag className="w-5 h-5" />
          Add to Cart · ${(item.price * qty).toFixed(2)}
        </button>
      </div>
    </div>
  );
}

export default function ItemDetail() {
  return (
    <CartProvider>
      <ItemInner />
    </CartProvider>
  );
}