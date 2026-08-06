import { useEffect, useState } from "react";

/**
 * Manages customer selections for a menu item's modifier groups.
 * Returns { sel, toggle, modifiers, unitPrice, valid }.
 *  - sel: { [groupIndex]: name (single) | string[] (multi) }
 *  - modifiers: flat list of { title, name, price } the customer chose
 *  - unitPrice: base price + sum of chosen modifier prices
 *  - valid: true unless a required group has no selection
 */
export function useItemCustomizer(basePrice, groups) {
  const groupsArr = Array.isArray(groups) ? groups : [];
  const sig = JSON.stringify(
    groupsArr.map((g) => ({
      t: g.title,
      type: g.type,
      req: !!g.required,
      opts: (g.options || []).map((o) => `${o.name}:${o.price || 0}:${o.default ? 1 : 0}`),
    }))
  );

  const [sel, setSel] = useState({});

  useEffect(() => {
    if (!groupsArr.length) {
      setSel({});
      return;
    }
    const init = {};
    groupsArr.forEach((g, gi) => {
      if (g.type === "single") {
        const def = (g.options || []).find((o) => o.default);
        init[gi] = def ? def.name : null;
      } else {
        init[gi] = (g.options || []).filter((o) => o.default).map((o) => o.name);
      }
    });
    setSel(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const toggle = (gi, name, multi) => {
    setSel((prev) => {
      const cur = prev[gi];
      if (multi) {
        const arr = Array.isArray(cur) ? cur : [];
        return { ...prev, [gi]: arr.includes(name) ? arr.filter((n) => n !== name) : [...arr, name] };
      }
      return { ...prev, [gi]: cur === name ? null : name };
    });
  };

  const modifiers = [];
  groupsArr.forEach((g, gi) => {
    const cur = sel[gi];
    const names = g.type === "single" ? (cur ? [cur] : []) : Array.isArray(cur) ? cur : [];
    names.forEach((n) => {
      const opt = (g.options || []).find((o) => o.name === n);
      if (opt) modifiers.push({ title: g.title, name: opt.name, price: Number(opt.price) || 0 });
    });
  });

  const delta = modifiers.reduce((s, m) => s + (m.price || 0), 0);
  const unitPrice = (Number(basePrice) || 0) + delta;

  let valid = true;
  groupsArr.forEach((g, gi) => {
    if (g.required) {
      const cur = sel[gi];
      const cnt = g.type === "single" ? (cur ? 1 : 0) : Array.isArray(cur) ? cur.length : 0;
      if (cnt < 1) valid = false;
    }
  });

  return { sel, toggle, modifiers, unitPrice, valid };
}