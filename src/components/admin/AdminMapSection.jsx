import React, { useState } from "react";
import { Store, Users, Package, Bike } from "lucide-react";
import AdminLiveMap from "./AdminLiveMap";
import RestaurantPreview from "./RestaurantPreview";
import UserPreview from "./UserPreview";
import DeliveryPreview from "./DeliveryPreview";

const ACTIVE = ["confirmed", "preparing", "picked_up"];

function Count({ icon: Icon, label, value, color }) {
  return (
    <div className="flex-1 bg-card/90 border border-border rounded-xl p-2 flex items-center gap-2">
      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

function Legend({ emoji, color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: color }}>
        {emoji}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export default function AdminMapSection({ data }) {
  const { restaurants, drivers, orders, users, token } = data;
  const [active, setActive] = useState(null);

  const restaurantById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const driverByUserId = Object.fromEntries(drivers.map((d) => [d.created_by_id, d]));

  const approvedRestaurants = restaurants.filter(
    (r) => r.is_approved && r.latitude != null && r.longitude != null
  );
  const activeOrders = orders.filter((o) => ACTIVE.includes(o.status));
  const activeDriverUserIds = new Set(activeOrders.map((o) => o.driver_id).filter(Boolean));
  const onlineDrivers = drivers.filter(
    (d) =>
      d.latitude != null &&
      d.longitude != null &&
      (d.is_available || activeDriverUserIds.has(d.created_by_id))
  );

  const mapDeliveries = activeOrders
    .map((o) => {
      const r = restaurantById[o.restaurant_id];
      const drv = driverByUserId[o.driver_id];
      return {
        ...o,
        restaurant: r,
        driver: drv,
        customer: usersById[o.created_by_id],
        // Follow the assigned driver's live position once picked up; otherwise
        // show the delivery at the restaurant (pickup) location.
        latitude: drv?.latitude ?? r?.latitude ?? o.latitude,
        longitude: drv?.longitude ?? r?.longitude ?? o.longitude,
      };
    })
    .filter((o) => o.latitude != null && o.longitude != null);

  const customerMap = {};
  activeOrders.forEach((o) => {
    const cid = o.created_by_id;
    if (cid && !customerMap[cid]) {
      customerMap[cid] = {
        user: usersById[cid],
        order: o,
        restaurant: restaurantById[o.restaurant_id],
        latitude: o.latitude,
        longitude: o.longitude,
      };
    }
  });
  const mapUsers = Object.values(customerMap).filter((u) => u.latitude != null && u.longitude != null);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0">
        {token ? (
          <AdminLiveMap
            token={token}
            restaurants={approvedRestaurants}
            drivers={onlineDrivers}
            users={mapUsers}
            deliveries={mapDeliveries}
            onSelectRestaurant={(r) => setActive({ type: "restaurant", data: r })}
            onSelectUser={(u) => setActive({ type: "user", data: u })}
            onSelectDelivery={(o) => setActive({ type: "delivery", data: o })}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Loading map…</div>
        )}
      </div>

      <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-background/90 to-transparent pb-8">
        <div className="flex gap-2">
          <Count icon={Store} label="Restaurants" value={approvedRestaurants.length} color="#FF6B2C" />
          <Count icon={Bike} label="Active drivers" value={onlineDrivers.length} color="#22c55e" />
          <Count icon={Users} label="Active Users" value={mapUsers.length} color="#a855f7" />
          <Count icon={Package} label="Deliveries" value={mapDeliveries.length} color="#3b82f6" />
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-10 bg-card/90 border border-border rounded-xl p-2 space-y-1 text-[11px]">
        <Legend emoji="🍴" color="#FF6B2C" label="Restaurant — tap to view" />
        <Legend emoji="👤" color="#a855f7" label="Active user — tap to view" />
        <Legend emoji="📦" color="#3b82f6" label="Ongoing delivery — tap to view" />
        <Legend emoji="🛵" color="#22c55e" label="Online driver" />
      </div>

      {active?.type === "restaurant" && <RestaurantPreview restaurant={active.data} onClose={() => setActive(null)} />}
      {active?.type === "user" && <UserPreview data={active.data} onClose={() => setActive(null)} />}
      {active?.type === "delivery" && <DeliveryPreview data={active.data} onClose={() => setActive(null)} />}
    </div>
  );
}