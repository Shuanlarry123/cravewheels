import React from "react";
import { CheckCircle2 } from "lucide-react";

function formatWhen(dateStr) {
  if (!dateStr) return "this dish";
  const d = new Date(dateStr);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  }
  const mo = Math.floor(days / 30);
  return `${mo} month${mo > 1 ? "s" : ""} ago`;
}

/**
 * Order-history badge shown on a verified comment.
 * - repeat customers: "✅ Ordered 3 times"
 * - single order:     "✅ Ordered yesterday" (relative to last order)
 * - no order data:     "✅ Ordered the {dish}" (legacy fallback)
 */
export default function OrderBadge({ info, itemName }) {
  let label;
  if (info && info.count > 1) label = `Ordered ${info.count} times`;
  else if (info && info.count === 1) label = `Ordered ${formatWhen(info.lastDate)}`;
  else label = `Ordered the ${itemName || "dish"}`;

  return (
    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> {label}
    </p>
  );
}