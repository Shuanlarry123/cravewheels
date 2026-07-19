export const haversineKm = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || isNaN(v))) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const estimateDeliveryMinutes = (km) => (km == null ? 25 : Math.round(15 + km * 3));

export const getUserLocation = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: 41.5, lng: -72.7, fallback: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false }),
      () => resolve({ lat: 41.5, lng: -72.7, fallback: true }),
      { timeout: 5000, enableHighAccuracy: false }
    );
  });

export const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 16) return "afternoon";
  if (h < 21) return "evening";
  return "late night";
};