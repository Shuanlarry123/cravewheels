import React, { useEffect, useRef, useState } from "react";

/**
 * A draggable bottom sheet with snap points, like Uber/DoorDash.
 * Drag the handle down to collapse (reveal the map) or up to expand details.
 * snapFracs are fractions of the parent container height.
 */
export default function CollapsibleSheet({ snapFracs = [0.06, 0.42, 0.92], defaultSnap = 1, children }) {
  const ref = useRef(null);
  const [parentH, setParentH] = useState(600);
  const [snap, setSnap] = useState(defaultSnap);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const startHRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const update = () => setParentH(el.clientHeight || 600);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const snapHeights = snapFracs.map((f) => Math.round(parentH * f));
  const baseH = snapHeights[snap] ?? snapHeights[1];
  const height = Math.max(snapHeights[0], Math.min(parentH, baseH - dragY));

  const onPointerDown = (e) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHRef.current = snapHeights[snap];
    setDragY(0);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    setDragY(e.clientY - startYRef.current);
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const newH = startHRef.current - dragY;
    let best = snap;
    let bestDiff = Infinity;
    snapHeights.forEach((h, i) => {
      const d = Math.abs(h - newH);
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    });
    setSnap(best);
    setDragY(0);
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-0 inset-x-0 z-10 bg-background rounded-t-3xl border-t border-border overflow-hidden flex flex-col shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
      style={{ height, transition: dragY ? "none" : "height 0.3s cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 touch-none cursor-grab active:cursor-grabbing"
      >
        <div className="w-10 h-1.5 rounded-full bg-muted" />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-4">{children}</div>
    </div>
  );
}