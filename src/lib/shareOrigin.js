// Production app URL — used for shareable links so external crawlers (iMessage,
// WhatsApp, etc.) can reach the OG preview function without auth.
// Always use the custom domain; the platform's appBaseUrl can point to the
// dispatcher worker which requires authentication, breaking link previews.
const PRODUCTION_URL = "https://cravewheels.com";

export function getShareOrigin() {
  return PRODUCTION_URL;
}