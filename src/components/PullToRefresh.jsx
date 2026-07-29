import React, { forwardRef, useRef, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Wraps a scrollable container and adds pull-to-refresh functionality.
 * Forwards the ref to the inner scrollable div so IntersectionObserver etc. still work.
 */
const PullToRefresh = forwardRef(function PullToRefresh({ onRefresh, className, children }, ref) {
  const innerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const setRefs = useCallback((node) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const onTouchStart = useCallback((e) => {
    const scroller = innerRef.current;
    if (scroller && scroller.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && diff < 140) {
      setPull(diff * 0.4);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > 50) {
      setRefreshing(true);
      setPull(50);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh]);

  return (
    <>
      {(pull > 0 || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ height: `${pull}px` }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <RefreshCw
              className="w-5 h-5 text-white"
              style={{ opacity: Math.min(pull / 50, 1) }}
            />
          )}
        </div>
      )}
      <div
        ref={setRefs}
        className={className}
        style={{
          transform: `translateY(${pull}px)`,
          transition: pulling.current ? "none" : "transform 0.3s ease",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </>
  );
});

export default PullToRefresh;