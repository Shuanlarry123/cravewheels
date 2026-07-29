import React from "react";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function NavButtons({ onBack, onNext, nextLabel = "Continue", nextDisabled, disabledReason, hideBack }) {
  const handleClick = () => {
    if (nextDisabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }
    onNext();
  };

  return (
    <div className="flex gap-3 mt-6">
      {!hideBack && (
        <button
          onClick={onBack}
          type="button"
          className="h-12 px-5 rounded-2xl bg-card border border-border text-sm font-semibold text-muted-foreground flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}
      <button
        onClick={handleClick}
        type="button"
        className={`flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.99] transition-transform ${
          nextDisabled ? "opacity-50" : ""
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}