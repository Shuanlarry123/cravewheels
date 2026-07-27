import React from "react";
import { Navigation, Loader2 } from "lucide-react";
import { maneuverIcon, fmtDistance, fmtDuration } from "@/lib/maneuver";

export default function DirectionsBanner({ routeInfo }) {
  if (!routeInfo) {
    return (
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border rounded-2xl px-3 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Calculating route…
      </div>
    );
  }
  const step = routeInfo.steps?.[0];
  const Icon = step ? maneuverIcon(step.maneuver?.type, step.maneuver?.modifier) : Navigation;
  return (
    <div className="bg-card/95 backdrop-blur border border-border rounded-2xl px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-2">
            {step?.maneuver?.instruction || "Follow the route"}
          </p>
          <p className="text-xs text-muted-foreground">
            {fmtDistance(step?.distance)}
            {routeInfo.duration ? ` · ${fmtDuration(routeInfo.duration)} total` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-primary leading-none">{fmtDuration(routeInfo.duration)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDistance(routeInfo.distance)}</p>
        </div>
      </div>
    </div>
  );
}