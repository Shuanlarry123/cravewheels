import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cravewheels_cart";
const REF_KEY = "cravewheels_ref_code";

export function signatureFor(modifiers) {
  if (!modifiers || !modifiers.length) return "";
  return modifiers
    .map((m) => `${m.title}::${m.name}`)
    .sort()
    .join("|");
}

function lineIdFor(itemId, modifiers) {
  const sig = signatureFor(modifiers);
  return sig ? `${itemId}#${sig}` : itemId;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setItems((data.items || []).map((i) => ({ ...i, lineId: i.lineId || i.menu_item_id })));
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
    (item, restaurant, qty = 1, modifiers = []) => {
      const lineId = lineIdFor(item.id, modifiers);
      const mods = (modifiers || []).map((m) => ({ title: m.title, name: m.name, price: Number(m.price) || 0 }));
      const unitPrice = (Number(item.price) || 0) + mods.reduce((s, m) => s + (m.price || 0), 0);
      const existing = items.find((i) => (i.lineId || i.menu_item_id) === lineId);
      if (existing) {
        const next = items.map((i) =>
          (i.lineId || i.menu_item_id) === lineId ? { ...i, quantity: i.quantity + qty } : i
        );
        persist(next, restaurantId, restaurantName);
        return { added: true };
      }
      if (restaurantId && restaurantId !== restaurant.id) {
        return { added: false, conflict: restaurantName };
      }
      const next = [
        ...items,
        {
          lineId,
          menu_item_id: item.id,
          name: item.name,
          price: unitPrice,
          basePrice: item.price,
          modifiers: mods,
          quantity: qty,
          video_url: item.video_url,
        },
      ];
      persist(next, restaurant.id, restaurant.name);
      return { added: true };
    },
    [items, restaurantId, restaurantName, persist]
  );

  const updateQty = useCallback(
    (lineId, qty) => {
      let next;
      if (qty <= 0) {
        next = items.filter((i) => (i.lineId || i.menu_item_id) !== lineId);
      } else {
        next = items.map((i) => ((i.lineId || i.menu_item_id) === lineId ? { ...i, quantity: qty } : i));
      }
      const rid = next.length ? restaurantId : null;
      const rname = next.length ? restaurantName : null;
      persist(next, rid, rname);
    },
    [items, restaurantId, restaurantName, persist]
  );

  const clearCart = useCallback(() => persist([], null, null), [persist]);

  const replaceCart = useCallback(
    (nextItems, restaurant) => persist(nextItems || [], restaurant?.id || null, restaurant?.name || null),
    [persist]
  );

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