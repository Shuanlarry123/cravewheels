import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wallet,
  ShieldCheck,
  Banknote,
  Users,
  Bike,
  Store,
  Megaphone,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

export const EARN_CONFIG = {
  driver: {
    title: "Earn by driving or delivering",
    tagline: "Deliver food on your schedule and get paid weekly.",
    icon: Bike,
    accent: "from-orange-500/25 to-orange-500/5",
    earningsValue: "$1,200",
    earningsLabel: "Avg. earnings / week",
    steps: [
      { icon: CheckCircle2, title: "Apply online", desc: "Complete a short application and upload your documents." },
      { icon: ShieldCheck, title: "Get approved", desc: "Background check and ID verification, usually 2–3 days." },
      { icon: Bike, title: "Go online & deliver", desc: "Accept orders nearby and pick the hours that fit you." },
      { icon: Wallet, title: "Get paid", desc: "Cash out weekly — or instantly with Express Pay." },
    ],
    benefits: [
      { icon: Clock, title: "Flexible hours", desc: "No minimum hours. Drive whenever you want." },
      { icon: Banknote, title: "Weekly payouts", desc: "Get paid every week, with instant cashout available." },
      { icon: CircleDollarSign, title: "Keep 100% of tips", desc: "Every tip goes straight to you." },
      { icon: ShieldCheck, title: "In-app safety", desc: "Live trip tracking and 24/7 emergency support." },
    ],
    requirements: ["21+ years old", "Valid driver's license", "Smartphone (iOS or Android)", "Reliable vehicle"],
    applyTo: "/apply/driver",
    applyLabel: "Apply as a Driver",
  },
  restaurant: {
    title: "Earn by selling",
    tagline: "List your dishes and reach thousands of hungry customers nearby.",
    icon: Store,
    accent: "from-orange-500/25 to-orange-500/5",
    earningsValue: "$5,000",
    earningsLabel: "Avg. monthly revenue",
    steps: [
      { icon: CheckCircle2, title: "Apply online", desc: "Tell us about your restaurant and upload your documents." },
      { icon: ShieldCheck, title: "Get approved", desc: "We verify your business and address within a few days." },
      { icon: Store, title: "Add your menu", desc: "Upload video clips of your dishes and set your prices." },
      { icon: Banknote, title: "Receive orders", desc: "Accept orders, cook, and get paid weekly for every sale." },
    ],
    benefits: [
      { icon: TrendingUp, title: "More customers", desc: "Reach diners across your delivery radius." },
      { icon: Banknote, title: "Weekly payouts", desc: "Reliable payments deposited every week." },
      { icon: Users, title: "Cravewheels creators", desc: "Creators showcase your dishes and drive new orders." },
      { icon: ShieldCheck, title: "Business support", desc: "Dedicated help when you need it." },
    ],
    requirements: ["Valid business license", "Food handling permit", "Kitchen address", "Bank account for payouts"],
    applyTo: "/apply/restaurant",
    applyLabel: "Apply as a Restaurant",
  },
  creator: {
    title: "Earn by sharing",
    tagline: "Share dishes you love and earn commission on every order you inspire.",
    icon: Megaphone,
    accent: "from-orange-500/25 to-orange-500/5",
    earningsValue: "10%",
    earningsLabel: "Commission per order",
    steps: [
      { icon: CheckCircle2, title: "Apply online", desc: "Create your creator profile and get your referral code." },
      { icon: ShieldCheck, title: "Get approved", desc: "Quick review so we can keep the community authentic." },
      { icon: Megaphone, title: "Share dishes", desc: "Post clips of dishes and share your unique referral links." },
      { icon: Wallet, title: "Earn commission", desc: "Earn a commission on every order placed through your links." },
    ],
    benefits: [
      { icon: TrendingUp, title: "Passive income", desc: "Keep earning on orders long after you post." },
      { icon: Wallet, title: "Transparent earnings", desc: "Track clicks, orders, and payouts in real time." },
      { icon: Users, title: "Grow your audience", desc: "Reach diners looking for their next favorite dish." },
      { icon: CircleDollarSign, title: "No minimum", desc: "Cash out from your first commission." },
    ],
    requirements: ["18+ years old", "Active social account", "Smartphone to record clips", "Bank account for payouts"],
    applyTo: "/apply/influencer",
    applyLabel: "Apply as a Creator",
  },
};

export default function EarnLanding({ config }) {
  const navigate = useNavigate();
  const Icon = config.icon;

  return (
    <div className="pb-28 min-h-screen">
      {/* Back */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          onClick={() => navigate("/account")}
          className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
      </div>

      {/* Hero */}
      <div className={`px-5 pt-4`}>
        <div className={`rounded-3xl bg-gradient-to-b ${config.accent} border border-border p-6`}>
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Icon className="w-7 h-7" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{config.tagline}</p>
          <div className="flex items-end gap-2 mt-5">
            <span className="text-4xl font-bold tracking-tight">{config.earningsValue}</span>
            <span className="text-xs text-muted-foreground mb-1.5">{config.earningsLabel}</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          How it works
        </h2>
        <div className="space-y-3">
          {config.steps.map((step, i) => {
            const SIcon = step.icon;
            return (
              <div key={i} className="flex gap-3.5 bg-card border border-border rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <SIcon className="w-5 h-5 text-foreground/80" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold">{step.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why join */}
      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Why join
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {config.benefits.map((b, i) => {
            const BIcon = b.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                  <BIcon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <p className="text-sm font-semibold leading-tight">{b.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Requirements */}
      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Requirements
        </h2>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {config.requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
              <span className="text-sm">{r}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="px-5 mt-6">
        <button
          onClick={() => navigate(config.applyTo)}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
        >
          {config.applyLabel}
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          By applying, you agree to Cravewheels's terms and background check policy.
        </p>
      </div>
    </div>
  );
}