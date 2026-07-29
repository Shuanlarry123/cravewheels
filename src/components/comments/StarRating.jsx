import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating row.
 * - Display-only when `onChange` is omitted (disabled buttons, no hover effect).
 * - Interactive (tap to set 1–5) when `onChange` is provided.
 */
export default function StarRating({ value = 0, onChange, size = 14, className }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(onChange && "active:scale-90 transition-transform cursor-pointer")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(n <= value ? "fill-primary text-primary" : "text-muted-foreground/40")}
          />
        </button>
      ))}
    </div>
  );
}