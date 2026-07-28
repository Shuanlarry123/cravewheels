import React, { useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";

export default function OpenInMaps({ lat, lng, label = "destination" }) {
  const [open, setOpen] = useState(false);
  if (lat == null || lng == null) return null;

  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const apple = `https://maps.apple.com/?daddr=${lat},${lng}`;

  const go = (url) => {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground py-2 hover:text-foreground transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Open in maps
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <p className="text-[11px] text-muted-foreground px-3 pt-2">Open route to {label} in</p>
            <button
              type="button"
              onClick={() => go(google)}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted transition-colors text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-blue-400" />
              </span>
              <span className="text-sm font-medium">Google Maps</span>
            </button>
            <button
              type="button"
              onClick={() => go(apple)}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted transition-colors text-left border-t border-border"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-500/15 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-foreground" />
              </span>
              <span className="text-sm font-medium">Apple Maps</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}