/**
 * Shared visual enhancements for Mapbox GL maps.
 * Adds 3D buildings, atmospheric sky, warm ambient lighting, and traffic-signal markers.
 */

/**
 * Adds 3D building extrusion to a Mapbox map (visible at zoom 14+).
 * Uses the composite source's "building" layer available in Mapbox's built-in styles.
 */
export function add3DBuildings(map) {
  try {
    if (!map.getSource("composite")) return;
    if (map.getLayer("3d-buildings")) return;
    map.addLayer({
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#15151f",
        "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
        "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.5,
      },
    });
  } catch {
    // Style may not include the building source-layer
  }
}

/**
 * Adds an atmospheric sky layer for depth when the map is pitched.
 */
export function addSky(map) {
  try {
    if (map.getLayer("sky")) return;
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-color": "#0a0a14",
        "sky-horizon-blend": 0.5,
        "horizon-color": "#1a1a2e",
        "horizon-fog-blend": 0.6,
        "fog-color": "#0a0a14",
        "fog-ground-blend": 0.1,
      },
    });
  } catch {
    // Sky layer not supported in this mapbox-gl version
  }
}

/**
 * Sets warm ambient light to match the app's orange accent.
 */
export function setWarmLight(map) {
  try {
    map.setLight({
      anchor: "viewport",
      color: "#FF8C4A",
      intensity: 0.4,
      position: [1.5, 90, 80],
    });
  } catch {
    // Some mapbox-gl versions may not support setLight fully
  }
}

/**
 * Creates a compact traffic-light icon element for intersection markers.
 */
export function makeTrafficLightEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:16px;height:20px;display:flex;flex-direction:column;align-items:center;" +
    "justify-content:center;gap:1.5px;background:#1a1a2e;border:1px solid rgba(255,255,255,0.35);" +
    "border-radius:3px;padding:2px;box-shadow:0 1px 4px rgba(0,0,0,0.8);";
  el.innerHTML =
    '<div style="width:4px;height:4px;border-radius:50%;background:#ef4444;box-shadow:0 0 4px #ef4444;"></div>' +
    '<div style="width:4px;height:4px;border-radius:50%;background:#eab308;opacity:0.35;"></div>' +
    '<div style="width:4px;height:4px;border-radius:50%;background:#22c55e;opacity:0.35;"></div>';
  return el;
}

/**
 * Creates an animated pulsing driver marker for the customer tracking view.
 * Uses a glowing orange dot with expanding rings.
 */
export function makeAnimatedDriverEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;";
  el.innerHTML =
    '<div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(255,107,44,0.2);animation:driver-pulse 2.4s cubic-bezier(0.2,0.6,0.3,1) infinite;"></div>' +
    '<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(255,107,44,0.3);animation:driver-pulse 2.4s cubic-bezier(0.2,0.6,0.3,1) infinite 0.8s;"></div>' +
    '<div style="position:relative;width:22px;height:22px;border-radius:50%;background:#FF6B2C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(255,107,44,0.7);border:2px solid #fff;">' +
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>' +
    "</div>";
  return el;
}