import React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const tone = (score) =>
  score >= 80 ? "text-primary" : score >= 60 ? "text-amber-400" : "text-muted-foreground";

/**
 * Renders a dish's Crave Score. Shows "New" when there's no engagement signal yet.
 */
export default function CraveScoreBadge({ score, hasData, className }) {
  if (!hasData) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-secondary text-secondary-foreground",
          className
        )}
      >
        <Flame className="w-3.5 h-3.5" /> New
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-card/80 backdrop-blur border border-border",
        className
      )}
    >
      <Flame className="w-3.5 h-3.5 text-primary" />
      <span className="text-foreground">Crave Score</span>
      <span className={tone(score)}>{score}%</span>
    </span>
  );
}