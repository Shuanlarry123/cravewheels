import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns a Set of menu_item_ids the current user has had delivered via CraveWheels.
 * - `null` while loading (caller should treat as "not yet verified").
 * - Empty Set if the user has no delivered orders containing menu items.
 *
 * Used to gate "Verified CraveWheels Comments": only customers who actually
 * ordered (and received) a dish may comment on its video.
 */
export function useOrderedItems() {
  const { user } = useAuth();
  const [orderedIds, setOrderedIds] = useState(null);

  useEffect(() => {
    if (!user) {
      setOrderedIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orders = await base44.entities.Order.filter(
          { created_by_id: user.id },
          "-created_date",
          200
        );
        if (cancelled) return;
        const ids = new Set();
        orders
          .filter((o) => o.status === "delivered")
          .forEach((o) =>
            (o.items || []).forEach((it) => {
              if (it?.menu_item_id) ids.add(it.menu_item_id);
            })
          );
        setOrderedIds(ids);
      } catch {
        if (!cancelled) setOrderedIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return orderedIds;
}

/**
 * Returns whether the current user has bought (any non-cancelled order) from a
 * given restaurant — powers buyer-only reviews and the verified-comment badge
 * on the For You feed.
 * - `null` while loading (caller should treat as "not yet verified").
 * - `boolean` once resolved.
 */
export function useOrderedFromRestaurant(restaurantId) {
  const { user } = useAuth();
  const [bought, setBought] = useState(null);

  useEffect(() => {
    if (!user || !restaurantId) {
      setBought(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const orders = await base44.entities.Order.filter(
          { created_by_id: user.id, restaurant_id: restaurantId },
          "-created_date",
          200
        );
        if (cancelled) return;
        setBought(orders.some((o) => o.status !== "cancelled"));
      } catch {
        if (!cancelled) setBought(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, restaurantId]);

  return bought;
}