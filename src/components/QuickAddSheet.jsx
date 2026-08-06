import React, { useEffect, useState } from "react";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Image } from "@/components/ui/image";
import ItemCustomizer from "@/components/ItemCustomizer";
import { useItemCustomizer } from "@/lib/useItemCustomizer";

export default function QuickAddSheet({ item, onAdd, onClose }) {
  const [qty, setQty] = useState(1);
  const { sel, toggle, modifiers, unitPrice, valid } = useItemCustomizer(item?.price, item?.modifier_groups);

  useEffect(() => {
    setQty(1);
  }, [item]);

  if (!item) return null;
  const hasGroups = item.modifier_groups && item.modifier_groups.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl p-4 pb-8 max-h-[88vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
        <button onClick={onClose} className="absolute top-3 right-3">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex gap-3 mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0">
            {item.thumbnail_url ? (
              <Image src={item.thumbnail_url} fittingType="fill" className="w-full h-full" alt={item.name} />
            ) : (
              <video src={item.video_url} muted loop playsInline className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{item.name}</p>
            <p className="text-primary font-bold">${unitPrice.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
          </div>
        </div>

        {hasGroups && <ItemCustomizer groups={item.modifier_groups} sel={sel} onToggle={toggle} />}

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => valid && onAdd?.(item, qty, modifiers)}
          disabled={!valid}
          className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <ShoppingBag className="w-5 h-5" /> Add to Cart · ${(unitPrice * qty).toFixed(2)}
        </button>
        {!valid && <p className="text-xs text-destructive text-center mt-2">Please complete the required options</p>}
      </div>
    </div>
  );
}