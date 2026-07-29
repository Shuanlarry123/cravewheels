import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search as SearchIcon, Star, MapPin, ChevronRight } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import MapboxExploreMap from "@/components/MapboxExploreMap";
import { getUserLocation } from "@/lib/distance";
import { CartProvider } from "@/lib/cartContext";

const CUISINES = ["All", "Burgers", "Pizza", "Sushi", "Salads", "Desserts", "Drinks", "Bowls"];

function SearchInner() {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [restaurants, setRestaurants] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusId, setFocusId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Restaurant.filter({ is_approved: true }, "-rating", 200);
        setRestaurants(r);
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
        getUserLocation().then(setUserLocation);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchQ =
        !query ||
        r.name?.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisine_type?.toLowerCase().includes(query.toLowerCase());
      const matchC = cuisine === "All" || r.cuisine_type === cuisine;
      return matchQ && matchC;
    });
  }, [restaurants, query, cuisine]);

  return (
    <CustomerLayout>
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden">
        <div className="absolute inset-0">
          {token && filtered.length > 0 ? (
            <MapboxExploreMap
              token={token}
              restaurants={filtered}
              focusId={focusId}
              onSelect={setFocusId}
              userLocation={userLocation}
              centerOnUser
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              {loading ? "Loading map..." : "No restaurants found"}
            </div>
          )}
        </div>

        {/* Top search overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 z-10 bg-gradient-to-b from-background via-background/80 to-transparent pb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full bg-card/90 backdrop-blur border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  cuisine === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/90 border border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Selected restaurant quick link */}
        {focusId && (
          <Link
            to={`/restaurant/${focusId}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 mt-[-3.5rem] flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            View restaurant <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {/* Bottom restaurant showcase */}
        {filtered.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pb-3 pt-12 bg-gradient-to-t from-background via-background/90 to-transparent">
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setFocusId(r.id)}
                  className={`shrink-0 w-44 text-left rounded-2xl overflow-hidden border transition-all bg-card ${
                    focusId === r.id ? "border-primary ring-2 ring-primary/40" : "border-border"
                  }`}
                >
                  <div className="h-20 w-full bg-muted relative">
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

export default function Search() {
  return (
    <CartProvider>
      <SearchInner />
    </CartProvider>
  );
}