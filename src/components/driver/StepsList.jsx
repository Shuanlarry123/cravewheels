import React from "react";
import { maneuverIcon, fmtDistance } from "@/lib/maneuver";

export default function StepsList({ steps }) {
  if (!steps?.length) return null;
  return (
    <div>
      {steps.map((s, i) => {
        const Icon = maneuverIcon(s.maneuver?.type, s.maneuver?.modifier);
        return (
          <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{s.maneuver?.instruction}</p>
              {s.name && <p className="text-[11px] text-muted-foreground">on {s.name}</p>}
            </div>
            {s.distance > 0 && (
              <span className="text-[11px] text-muted-foreground shrink-0">{fmtDistance(s.distance)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}