import { appParams } from "@/lib/app-params";

// Production app URL — used for shareable links so external crawlers (iMessage,
// WhatsApp, etc.) can reach the OG preview function without auth.
// In the builder preview, window.location.origin points to the dispatcher
// worker which requires authentication, breaking link previews.
const PRODUCTION_URL = "https://crave-reel-feed.base44.app";

export function getShareOrigin() {
  return appParams.appBaseUrl || PRODUCTION_URL;
}