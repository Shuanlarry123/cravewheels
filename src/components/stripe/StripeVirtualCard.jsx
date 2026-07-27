import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Loader2, RefreshCw, ShieldCheck, TrendingUp, Wifi } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function StripeVirtualCard({
  role,
  record,
  balance,
  balanceLabel = "Available balance",
  onIssued,
}) {
  const [card, setCard] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: record?.name || "",
    phone: record?.phone || "",
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const loadDetails = async () => {
    if (!record?.stripe_card_id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manageStripeCard", { action: "details", role });
      setCard(res.data?.card || null);
    } catch {
      /* Issuing not approved yet — card exists in our records */
    } finally {
      setLoading(false);
    }
  };

  const loadTxs = async () => {
    if (!record?.stripe_card_id) return;
    setTxLoading(true);
    try {
      const res = await base44.functions.invoke("manageStripeCard", { action: "transactions", role });
      setTxs(res.data?.transactions || []);
    } catch {
      /* Issuing not active yet */
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    loadTxs();
  }, [record?.stripe_card_id]);

  const issue = async () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.postal_code) {
      toast.error("Please fill all fields");
      return;
    }
    setIssuing(true);
    try {
      const res = await base44.functions.invoke("manageStripeCard", { action: "issue", role, ...form });
      setCard(res.data?.card || null);
      setShowForm(false);
      toast.success("Virtual card issued!");
      onIssued?.();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Failed to issue card");
    } finally {
      setIssuing(false);
    }
  };

  const inputCls = "w-full h-10 rounded-xl bg-background border border-border px-3 text-sm";

  // Not issued yet — CTA
  if (!record?.stripe_card_id && !showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-2xl bg-gradient-to-br from-primary/15 to-orange-500/10 border border-primary/30 p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
      >
        <span className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </span>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold">Get your virtual CraveReel card</p>
          <p className="text-xs text-muted-foreground">Receive earnings on a spendable virtual card.</p>
        </div>
      </button>
    );
  }

  // Onboarding form
  if (!record?.stripe_card_id && showForm) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Cardholder details</p>
          <p className="text-xs text-muted-foreground">Required by Stripe Issuing to create your card.</p>
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
          onClick={issue}
          disabled={issuing}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {issuing ? "Issuing card…" : "Issue virtual card"}
        </button>
        <button onClick={() => setShowForm(false)} className="w-full text-xs text-muted-foreground py-1">
          Cancel
        </button>
      </div>
    );
  }

  // Card display
  const last4 = record?.stripe_card_last4 || card?.last4 || "••••";
  const brand = (record?.stripe_card_brand || card?.brand || "visa").toLowerCase();
  const status = card?.status || "active";
  const expMonth = card?.exp_month;
  const expYear = card?.exp_year;

  return (
    <div className="space-y-3">
      {/* Card face */}
      <div className="relative rounded-3xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-5 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-white/70 rotate-90" />
            <span className="text-xs font-semibold text-white/70">CraveReel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-red-500/80" />
            <div className="w-7 h-7 rounded-full bg-yellow-400/80 -ml-3" />
          </div>
        </div>
        <div className="relative mt-6 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300/90 to-yellow-600/90" />
        <p className="relative mt-4 text-white font-mono text-lg tracking-widest">
          •••• •••• •••• {last4}
        </p>
        <div className="relative mt-4 flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase text-white/50">Cardholder</p>
            <p className="text-sm font-semibold text-white">{record?.name || "Cardholder"}</p>
            {expMonth && <p className="text-[10px] text-white/60 mt-0.5">{String(expMonth).padStart(2, "0")}/{String(expYear).slice(-2)}</p>}
          </div>
          <span className="text-sm font-bold uppercase text-white/80">{brand}</span>
        </div>
        <div className="relative mt-3 flex items-center gap-1.5">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
          ) : (
            <ShieldCheck className={cn("w-3.5 h-3.5", status === "active" ? "text-green-400" : "text-yellow-400")} />
          )}
          <span className="text-[10px] text-white/60 capitalize">{status}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{balanceLabel}</p>
          <p className="text-2xl font-bold text-primary">${(balance || 0).toFixed(2)}</p>
        </div>
        <button onClick={() => { loadDetails(); loadTxs(); }} className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" /> Card activity
        </p>
        {txLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : txs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">No card transactions yet. Spend your earnings online anywhere Visa is accepted.</p>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.merchant_data?.name || "Purchase"}</p>
                  <p className="text-[10px] text-muted-foreground">{moment(t.created * 1000).format("MMM D, h:mm A")}</p>
                </div>
                <span className={t.amount < 0 ? "text-destructive font-semibold" : "text-green-400 font-semibold"}>
                  {(t.amount / 100).toFixed(2)} {t.currency?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}