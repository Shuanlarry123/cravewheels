import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A clean bottom-sheet style select replacement for native <select> elements.
 * Options: [{ value, label }]
 */
export default function SelectSheet({ open, onOpenChange, value, onChange, options, placeholder, title }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-md mx-auto">
        {title && (
          <DrawerHeader className="pb-2">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
        )}
        <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[50vh] overflow-y-auto no-scrollbar">
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(""); onOpenChange(false); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium",
                !value ? "bg-primary/15 text-primary" : "text-foreground"
              )}
            >
              {placeholder}
              {!value && <Check className="w-4 h-4 shrink-0" />}
            </button>
          )}
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => { onChange(opt.value); onOpenChange(false); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium mt-1",
                value === opt.value ? "bg-primary/15 text-primary" : "text-foreground"
              )}
            >
              <span className="truncate text-left">{opt.label}</span>
              {value === opt.value && <Check className="w-4 h-4 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}