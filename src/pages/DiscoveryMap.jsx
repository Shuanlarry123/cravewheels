import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Star, MapPin, ChevronRight } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import MapboxExploreMap from "@/components/MapboxExploreMap";
import { CartProvider } from "@/lib/cartContext";

function DiscoveryMapInner() {
  const [restaurants, setRestaurants] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusId, setFocusId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Restaurant.filter({ is_approved: true }, "-rating", 50);
        setRestaurants(r);
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <CustomerLayout>
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden">
        <div className="absolute inset-0">
          {token && restaurants.length > 0 ? (
            <MapboxExploreMap token={token} restaurants={restaurants} focusId={focusId} onSelect={setFocusId} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              {loading ? "Loading map..." : "No restaurants found"}
            </div>
          )}
        </div>

        {focusId && (
          <Link
            to={`/restaurant/${focusId}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 mt-[-3.5rem] flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            View restaurant <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {restaurants.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pb-3 pt-12 bg-gradient-to-t from-background via-background/90 to-transparent">
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-3">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setFocusId(r.id)}
                  className={`shrink-0 w-44 text-left rounded-2xl overflow-hidden border bg-card ${
                    focusId === r.id ? "border-primary ring-2 ring-primary/40" : "border-border"
                  }`}
                >
                  <div className="h-20 w-full bg-muted">
                    {r.cover_url ? (
                      <img src={r.cover_url} className="w-full h-full object-cover" alt={r.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍴</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold line-clamp-1">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{r.cuisine_type}</p>
                    <div className="flex items-center gap-1 text-[11px] mt-1">
                      <Star className="w-3 h-3 fill-primary text-primary" /> {r.rating?.toFixed(1)}
                      <span className="mx-1 text-muted-foreground">·</span>
                      <MapPin className="w-3 h-3 text-muted-foreground" /> {r.delivery_radius_km}km
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default function DiscoveryMap() {
  return (
    <CartProvider>
      <DiscoveryMapInner />
    </CartProvider>
  );
}