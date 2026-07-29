import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Wifi,
  RotateCw,
  X,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function StripeVirtualCard({
  role,
  record,
  balance,
  balanceLabel = "Available balance",
  onIssued,
}) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [form, setForm] = useState({
    name: record?.legal_full_name || record?.name || "",
    phone: record?.phone || "",
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const entity = role === "restaurant" ? base44.entities.Restaurant : base44.entities.DriverProfile;
  const requestStatus =
    record?.card_request_status || (record?.stripe_card_id ? "approved" : "none");
  const hasCard = !!record?.stripe_card_id;
  const inputCls = "w-full h-10 rounded-xl bg-background border border-border px-3 text-sm";

  const submitRequest = async () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.postal_code) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      await entity.update(record.id, {
        card_request_status: "requested",
        card_request_name: form.name,
        card_request_phone: form.phone,
        card_request_line1: form.line1,
        card_request_city: form.city,
        card_request_state: form.state,
        card_request_postal_code: form.postal_code,
        card_request_country: form.country,
      });
      toast.success("Card request submitted! CraveReel will review it shortly.");
      setShowForm(false);
      onIssued?.();
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const formEl = (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">Cardholder details</p>
        <p className="text-xs text-muted-foreground">
          Required to issue your CraveReel debit card. An admin will review your request.
        </p>
      </div>
      <input className={inputCls} placeholder="Cardholder name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={inputCls} placeholder="Phone (+1…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className={inputCls} placeholder="Billing address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className={inputCls} placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} placeholder="ZIP" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
        <input className={inputCls} placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      </div>
      <button
        onClick={submitRequest}
        disabled={submitting}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {submitting ? "Submitting…" : "Submit card request"}
      </button>
      <button onClick={() => setShowForm(false)} className="w-full text-xs text-muted-foreground py-1">
        Cancel
      </button>
    </div>
  );

  // Not requested yet — CTA
  if (requestStatus === "none" && !showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-2xl bg-gradient-to-br from-primary/15 to-orange-500/10 border border-primary/30 p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
      >
        <span className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </span>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold">Get your CraveReel card</p>
          <p className="text-xs text-muted-foreground">Request a virtual debit card to spend your earnings.</p>
        </div>
      </button>
    );
  }

  // Request form (new or re-request after rejection)
  if ((requestStatus === "none" || requestStatus === "rejected") && showForm) {
    return formEl;
  }

  // Waiting for admin approval
  if (requestStatus === "requested") {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-yellow-500/15 flex items-center justify-center shrink-0">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Request submitted</p>
          <p className="text-xs text-muted-foreground">CraveReel is reviewing your card request.</p>
        </div>
      </div>
    );
  }

  // Rejected
  if (requestStatus === "rejected" && !hasCard) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-11 h-11 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-red-400" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Request declined</p>
            <p className="text-xs text-muted-foreground">You can submit a new card request.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Request again
        </button>
      </div>
    );
  }

  // Approved — interactive flippable debit card
  const last4 = record?.stripe_card_last4 || "••••";
  const brand = (record?.stripe_card_brand || "visa").toLowerCase();
  const expMonth = record?.card_exp_month;
  const expYear = record?.card_exp_year;
  const holder =
    record?.card_request_name || record?.legal_full_name || record?.name || "Cardholder";

  const BrandMark = () =>
    brand.includes("master") ? (
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-red-500/80" />
        <div className="w-6 h-6 rounded-full bg-yellow-400/80 -ml-3" />
      </div>
    ) : (
      <span className="text-lg font-bold italic text-white/90 tracking-wide">VISA</span>
    );

  const front = (
    <div
      style={{ backfaceVisibility: "hidden" }}
      className="relative rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-5 h-52 overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
          <span className="text-sm font-bold text-white tracking-tight">CraveReel</span>
        </div>
        <BrandMark />
      </div>
      <div className="relative mt-5 w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500" />
      <p className="relative mt-4 text-white font-mono text-lg tracking-[0.2em]">
        •••• •••• •••• {last4}
      </p>
      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase text-white/50">Cardholder</p>
          <p className="text-sm font-semibold text-white uppercase tracking-wide">{holder}</p>
          {expMonth && (
            <p className="text-[10px] text-white/60 mt-0.5">
              {String(expMonth).padStart(2, "0")}/{String(expYear).slice(-2)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] text-white/60">active</span>
        </div>
      </div>
    </div>
  );

  const back = (
    <div
      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      className="absolute inset-0 rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-5 overflow-hidden"
    >
      <div className="h-9 w-full bg-black rounded" />
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-9 rounded bg-white/85" />
        <div className="w-16 h-9 rounded bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white/80 font-mono text-sm">•••</span>
        </div>
      </div>
      <div className="mt-4 text-white/70 text-[10px] leading-relaxed">
        <p className="text-white font-semibold text-xs mb-1">CraveReel</p>
        <p className="flex items-center gap-1">
          <User className="w-2.5 h-2.5" /> {holder}
        </p>
        <p className="flex items-center gap-1">
          <Phone className="w-2.5 h-2.5" /> {record?.card_request_phone || "—"}
        </p>
        <p className="flex items-start gap-1">
          <MapPin className="w-2.5 h-2.5 mt-0.5" /> {record?.card_request_line1}, {record?.card_request_city} {record?.card_request_state} {record?.card_request_postal_code}
        </p>
        <p className="mt-2 text-white/40">
          Issued by CraveReel pursuant to a license from {brand.includes("master") ? "Mastercard" : "Visa"}.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="block w-full text-left [perspective:1400px]"
      >
        <div
          className="relative transition-transform duration-700"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {front}
          {back}
        </div>
      </button>
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <RotateCw className="w-3 h-3" /> Tap card to flip
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{balanceLabel}</p>
        <p className="text-2xl font-bold text-primary">${(balance || 0).toFixed(2)}</p>
      </div>
    </div>
  );
}