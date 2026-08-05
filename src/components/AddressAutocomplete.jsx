import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, X } from "lucide-react";

export default function AddressAutocomplete({ value, onChange, onPick, placeholder = "Street, building, apt..." }) {
  const [token, setToken] = useState(null);
  const [q, setQ] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prox, setProx] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    base44.functions
      .invoke("getMapboxToken", {})
      .then((r) => setToken(r.data?.token || null))
      .catch(() => {});
  }, []);

  // Bias geocoding results toward the user's current location for relevance.
  useEffect(() => {
    if (!navigator.geolocation?.getCurrentPosition) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setProx(`${p.coords.longitude.toFixed(4)},${p.coords.latitude.toFixed(4)}`),
      () => {},
      { timeout: 4000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    setQ(value || "");
  }, [value]);

  useEffect(() => {
    if (!token || q.trim().length < 3) {
      setResults([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          q
        )}.json?access_token=${token}&autocomplete=true&limit=5${prox ? `&proximity=${prox}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features || []);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q, token, prox]);

  const pick = (feat) => {
    const label = feat.place_name;
    setQ(label);
    onChange(label);
    onPick?.({ address: label, lat: feat.center[1], lng: feat.center[0] });
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    setQ("");
    onChange("");
    onPick?.({ address: "", lat: null, lng: null });
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full bg-card border border-border rounded-xl pl-10 pr-9 py-3 text-sm focus:outline-none focus:border-primary"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        {q && (
          <button
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto no-scrollbar">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              className="w-full text-left px-3 py-2.5 flex gap-2 items-start hover:bg-muted border-b border-border last:border-0"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-xs leading-snug">{r.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}