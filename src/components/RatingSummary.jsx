import React from "react";
import { Star } from "lucide-react";

/**
 * "⭐ 4.8 (327 verified orders)" — average rating + count of verified orders.
 * Renders nothing when the dish has no verified orders yet.
 */
export default function RatingSummary({ avg, orders }) {
  if (!orders) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
      {avg != null ? (
        <span className="text-white text-xs font-semibold">{avg.toFixed(1)}</span>
      ) : (
        <span className="text-white/70 text-xs font-semibold">New</span>
      )}
    </div>
  );
}