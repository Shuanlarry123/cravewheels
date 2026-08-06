import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { base44 } from "@/api/base44Client";
import { getUserLocation } from "@/lib/distance";
import { X, Loader2, MapPin, Check } from "lucide-react";

function makePinEl() {
  const el = document.createElement("div");
  el.style.cssText = "cursor:grab;";
  el.innerHTML =
    '<svg width="40" height="40" viewBox="0 0 40 40">' +
    '<path d="M20 2 C13 2 8 7 8 14 c0 8 12 22 12 22 s12-14 12-22 c0-7-5-12-12-12 Z" fill="#FF6B2C" stroke="#fff" stroke-width="2.5"/>' +
    '<circle cx="20" cy="14" r="5.5" fill="#fff"/></svg>';
  return el;
}

function parseFeature(feat) {
  if (!feat) return null;
  const ctx = feat.context || [];
  const city = ctx.find((c) => c.id.startsWith("place"))?.text || "";
  const state = ctx.find((c) => c.id.startsWith("region"))?.short_code || ctx.find((c) => c.id.startsWith("region"))?.text || "";
  const zip = ctx.find((c) => c.id.startsWith("postcode"))?.text || "";
  const street = feat.address ? `${feat.address} ${feat.text}` : feat.text || "";
  return { street, city, state, zip };
}

export default function PinDropMap({ onClose, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [token, setToken] = useState(null);
  const [start, setStart] = useState(null);
  const [picked, setPicked] = useState(null);
  const [reverse, setReverse] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    base44.functions.invoke("getMapboxToken", {}).then((r) => setToken(r.data?.token || null));
    getUserLocation()
      .then((l) => setStart(l || { lat: 40.7589, lng: -73.9851 }))
      .catch(() => setStart({ lat: 40.7589, lng: -73.9851 }));
  }, []);

  useEffect(() => {
    if (!token || !start || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [start.lng, start.lat],
      zoom: 15,
    });
    mapRef.current = map;
    map.on("load", () => {
      const marker = new mapboxgl.Marker({ element: makePinEl(), anchor: "bottom", draggable: true })
        .setLngLat([start.lng, start.lat])
        .addTo(map);
      markerRef.current = marker;
      setPicked({ lat: start.lat, lng: start.lng });
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        setPicked({ lat: ll.lat, lng: ll.lng });
      });
    });
    map.on("click", (e) => {
      markerRef.current?.setLngLat(e.lngLat);
      setPicked({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [token, start]);

  useEffect(() => {
    if (!token || !picked) return;
    setResolving(true);
    const t = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${picked.lng},${picked.lat}.json?types=address&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        setReverse(data.features?.[0] || null);
      } catch {
        setReverse(null);
      } finally {
        setResolving(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [token, picked]);

  const confirm = () => {
    if (!picked) return;
    const parsed = parseFeature(reverse);
    onPick({
      lat: picked.lat,
      lng: picked.lng,
      street: parsed?.street || "",
      city: parsed?.city || "",
      state: parsed?.state || "",
      zip: parsed?.zip || "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background">
      <div className="absolute top-0 inset-x-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-3 pb-3 z-10 flex items-center gap-3 bg-gradient-to-b from-background/90 to-transparent">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
          <X className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Drop your pin</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {resolving ? "Looking up address…" : reverse?.place_name || "Drag the pin or tap the map"}
          </p>
        </div>
      </div>
      <div ref={containerRef} className="absolute inset-0" />
      {!token && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] px-4 pt-6 z-10 bg-gradient-to-t from-background/95 to-transparent">
        <button
          onClick={confirm}
          disabled={!picked || resolving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" /> Use this location
        </button>
      </div>
    </div>
  );
}