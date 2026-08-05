import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Radar, X, Phone, MessageCircle, User, MapPin, AlertTriangle, ShieldAlert, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const STATUS_LABEL = {
  pending: "Requested",
  matching: "Matching",
  confirmed: "Confirmed",
  preparing: "En route",
  picked_up: "In progress",
  delivered: "Completed",
  cancelled: "Cancelled",
};

const SEV_STYLE = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/40",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  info: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};
const SEV_DOT = { urgent: "bg-red-500", warning: "bg-amber-500", info: "bg-slate-400" };
const SEV_ICON = { urgent: ShieldAlert, warning: AlertTriangle, info: Info };

function secs(order, now) {
  const ts = order.state_changed_at || order.updated_date;
  if (!ts) return null;
  return Math.max(0, Math.floor((now - new Date(ts).getTime()) / 1000));
}
function fmt(s) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export default function DispatchOpsPanel({ data }) {
  const { orders = [], drivers = [], users = [] } = data;
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assignSel, setAssignSel] = useState({});
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [alertFilter, setAlertFilter] = useState("all");

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await base44.entities.DispatchEvent.list("-created_date", 200));
    } catch {
      /* non-admin */
    }
  }, []);

  useEffect(() => {
    loadEvents();
    const id = setInterval(loadEvents, 8000);
    const unsub = base44.entities.DispatchEvent.subscribe(loadEvents);
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const active = orders.filter((o) =>
    ["matching", "confirmed", "preparing", "picked_up"].includes(o.status)
  );
  const idleDrivers = drivers.filter(
    (d) => d.is_available && d.is_approved && (!d.availability_status || d.availability_status === "online_idle")
  );

  const shownEvents = events.filter((e) =>
    alertFilter === "all" ? true : e.severity === "warning" || e.severity === "urgent"
  );

  const assign = async (order) => {
    const driverId = assignSel[order.id];
    if (!driverId) {
      toast.error("Pick a driver first");
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("manualAssign", { order_id: order.id, driver_id: driverId });
      if (res.data?.error) toast.error(res.data.error);
      else toast.success("Driver assigned");
      setAssignSel((m) => ({ ...m, [order.id]: undefined }));
    } catch {
      toast.error("Failed to assign");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 border-b border-border">
        <Radar className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">Dispatch Ops</h2>
        <span className="ml-auto text-[11px] text-muted-foreground">{active.length} active</span>
      </div>

      {/* Severity-coded alert feed */}
      <div className="px-3 pt-2">
        <div className="flex items-center gap-1 mb-2">
          {["all", "alerts"].map((f) => (
            <button
              key={f}
              onClick={() => setAlertFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                alertFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              )}
            >
              {f === "all" ? "All events" : "Alerts only"}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar pr-1">
          {shownEvents.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">No alerts</p>
          ) : (
            shownEvents.slice(0, 30).map((e) => {
              const Icon = SEV_ICON[e.severity] || Info;
              return (
                <div key={e.id} className={cn("flex items-start gap-2 rounded-xl border px-2.5 py-1.5 text-[11px]", SEV_STYLE[e.severity])}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{e.detail || e.to_state}</p>
                    <p className="opacity-70 truncate">
                      {e.order_id?.slice(-6) || "—"} · {e.created_date ? new Date(e.created_date).toLocaleTimeString() : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active rides with time-in-state */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-4 space-y-2 no-scrollbar">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Active rides</p>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No active rides</p>
        ) : (
          active.map((o) => {
            const s = secs(o, now);
            const driver = drivers.find((d) => d.created_by_id === o.driver_id);
            const stale = o.status === "matching" && s != null && s > 120;
            const enroute = ["preparing", "picked_up"].includes(o.status) && s != null && s > 600;
            return (
              <div key={o.id} className="bg-card border border-border rounded-2xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setSelected(o)} className="min-w-0 text-left">
                    <p className="text-sm font-semibold truncate">{o.restaurant_name || "Ride"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{o.delivery_address || "—"}</p>
                  </button>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full shrink-0",
                      o.status === "matching" ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary"
                    )}
                  >
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-muted-foreground truncate">
                    {driver ? driver.legal_full_name || "Driver" : "Unassigned"}
                  </span>
                  <span className={cn("font-semibold tabular-nums", stale || enroute ? "text-red-400" : s != null && s > 60 ? "text-amber-400" : "text-muted-foreground")}>
                    {fmt(s)} in state
                  </span>
                </div>

                {/* Manual override */}
                <div className="flex gap-2 mt-2">
                  <select
                    value={assignSel[o.id] || ""}
                    onChange={(e) => setAssignSel((m) => ({ ...m, [o.id]: e.target.value }))}
                    className="flex-1 h-9 rounded-lg bg-background border border-border px-2 text-xs"
                  >
                    <option value="">Assign driver…</option>
                    {idleDrivers.map((d) => (
                      <option key={d.id} value={d.created_by_id}>
                        {d.legal_full_name || "Driver"} · {d.vehicle_type}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => assign(o)}
                    disabled={busy || !assignSel[o.id]}
                    className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <DrillDown
          order={selected}
          drivers={drivers}
          users={users}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DrillDown({ order, drivers, users, onClose }) {
  const driver = drivers.find((d) => d.created_by_id === order.driver_id);
  const rider = users.find((u) => u.id === order.created_by_id);
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-3xl max-h-[85%] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 bg-card">
          <p className="font-bold text-sm">Ride · …{order.id.slice(-6)}</p>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="px-4 pb-5 space-y-3 text-sm">
          <Row label="Status" value={STATUS_LABEL[order.status] || order.status} />
          <Row label="Created" value={order.created_date ? new Date(order.created_date).toLocaleString() : "—"} />
          <Row label="State changed" value={order.state_changed_at ? new Date(order.state_changed_at).toLocaleString() : "—"} />
          <Row label="Pickup" value={order.restaurant_name || "—"} icon={<MapPin className="w-3.5 h-3.5 text-primary" />} />
          <Row label="Drop-off" value={order.delivery_address || "—"} icon={<MapPin className="w-3.5 h-3.5 text-purple-400" />} />
          <div className="h-px bg-border" />
          <Row label="Fare" value={`$${Number(order.total_amount || 0).toFixed(2)}`} />
          <Row label="Delivery fee" value={`$${Number(order.delivery_fee || 0).toFixed(2)}`} />
          <Row label="Tip" value={`$${Number(order.tip || 0).toFixed(2)}`} />
          {Number(order.cancellation_fee || 0) > 0 && <Row label="Cancel fee" value={`$${order.cancellation_fee.toFixed(2)}`} />}

          <div className="h-px bg-border" />
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Driver</p>
          {driver ? (
            <Party name={driver.legal_full_name || "Driver"} sub={`${[driver.vehicle_make, driver.vehicle_model].filter(Boolean).join(" ") || driver.vehicle_type} · ★ ${(driver.rating || 5).toFixed(1)}`} phone={driver.phone} />
          ) : (
            <p className="text-xs text-muted-foreground">Unassigned</p>
          )}

          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mt-2">Rider</p>
          {rider || order.customer_phone ? (
            <Party name={rider?.full_name || rider?.email || "Rider"} sub={order.customer_phone || "No phone"} phone={order.customer_phone} />
          ) : (
            <p className="text-xs text-muted-foreground">Unknown</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs flex items-center gap-1.5">{icon}{label}</span>
      <span className="font-medium text-right text-xs">{value}</span>
    </div>
  );
}
function Party({ name, sub, phone }) {
  return (
    <div className="flex items-center gap-2 bg-background rounded-xl p-2">
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
      </div>
      {phone && (
        <div className="flex gap-1.5">
          <a href={`tel:${phone}`} className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></a>
          <a href={`sms:${phone}`} className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5" /></a>
        </div>
      )}
    </div>
  );
}