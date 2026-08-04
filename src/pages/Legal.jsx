import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Copyright",
    body: "© 2026 CraveReel. All rights reserved. All content on this app — including videos, images, logos, graphics, text, and software — is the property of CraveReel or its licensors and is protected by copyright laws. You may not copy, reproduce, distribute, or republish any content without prior written permission. Restaurant and creator videos remain the property of the respective owners, who grant CraveReel a license to display them within the app.",
  },
  {
    title: "Terms & Conditions",
    body: "By using CraveReel, you agree to these terms. You must be at least 18 years old (or the age of majority in your region) to place orders. You are responsible for the accuracy of your delivery address and contact details. Orders are subject to restaurant availability, delivery range, and driver capacity. Payments are processed securely at checkout; once an order is accepted by the restaurant, cancellations may be limited. CraveReel acts as a marketplace connecting customers, restaurants, drivers, and creators, and is not the seller of the food itself. Misuse of the platform — including fraud, abuse, or violation of these terms — may result in account suspension.",
  },
  {
    title: "Privacy Policy",
    body: "CraveReel collects your name, email, role, order details, and (with permission) location to provide and improve the service. We use GPS to show nearby restaurants, estimate delivery, and track orders in real time. We never sell your personal data. Payments are handled by our payment provider; we do not store your full card number. You can request access, correction, or deletion of your data at any time. For the full policy, see our Privacy & Security page.",
  },
  {
    title: "Data Providers",
    body: "Some data within CraveReel is supplied by third-party providers. Map views, routing, and location features are powered by Mapbox and OpenStreetMap contributors. Address autocomplete and geocoding rely on these services. Restaurant and menu information is provided directly by our partner restaurants. CraveReel is not responsible for the accuracy of third-party map or routing data, and such data is provided 'as is' without warranty.",
  },
  {
    title: "Software Licenses",
    body: "CraveReel is built using open-source software, including React, Tailwind CSS, Leaflet, Mapbox GL, and other libraries, each distributed under their respective licenses (MIT, BSD, Apache 2.0, and similar permissive licenses). We gratefully acknowledge the contributions of these open-source communities. Full license details for each dependency are available from their respective repositories.",
  },
  {
    title: "Location Information",
    body: "CraveReel uses your device location when you grant permission. For customers, location is used to show restaurants delivering to your area, estimate distance and ETA, and place your position on the discovery map. For drivers, live location is shared only while you are online and actively completing a delivery, so customers can track their order. You can revoke location permission at any time in your device or browser settings; some features may be limited without it.",
  },
];

export default function Legal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  return (
    <div className="fixed inset-0 z-[80] bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 -ml-1 flex items-center justify-center text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Legal</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8">
        {SECTIONS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={s.title} className="border-b border-border">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-base font-medium">{s.title}</span>
                <ChevronDown
                  className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}