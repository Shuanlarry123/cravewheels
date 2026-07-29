import React, { useEffect, useRef, useState } from "react";
import mapbox from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, X, Clock, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const DEFAULT = { lat: 41.5, lng: -72.7 }; // Connecticut fallback

export default function AddressEditor({ restaurant, onSaved }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [addr, setAddr] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    base44.functions.invoke("getMapboxToken", {}).then((r) => setToken(r.data?.token || null));
  }, []);

  const status = restaurant.address_verification_status;
  const displayAddr = restaurant.pending_address || restaurant.address || "No address set";

  const openEditor = () => {
    setAddr(restaurant.pending_address || restaurant.address || "");
    const startLat = restaurant.pending_latitude || restaurant.latitude || DEFAULT.lat;
    const startLng = restaurant.pending_longitude || restaurant.longitude || DEFAULT.lng;
    setLat(startLat);
    setLng(startLng);
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
      toast.error("Search your address and drag the pin to confirm the spot");
      return;
    }
    setSaving(true);
    try {
      const updated = await base44.entities.Restaurant.update(restaurant.id, {
        pending_address: addr,
        pending_latitude: lat,
        pending_longitude: lng,
        address_verification_status: "pending",
      });
      toast.success("Address submitted — pending admin verification");
      onSaved?.(updated);
      setOpen(false);
    } catch {
      toast.error("Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-1.5 mt-1">
        <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{displayAddr}</p>
          {status === "pending" && restaurant.pending_address && (
            <p className="text-[10px] text-yellow-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" /> Change pending review
            </p>
          )}
          {status === "rejected" && (
            <p className="text-[10px] text-red-400 mt-0.5">Last change rejected — try again</p>
          )}
        </div>
        <button
          onClick={openEditor}
          className="text-[10px] text-primary font-semibold shrink-0 flex items-center gap-0.5 mt-0.5"
        >
          <Pencil className="w-2.5 h-2.5" /> Edit
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-8 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Update your address</h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Search your address, then drag the pin to the exact entrance so drivers and customers find you. Changes need admin approval before going live.
            </p>

            <AddressAutocomplete
              value={addr}
              onChange={setAddr}
              onPick={({ address, lat: la, lng: ln }) => {
                setAddr(address);
                moveMarker(la, ln);
              }}
              placeholder="Search your street, building..."
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
                <span>Drag the pin to set your exact location</span>
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Request address change"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}