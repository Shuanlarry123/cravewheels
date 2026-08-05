import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { staticMapImageUrl, getMapboxToken } from "@/lib/staticMap";

export default function StaticMapImage({
  lon,
  lat,
  zoom = 14,
  width = 640,
  height = 240,
  marker = true,
  className,
  fittingType = "fill",
  alt = "Map",
}) {
  const [token, setToken] = useState(null);
  useEffect(() => {
    let alive = true;
    getMapboxToken().then((t) => {
      if (alive) setToken(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  const url = staticMapImageUrl({ lon, lat, zoom, width, height, marker, token });
  if (!url) {
    return <div className={cn("bg-muted animate-pulse", className)} />;
  }
  return <Image src={url} fittingType={fittingType} className={className} alt={alt} />;
}