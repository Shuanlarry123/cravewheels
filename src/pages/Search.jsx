import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Search as SearchIcon, Star, MapPin } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

const CATEGORIES = ["All", "Burgers", "Pizza", "Sushi", "Salads", "Desserts", "Drinks"];

function SearchInner() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, r] = await Promise.all([
          base44.entities.MenuItem.filter({ is_available: true }, "-views", 60),
          base44.entities.Restaurant.filter({ is_approved: true }, "-rating", 30),
        ]);
        setItems(m);
        setRestaurants(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchQ =
        !query ||
        i.name?.toLowerCase().includes(query.toLowerCase()) ||
        i.restaurant_name?.toLowerCase().includes(query.toLowerCase());
      const matchC = category === "All" || i.category === category;
      return matchQ && matchC;
    });
  }, [items, query, category]);

  const mapRestaurants = restaurants.filter((r) => r.latitude && r.longitude);

  return (
    <CustomerLayout>
      <div className="px-4 pt-6 pb-24 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes or restaurants..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === c ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {mapRestaurants.length > 0 && (
          <div className="h-40 rounded-2xl overflow-hidden mb-4 border border-border">
            <MapContainer center={[mapRestaurants[0].latitude, mapRestaurants[0].longitude]} zoom={11} className="h-full w-full" style={{ background: "#1a1a1a" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {mapRestaurants.map((r) => (
                <Popup key={r.id} position={[r.latitude, r.longitude]}>
                  <Link to={`/restaurant/${r.id}`} className="text-sm font-medium">{r.name}</Link>
                </Popup>
              ))}
              {mapRestaurants.map((r) => (
                <CircleMarker key={r.id} center={[r.latitude, r.longitude]} radius={8} pathOptions={{ color: "#FF6B2C", fillColor: "#FF6B2C", fillOpacity: 0.8 }}>
                  <Popup>
                    <Link to={`/restaurant/${r.id}`}>{r.name}</Link>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No results found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((i) => (
              <Link key={i.id} to={`/item/${i.id}`} className="bg-card border border-border rounded-2xl overflow-hidden active:scale-[0.98] transition-transform">
                <div className="aspect-square bg-muted relative">
                  {i.thumbnail_url && <img src={i.thumbnail_url} className="w-full h-full object-cover" />}
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">${i.price.toFixed(2)}</span>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-1">{i.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{i.restaurant_name}</p>
                </div>
              </Link>
            ))}
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