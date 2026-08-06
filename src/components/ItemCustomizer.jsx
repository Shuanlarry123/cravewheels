import React from "react";
import { Check } from "lucide-react";

export default function ItemCustomizer({ groups, sel, onToggle }) {
  if (!groups || !groups.length) return null;
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => {
        const multi = g.type === "multi";
        const cur = sel[gi];
        const indicator = multi ? "rounded-sm" : "rounded-full";
        return (
          <div key={gi}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">
                {g.title}
                {g.required && <span className="text-destructive text-xs ml-1">· Required</span>}
              </p>
              <span className="text-[11px] text-muted-foreground">{multi ? "Choose any" : "Choose one"}</span>
            </div>
            <div className="space-y-1.5">
              {(g.options || []).map((o, oi) => {
                const selected = multi ? Array.isArray(cur) && cur.includes(o.name) : cur === o.name;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => onToggle(gi, o.name, multi)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selected ? "border-primary bg-primary/10" : "border-border bg-background"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 shrink-0 border-2 ${indicator} flex items-center justify-center ${
                        selected ? "border-primary bg-primary" : "border-muted-foreground/50"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 text-sm">{o.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {o.price ? `+$${Number(o.price).toFixed(2)}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}