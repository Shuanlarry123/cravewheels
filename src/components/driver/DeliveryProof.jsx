import React, { useState } from "react";
import { X, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";

/**
 * Proof-of-delivery modal: capture a contactless photo at the drop-off spot
 * and enter the customer's delivery PIN to complete the order.
 */
export default function DeliveryProof({ order, onClose, onConfirm, busy }) {
  const [pin, setPin] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(res.file_url);
    } catch {
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full bg-card border-t border-border rounded-t-2xl p-5 max-h-[90%] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Confirm Delivery</h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Delivery photo (contactless proof)
        </label>
        {photoUrl ? (
          <div className="relative rounded-xl overflow-hidden mb-3">
            <img src={photoUrl} alt="proof" className="w-full h-40 object-cover" />
            <button
              onClick={() => setPhotoUrl(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1 h-32 rounded-xl border-2 border-dashed border-border mb-3 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Camera className="w-6 h-6 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {uploading ? "Uploading…" : "Take / select photo"}
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
          </label>
        )}

        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Customer delivery PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="••••"
          className="w-full h-12 rounded-xl bg-background border border-border px-4 text-center text-lg font-bold tracking-[0.5em] mb-2"
        />
        {order.delivery_pin && (
          <p className="text-[11px] text-muted-foreground mb-3">Customer PIN: {order.delivery_pin}</p>
        )}

        <button
          onClick={() => onConfirm(order, pin, photoUrl)}
          disabled={busy || pin.length !== 4 || uploading}
          className="w-full h-12 rounded-2xl bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Complete Delivery
        </button>
      </div>
    </div>
  );
}