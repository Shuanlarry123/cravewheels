import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Video, Search, ShoppingBag, Receipt, Bike, Sparkles } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

const SECTIONS = [
  { icon: Video, title: "For You Feed", desc: "A TikTok-style vertical feed of mouth-watering dish clips from nearby restaurants, auto-playing as you scroll." },
  { icon: Search, title: "Near Me Map", desc: "A full-screen map to discover restaurants delivering to your area, with a showcase of top spots." },
  { icon: ShoppingBag, title: "Cart & Checkout", desc: "Add dishes from a single restaurant, enter your delivery address, and place an order in seconds." },
  { icon: Receipt, title: "Orders & Tracking", desc: "Track every order live from the kitchen to your door with status updates and delivery ETA." },
  { icon: Bike, title: "Driver Dashboard", desc: "Drivers go online, accept deliveries, follow turn-by-turn navigation, and verify orders at pickup." },
  { icon: Sparkles, title: "Creator Referrals", desc: "Creators earn commissions when dishes they share get ordered using their referral code." },
];

function AboutInner() {
  const navigate = useNavigate();
  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl mx-auto mb-3">🍴</div>
          <h1 className="text-2xl font-bold">CraveReel</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover and order your next meal through immersive video.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            CraveReel is a video-first food delivery marketplace. Instead of scrolling static menus, you swipe through
            short, crave-worthy clips of real dishes from local restaurants — then order in a tap. We connect hungry
            customers, restaurants, delivery drivers, and creators in one experience.
          </p>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">What's inside</h2>
        <div className="space-y-3">
          {SECTIONS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 bg-card border border-border rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">Made with 🔥 on CraveReel</p>
      </div>
    </CustomerLayout>
  );
}

export default function About() {
  return (
    <CartProvider>
      <AboutInner />
    </CartProvider>
  );
}