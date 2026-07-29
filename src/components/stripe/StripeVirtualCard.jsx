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
import CardWithdraw from "@/components/stripe/CardWithdraw";

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

  if ((requestStatus === "none" || requestStatus === "rejected") && showForm) {
    return formEl;
  }

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
        <div className="w-5 h-5 rounded-full bg-red-500/80" />
        <div className="w-5 h-5 rounded-full bg-yellow-400/80 -ml-2.5" />
      </div>
    ) : (
      <span className="text-sm font-bold italic text-white/90 tracking-wide">VISA</span>
    );

  const front = (
    <div
      style={{ backfaceVisibility: "hidden" }}
      className="relative rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-4 h-48 overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-white/70 rotate-90" />
          <span className="text-xs font-bold text-white tracking-tight">CraveReel</span>
        </div>
        <BrandMark />
      </div>
      <div className="relative mt-3 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500" />
      <p className="relative mt-3 text-white font-mono text-sm sm:text-base tracking-[0.12em] sm:tracking-[0.16em] truncate">
        •••• •••• •••• {last4}
      </p>
      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] uppercase text-white/50">Cardholder</p>
          <p className="text-xs font-semibold text-white uppercase tracking-wide truncate">{holder}</p>
        </div>
        <div className="text-right shrink-0">
          {expMonth && (
            <p className="text-[8px] uppercase text-white/50">Expires</p>
          )}
          {expMonth && (
            <p className="text-xs text-white/80 font-medium">
              {String(expMonth).padStart(2, "0")}/{String(expYear).slice(-2)}
            </p>
          )}
        </div>
      </div>
      <div className="relative mt-2 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-green-400" />
        <span className="text-[9px] text-white/60">active</span>
      </div>
    </div>
  );

  const back = (
    <div
      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-4 overflow-hidden"
    >
      <div className="h-7 w-full bg-black rounded" />
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-7 rounded bg-white/80" />
        <div className="w-14 h-7 rounded bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white/80 font-mono text-xs">•••</span>
        </div>
      </div>
      <div className="mt-3 text-white/70 text-[9px] leading-snug space-y-0.5">
        <p className="text-white font-semibold text-[10px]">CraveReel</p>
        <p className="flex items-center gap-1 truncate">
          <User className="w-2.5 h-2.5 shrink-0" /> {holder}
        </p>
        <p className="flex items-center gap-1 truncate">
          <Phone className="w-2.5 h-2.5 shrink-0" /> {record?.card_request_phone || "—"}
        </p>
        <p className="flex items-start gap-1">
          <MapPin className="w-2.5 h-2.5 mt-0.5 shrink-0" />
          <span className="truncate">
            {record?.card_request_line1}, {record?.card_request_city} {record?.card_request_state} {record?.card_request_postal_code}
          </span>
        </p>
        <p className="text-white/40 pt-1">
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

      {role === "driver" && hasCard && (
        <CardWithdraw record={record} balance={balance} onDone={onIssued} />
      )}
    </div>
  );
}