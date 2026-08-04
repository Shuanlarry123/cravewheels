import React, { useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Video, Upload, Loader2, CheckCircle2, Plus, Utensils, Receipt, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import MenuItemForm from "@/components/restaurant/MenuItemForm";
import RestaurantMenuGrid from "@/components/restaurant/RestaurantMenuGrid";
import RestaurantOrders from "@/components/restaurant/RestaurantOrders";
import AddressEditor from "@/components/restaurant/AddressEditor";
import TruckLocationEditor from "@/components/restaurant/TruckLocationEditor";
import PostFeed from "@/components/post/PostFeed";
import { cn } from "@/lib/utils";

export default function RestaurantOwnerProfile({ restaurant }) {
  const [rest, setRest] = useState(restaurant);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [kitchenVideo, setKitchenVideo] = useState(restaurant.kitchen_video_url || "");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef(null);

  const loadMenu = useCallback(async (rid) => {
    setMenuItems(await base44.entities.MenuItem.filter({ restaurant_id: rid }, "-created_date", 100));
  }, []);

  const loadOrders = useCallback(async (rid) => {
    setOrders(await base44.entities.Order.filter({ restaurant_id: rid }, "-created_date", 100));
  }, []);

  useEffect(() => {
    const rid = restaurant.id;
    Promise.all([loadMenu(rid), loadOrders(rid)]);
    const unsub = base44.entities.Order.subscribe(() => loadOrders(rid));
    return unsub;
  }, [restaurant.id]);

  const advanceOrder = async (order) => {
    const flow = { pending: "confirmed", confirmed: "preparing" };
    const next = flow[order.status];
    if (!next) return;
    setBusy(true);
    try {
      await base44.entities.Order.update(order.id, { status: next });
      toast.success("Order updated");
      await loadOrders(restaurant.id);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setBusy(false);
    }
  };

  const onKitchenUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Restaurant.update(restaurant.id, { kitchen_video_url: file_url });
      setKitchenVideo(file_url);
      toast.success("Kitchen video updated");
    } catch {
      toast.error("Failed to upload kitchen video");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const activeOrders = orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status));

  return (
    <div className="px-4 pt-8 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 overflow-hidden flex items-center justify-center shrink-0">
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} fittingType="fill" className="w-full h-full" alt={restaurant.name} />
          ) : (
            <Utensils className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold line-clamp-1">{restaurant.name}</h1>
            {restaurant.is_approved ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold shrink-0">
                Pending
              </span>
            )}
          </div>
          {restaurant.cuisine_type && (
            <p className="text-xs text-muted-foreground line-clamp-1">{restaurant.cuisine_type}</p>
          )}
          {rest.restaurant_type === "food_truck" ? (
            <TruckLocationEditor restaurant={rest} onSaved={setRest} />
          ) : (
            <AddressEditor restaurant={rest} onSaved={setRest} />
          )}
        </div>
      </div>

      {!restaurant.is_approved && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 mb-4 text-xs text-yellow-300">
          Your restaurant is pending admin approval. Customers won't see your menu until approved.
        </div>
      )}

      {/* Face of the Kitchen */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">Face of the Kitchen</h2>
            <p className="text-[11px] text-muted-foreground">Show customers where the magic happens</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-9 px-3 rounded-xl bg-primary/15 text-primary text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {kitchenVideo ? "Replace" : "Upload"}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onKitchenUpload} />
        </div>
        <div className="aspect-video rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center">
          {kitchenVideo ? (
            <video src={kitchenVideo} controls playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Video className="w-7 h-7" />
              <span className="text-[11px]">No kitchen video yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Utensils className="w-4 h-4 text-primary" /> Menu Videos ({menuItems.length})
          </h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs text-primary font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {showForm && (
          <MenuItemForm
            restaurant={restaurant}
            onCreated={() => {
              loadMenu(restaurant.id);
              setShowForm(false);
            }}
          />
        )}
        <RestaurantMenuGrid items={menuItems} onChanged={() => loadMenu(restaurant.id)} />
      </div>

      {/* Feed — post promo/behind-the-scenes videos */}
      <div className="mb-5">
        <PostFeed
          authorType="restaurant"
          authorId={restaurant.id}
          authorName={restaurant.name}
          authorAvatarUrl={restaurant.logo_url}
          restaurantId={restaurant.id}
          title="My Feed"
        />
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" /> Orders
          {activeOrders.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
              {activeOrders.length}
            </span>
          )}
        </h2>
        <RestaurantOrders orders={orders} onAdvance={advanceOrder} busy={busy} />
      </div>
    </div>
  );
}