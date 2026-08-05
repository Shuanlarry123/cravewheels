import { base44 } from "@/api/base44Client";

let cachedToken = null;
let tokenPromise = null;

export function getMapboxToken() {
  if (cachedToken) return Promise.resolve(cachedToken);
  if (!tokenPromise) {
    tokenPromise = base44.functions
      .invoke("getMapboxToken", {})
      .then((r) => {
        cachedToken = r?.data?.token || null;
        return cachedToken;
      })
      .catch(() => null);
  }
  return tokenPromise;
}

/**
 * Builds a Mapbox Static Images API URL — a single precomposed map image for a
 * given center point. Matches the app's dark theme via the dark-v11 style.
 */
export function staticMapImageUrl({
  lon,
  lat,
  zoom = 14,
  width = 640,
  height = 240,
  marker = true,
  token,
  retina = true,
}) {
  if (token == null || lon == null || lat == null) return null;
  const overlay = marker ? `pin-s+ff6b2c(${lon},${lat})/` : "";
  const r = retina ? "@2x" : "";
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlay}${lon},${lat},${zoom}/${width}x${height}${r}?access_token=${token}`;
}