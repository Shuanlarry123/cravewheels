import React, { useEffect, useRef, useState } from "react";
import mapbox from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, X, Truck, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const DEFAULT = { lat: 41.5, lng: -72.7 };
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

export default function TruckLocationEditor({ restaurant, onSaved }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [addr, setAddr] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    base44.functions.invoke("getMapboxToken", {}).then((r) => setToken(r.data?.token || null));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const lastChange = restaurant.location_updated_at ? new Date(restaurant.location_updated_at).getTime() : 0;
  const cooldownRemaining = COOLDOWN_MS - (now - lastChange);
  const onCooldown = cooldownRemaining > 0;
  const hoursLeft = Math.floor(cooldownRemaining / (60 * 60 * 1000));
  const minsLeft = Math.floor((cooldownRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const displayAddr = restaurant.address || "No location set";

  const openEditor = () => {
    if (onCooldown) return;
    setAddr(restaurant.address || "");
    setLat(restaurant.latitude || DEFAULT.lat);
    setLng(restaurant.longitude || DEFAULT.lng);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !token || !mapRef.current || mapInstance.current) return;
    mapbox.accessToken = token;
    const map = new mapbox.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lng, lat],
      zoom: 15,
    });
    mapInstance.current = map;
    map.on("load", () => {
      const m = new mapbox.Marker({ draggable: true, color: "#FF6B2C" })
        .setLngLat([lng, lat])
        .addTo(map);
      m.on("dragend", () => {
        const c = m.getLngLat();
        setLat(c.lat);
        setLng(c.lng);
      });
      markerRef.current = m;
    });
    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  const moveMarker = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    if (mapInstance.current && markerRef.current) {
      markerRef.current.setLngLat([newLng, newLat]);
      mapInstance.current.flyTo({ center: [newLng, newLat], duration: 600 });
    }
  };

  const submit = async () => {
    if (!addr || lat == null || lng == null) {
      toast.error("Search your location and drag the pin to confirm your spot");
      return;
    }
    setSaving(true);
    try {
      const updated = await base44.entities.Restaurant.update(restaurant.id, {
        address: addr,
        latitude: lat,
        longitude: lng,
        location_updated_at: new Date().toISOString(),
      });
      toast.success("Location updated — nearby customers have been notified");
      onSaved?.(updated);
      setOpen(false);
      try {
        await base44.functions.invoke("notifyTruckNearby", { restaurant_id: restaurant.id });
      } catch {
        /* best-effort */
      }
    } catch {
      toast.error("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Truck className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-primary">Truck Location</p>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug flex-1">{displayAddr}</p>
          <button
            onClick={openEditor}
            disabled={onCooldown}
            className="text-[10px] text-primary font-semibold shrink-0 flex items-center gap-0.5 mt-0.5 disabled:opacity-40"
          >
            <MapPin className="w-2.5 h-2.5" /> Change
          </button>
        </div>
        {onCooldown && (
          <p className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1.5">
            <Clock className="w-2.5 h-2.5" /> Next change in {hoursLeft}h {minsLeft}m
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-primary" /> Update truck location
              </h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Set where your truck is parked right now. Customers nearby get notified instantly — you can change again in 12 hours.
            </p>

            <AddressAutocomplete
              value={addr}
              onChange={setAddr}
              onPick={({ address, lat: la, lng: ln }) => {
                setAddr(address);
                moveMarker(la, ln);
              }}
              placeholder="Search your current spot..."
            />

            <div className="mt-3 h-56 rounded-xl overflow-hidden border border-border bg-background">
              {!token ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-full" />
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              {addr ? (
                <span className="truncate flex-1">{addr}</span>
              ) : (
                <span>Drag the pin to your exact spot</span>
              )}
              {lat != null && (
                <span className="shrink-0 font-mono text-[10px]">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              )}
            </div>

            <button
              onClick={submit}
              disabled={saving || !addr}
              className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                "Confirm & notify nearby customers"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}