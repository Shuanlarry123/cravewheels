import React from "react";
import { ShieldCheck, FileText, Car, Camera, BadgeCheck } from "lucide-react";

const ITEMS = [
  { icon: FileText, title: "Identity verification", desc: "Upload your driver's license — we scan it to confirm it's genuine." },
  { icon: Car, title: "Vehicle & insurance", desc: "Register your vehicle with proof of registration and insurance." },
  { icon: Camera, title: "Profile photo", desc: "A clear photo so restaurants and customers recognize you." },
  { icon: BadgeCheck, title: "Background check", desc: "Consent to a background and driving-record check." },
];

export default function StepWelcome({ onNext }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Become a Driver</h1>
          <p className="text-sm text-muted-foreground">Secure application — just like Uber & DoorDash</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        For everyone's safety, every driver completes identity verification and a background check before
        they can deliver. This takes about 5 minutes.
      </p>
      <div className="space-y-2.5 mb-8">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 bg-card border border-border rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        type="button"
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
      >
        Start application
      </button>
    </div>
  );
}