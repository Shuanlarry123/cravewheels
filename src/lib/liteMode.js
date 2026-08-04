import { useEffect, useState } from "react";

const KEY = "cravewheels_lite_mode";
const EVT = "cravewheels-lite-mode-change";

export function getLiteMode() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setLiteMode(v) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

export function useLiteMode() {
  const [lite, setLite] = useState(getLiteMode);
  useEffect(() => {
    const handler = () => setLite(getLiteMode());
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);
  return [lite, (v) => setLiteMode(v)];
}