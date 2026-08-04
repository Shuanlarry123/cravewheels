import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ShieldCheck,
  MapPin,
  UserCog,
  CreditCard,
  Truck,
  Share2,
  Lock,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

const SECTIONS = [
  {
    icon: UserCog,
    title: "Information we collect",
    body: "When you create an account, we store your name, email, and the role you choose (Browsing, Driver, Restaurant, or Influencer). When you place orders, we store the items, delivery address, and any delivery notes you provide.",
  },
  {
    icon: MapPin,
    title: "Location & GPS",
    body: "We use your device location to show restaurants near you, estimate delivery distance and arrival time, and (for customers) display your position on the discovery map. Location is requested with your permission and can be turned off anytime in your device or browser settings. Delivery drivers share their live location only while they are online and actively completing a delivery, so customers can track their order.",
  },
  {
    icon: Truck,
    title: "Driver, restaurant & influencer applications",
    body: "To review your application, we collect the details you submit — such as your vehicle and license number (drivers), restaurant name, cuisine, address and phone (restaurants), and referral code, social handle and bio (influencers). These are used only to verify and approve your application and to run the related dashboard.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    body: "Payments are processed by our payment provider. We do not store your full card number on our servers. We keep a record of the order amount and payment status so we can show your order history and settle payouts with restaurants, drivers, and influencers.",
  },
  {
    icon: Share2,
    title: "How we share your data",
    body: "To fulfill an order, we share the relevant details (items, delivery address, and status) with the restaurant preparing your food and the driver delivering it. Influencer referral codes are linked to orders so commissions can be calculated. We never sell your personal data.",
  },
  {
    icon: Lock,
    title: "Security & retention",
    body: "Data is encrypted in transit and access is restricted to what each role needs. We keep your data for as long as your account is active and as needed to comply with legal obligations. You can request deletion of your account and data at any time by contacting support.",
  },
];

function PrivacyInner() {
  const navigate = useNavigate();
  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy & Security</h1>
            <p className="text-xs text-muted-foreground">Last updated: July 2026</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cravewheels is a video-first food delivery marketplace connecting customers, restaurants,
            drivers, and creators. This policy explains what data we collect, how we use it — including
            how we use GPS — and the choices you have.
          </p>
        </div>

        <div className="space-y-3">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 bg-card border border-border rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/legal")}
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 mb-6 active:scale-[0.99] transition-transform"
        >
          <span className="text-sm font-medium">Legal</span>
          <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
          Questions about your data? Contact us through the app and we'll help with access, correction,
          or deletion of your information.
        </p>
      </div>
    </CustomerLayout>
  );
}

export default function Privacy() {
  return (
    <CartProvider>
      <PrivacyInner />
    </CartProvider>
  );
}