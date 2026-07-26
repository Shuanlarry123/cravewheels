import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Search,
  ShoppingBag,
  Receipt,
  Bike,
  Sparkles,
  Store,
  ShieldCheck,
  MapPin,
  Clock,
  Tag,
  Truck,
  Star,
  Zap,
  Heart,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";

const FEATURES = [
  { icon: Video, title: "Video Feed", desc: "Swipe through short, crave-worthy clips of real dishes from nearby restaurants — auto-playing as you scroll. No more guessing from static photos." },
  { icon: Search, title: "Discovery Map", desc: "A full-screen map to find restaurants delivering to your area, with a showcase of top spots and filters by cuisine." },
  { icon: ShoppingBag, title: "Cart & Checkout", desc: "Add dishes from a restaurant, choose delivery or pickup, schedule a time, and place an order in seconds." },
  { icon: Receipt, title: "Orders & Live Tracking", desc: "Track every order live from kitchen to door with real-time status updates, map location, and delivery ETA." },
  { icon: Tag, title: "Deals & Promos", desc: "Apply promo codes at checkout for instant discounts, and browse a dedicated Deals feed of featured offers." },
  { icon: Clock, title: "Scheduling & Pickup", desc: "Order now or schedule for later, and switch between delivery to your address or quick pickup at the restaurant." },
];

const FOR_DRIVERS = [
  { icon: Bike, title: "Go online anytime", desc: "Toggle availability from your profile and start accepting deliveries on your schedule." },
  { icon: MapPin, title: "Turn-by-turn navigation", desc: "Follow the live map to the restaurant for pickup and to the customer for drop-off." },
  { icon: Truck, title: "Verify at pickup", desc: "Confirm the order is in hand, then mark picked up and delivered to update the customer automatically." },
  { icon: Zap, title: "Track earnings", desc: "See your deliveries, rating, and total earnings grow with every completed drop-off." },
];

function SectionCard({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-3 bg-card border border-border rounded-2xl p-4">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold mb-0.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ApplyRow({ to, icon: Icon, title, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

function AboutInner() {
  const navigate = useNavigate();
  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-3xl mx-auto mb-3">🍴</div>
          <h1 className="text-2xl font-bold">CraveReel</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover and order your next meal through immersive video.</p>
        </div>

        {/* What we are */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            CraveReel is a video-first food delivery marketplace. Instead of scrolling static menus, you swipe through
            short, crave-worthy clips of real dishes from local restaurants — then order in a tap. We connect hungry
            customers, restaurants, delivery drivers, and creators in one seamless experience.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Our Mission</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Make deciding what to eat the most fun part of your day — while giving local restaurants a vivid way to
            show off their food and giving drivers and creators real ways to earn.
          </p>
        </div>

        {/* How it works */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">How it works</h2>
        <div className="bg-card border border-border rounded-2xl p-4 mb-8 space-y-3">
          {[
            { n: 1, t: "Watch the feed", d: "Swipe through autoplaying video clips of dishes near you." },
            { n: 2, t: "Tap to add", d: "Add what you crave to your cart from a single restaurant." },
            { n: 3, t: "Checkout", d: "Choose delivery or pickup, add a promo, and place your order." },
            { n: 4, t: "Track live", d: "Follow your order from kitchen to your door in real time." },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {s.n}
              </div>
              <div>
                <p className="text-sm font-semibold">{s.t}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">What's inside</h2>
        <div className="space-y-3 mb-8">
          {FEATURES.map((f) => (
            <SectionCard key={f.title} {...f} />
          ))}
        </div>

        {/* For Drivers */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1 flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary" /> For Drivers
        </h2>
        <div className="space-y-3 mb-8">
          {FOR_DRIVERS.map((f) => (
            <SectionCard key={f.title} {...f} />
          ))}
        </div>

        {/* Stats / trust */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { icon: Video, label: "Video-first ordering" },
            { icon: Star, label: "Rated local spots" },
            { icon: Truck, label: "Live delivery tracking" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Partners */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">Partners & creators</h2>
        <div className="space-y-3 mb-8">
          <SectionCard icon={Store} title="Restaurants" desc="List your dishes as video clips, reach hungry customers nearby, and manage orders from a dedicated dashboard." />
          <SectionCard icon={Sparkles} title="Creators" desc="Share dishes with your referral code and earn commission on every order placed through it." />
        </div>

        {/* Join */}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">Join CraveReel</h2>
        <div className="space-y-3 mb-6">
          <ApplyRow to="/apply/driver" icon={Bike} title="Apply as a Driver" desc="Deliver food and earn on your schedule." />
          <ApplyRow to="/apply/restaurant" icon={Store} title="Apply as a Restaurant" desc="List your dishes and reach hungry customers." />
          <ApplyRow to="/apply/influencer" icon={Sparkles} title="Apply as an Influencer" desc="Share dishes and earn commission per order." />
        </div>

        <Link to="/privacy" className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-6 active:scale-[0.99] transition-transform">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="flex-1 text-sm font-medium">Privacy & Security Policy</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <p className="text-center text-xs text-muted-foreground">Made with 🔥 on CraveReel</p>
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