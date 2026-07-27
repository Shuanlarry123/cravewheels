import React from "react";
import { ShoppingBag } from "lucide-react";

export default function ViewBasketBar({ count, subtotal, onClick }) {
  if (!count) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-between px-5 shadow-xl active:scale-[0.99] transition-transform"
    >
      <span className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" /> {count} item{count > 1 ? "s" : ""}
      </span>
      <span className="flex items-center gap-2">View basket · ${subtotal.toFixed(2)}</span>
    </button>
  );
}