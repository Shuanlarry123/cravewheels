import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, Ban, UserCog, Send, ChevronDown } from "lucide-react";
import SelectSheet from "@/components/SelectSheet";

const FILTERS = ["all", "pending", "confirmed", "preparing", "picked_up", "delivered", "cancelled"];
const STATUS_CLS = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-blue-500/15 text-blue-400",
  preparing: "bg-yellow-500/15 text-yellow-400",
  picked_up: "bg-purple-500/15 text-purple-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};
const NEXT = { pending: "confirmed", confirmed: "preparing", preparing: "picked_up", picked_up: "delivered" };

export default function AdminOrders({ orders, restaurants, users, drivers, onUpdate, busyId }) {
  const [f, setF] = useState("all");
  const restById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const list = f === "all" ? orders : orders.filter((o) => o.status === f);

  const approvedDrivers = drivers.filter((d) => d.is_approved);
  const driverLabel = (d) =>
    d.legal_full_name || userById[d.created_by_id]?.full_name || userById[d.created_by_id]?.email || "Driver";
  const assignedDriver = (o) => drivers.find((d) => d.created_by_id === o.driver_id);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-3">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setF(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap",
              f === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((o) => {
          const ad = assignedDriver(o);
          const isBusy = busyId === o.id;
          const canAdvance = NEXT[o.status];
          const canCancel = !["delivered", "cancelled"].includes(o.status);
          return (
            <div key={o.id} className="bg-card border border-border rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0",
                    STATUS_CLS[o.status]
                  )}
                >
                  {o.status?.replace("_", " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{restById[o.restaurant_id]?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(o.items || []).length} item(s) · {userById[o.created_by_id]?.email || "—"}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0">${(o.total_amount || 0).toFixed(2)}</span>
              </div>

              {/* Driver assignment / push */}
              <DriverPush
                order={o}
                ad={ad}
                isBusy={isBusy}
                approvedDrivers={approvedDrivers}
                driverLabel={driverLabel}
                onUpdate={onUpdate}
              />

              {/* Actions */}
              <div className="mt-2 flex gap-2">
                {canAdvance && (
                  <button
                    onClick={() => onUpdate(o.id, { status: NEXT[o.status] })}
                    disabled={isBusy}
                    className="flex-1 h-9 rounded-xl bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {o.status === "pending" ? "Confirm" : "Advance"}
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => onUpdate(o.id, { status: "cancelled", driver_id: "" })}
                    disabled={isBusy}
                    className="h-9 px-3 rounded-xl bg-red-500/15 text-red-400 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No orders.</p>}
      </div>
    </div>
  );
}

function DriverPush({ order, ad, isBusy, approvedDrivers, driverLabel, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [driverOpen, setDriverOpen] = useState(false);

  const push = () => {
    if (!pick) return;
    onUpdate(order.id, {
      driver_id: pick,
      status: order.status === "pending" ? "confirmed" : order.status,
    });
    setPick("");
    setOpen(false);
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <UserCog className="w-4 h-4 text-muted-foreground shrink-0" />
        {ad ? (
          <span className="text-xs font-medium text-foreground">
            {driverLabel(ad)} <span className="text-muted-foreground">({ad.vehicle_type})</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <button
          onClick={() => setOpen((s) => !s)}
          disabled={isBusy}
          className="ml-auto text-xs font-semibold text-primary flex items-center gap-1 px-2 h-9 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> Push to driver
        </button>
      </div>
      {open && (
        <div className="mt-2 flex items-center gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setDriverOpen(true)}
            disabled={isBusy}
            className="flex-1 h-9 rounded-xl bg-background border border-border px-2 text-xs text-left flex items-center justify-between"
          >
            <span className="truncate">
              {pick ? driverLabel(approvedDrivers.find((d) => d.created_by_id === pick)) : "Choose a driver…"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
          </button>
          <SelectSheet
            open={driverOpen}
            onOpenChange={setDriverOpen}
            value={pick}
            onChange={(v) => setPick(v)}
            options={approvedDrivers.map((d) => ({
              value: d.created_by_id,
              label: `${driverLabel(d)} · ${d.vehicle_type} · ${d.is_available ? "online" : "offline"}`,
            }))}
            placeholder="Choose a driver…"
            title="Assign Driver"
          />
          <button
            onClick={push}
            disabled={isBusy || !pick}
            className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Push
          </button>
        </div>
      )}
    </div>
  );
}