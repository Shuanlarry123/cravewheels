import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cravereel_cart";
const REF_KEY = "cravereel_ref_code";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setItems(data.items || []);
        setRestaurantId(data.restaurantId || null);
        setRestaurantName(data.restaurantName || null);
      }
    } catch {}
  }, []);

  const persist = useCallback((next, rid, rname) => {
    setItems(next);
    setRestaurantId(rid);
    setRestaurantName(rname);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: next, restaurantId: rid, restaurantName: rname }));
  }, []);

  const addItem = useCallback(
    (item, restaurant) => {
      let rid = restaurantId;
      let rname = restaurantName;
      const existing = items.find((i) => i.menu_item_id === item.id);
      if (existing) {
        const next = items.map((i) => (i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        persist(next, rid, rname);
        return { added: true };
      }
      // only single restaurant allowed
      if (rid && rid !== restaurant.id) {
        return { added: false, conflict: restaurantName };
      }
      rid = restaurant.id;
      rname = restaurant.name;
      const next = [
        ...items,
        {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          video_url: item.video_url,
        },
      ];
      persist(next, rid, rname);
      return { added: true };
    },
    [items, restaurantId, restaurantName, persist]
  );

  const updateQty = useCallback(
    (menuItemId, qty) => {
      let next;
      if (qty <= 0) {
        next = items.filter((i) => i.menu_item_id !== menuItemId);
      } else {
        next = items.map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity: qty } : i));
      }
      const rid = next.length ? restaurantId : null;
      const rname = next.length ? restaurantName : null;
      persist(next, rid, rname);
    },
    [items, restaurantId, restaurantName, persist]
  );

  const clearCart = useCallback(() => {
    persist([], null, null);
  }, [persist]);

  const replaceCart = useCallback((nextItems, restaurant) => {
    persist(nextItems || [], restaurant?.id || null, restaurant?.name || null);
  }, [persist]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        addItem,
        updateQty,
        clearCart,
        replaceCart,
        subtotal,
        count,
        deliveryFee: restaurantId ? 2.99 : 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

export const useReferral = () => {
  const [code, setCode] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref__");
    if (ref) {
      localStorage.setItem(REF_KEY, ref);
      setCode(ref);
    } else {
      setCode(localStorage.getItem(REF_KEY));
    }
  }, []);
  const clear = () => {
    localStorage.removeItem(REF_KEY);
    setCode(null);
  };
  return { code, clear };
};