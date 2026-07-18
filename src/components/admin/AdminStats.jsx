import React from "react";
import { Store, Bike, ShoppingBag, DollarSign, Clock, Users } from "lucide-react";

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${accent}`}>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AdminStats({ restaurants, drivers, orders, revenue }) {
  const pendingRestaurants = restaurants.filter((r) => !r.is_approved).length;
  const pendingDrivers = drivers.filter((d) => !d.is_approved).length;

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      <Stat icon={Store} label="Restaurants" value={restaurants.length} accent="bg-primary/15" />
      <Stat icon={Clock} label="Rest. Pending" value={pendingRestaurants} accent="bg-yellow-500/15" />
      <Stat icon={Bike} label="Drivers" value={drivers.length} accent="bg-primary/15" />
      <Stat icon={Users} label="Driver Pending" value={pendingDrivers} accent="bg-yellow-500/15" />
      <Stat icon={ShoppingBag} label="Orders" value={orders.length} accent="bg-primary/15" />
      <Stat icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(0)}`} accent="bg-green-500/15" />
    </div>
  );
}