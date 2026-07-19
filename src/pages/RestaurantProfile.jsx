import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import RestaurantVideoMenu from "@/components/restaurant/RestaurantVideoMenu";
import { ArrowLeft, Star, Store, Radio, MapPin } from "lucide-react";

export default function RestaurantProfile() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Restaurant.get(id);
        setRestaurant(r);
        const menu = await base44.entities.MenuItem.filter({ restaurant_id: id, is_available: true }, "-views", 50);
        setItems(menu);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  if (!restaurant) return <div className="p-8 text-center text-muted-foreground">Restaurant not found.</div>;

  const menu = [...items].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="relative h-40">
        {restaurant.cover_url ? (
          <img src={restaurant.cover_url} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Link to="/" className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {restaurant.is_live && (
          <span className="absolute top-4 right-4 flex items-center gap-1 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            <Radio className="w-3 h-3" /> LIVE
          </span>
        )}
      </div>

      <div className="px-4 -mt-8 relative">
        <div className="flex items-end gap-3">
          <div className="w-16 h-16 rounded-2xl border-2 border-background overflow-hidden bg-card flex-shrink-0">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-7 h-7 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">{restaurant.cuisine_type}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" /> {restaurant.rating?.toFixed(1)}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" /> {restaurant.address || "—"}
          </span>
          <span className="text-muted-foreground">· ${restaurant.delivery_fee?.toFixed(2)} delivery</span>
        </div>

        {restaurant.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{restaurant.description}</p>}

        {restaurant.is_live && restaurant.live_stream_url && (
          <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-black border border-border">
            <iframe src={restaurant.live_stream_url} className="w-full h-full" allowFullScreen />
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-bold mb-3">Video Menu</h2>
          <RestaurantVideoMenu items={menu} />
        </div>
      </div>
    </div>
  );
}