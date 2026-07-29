import React from "react";
import { ChevronLeft } from "lucide-react";

export default function NavButtons({ onBack, onNext, nextLabel = "Continue", nextDisabled, hideBack }) {
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
        onClick={onNext}
        disabled={nextDisabled}
        type="button"
        className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}