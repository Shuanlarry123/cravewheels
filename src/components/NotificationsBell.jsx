import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Bell, X, Truck } from "lucide-react";

function timeAgo(dateStr) {
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const n = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 50);
      setItems(n);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Notification.subscribe(() => load());
    return unsub;
  }, [user, load]);

  const unread = items.filter((n) => !n.read).length;

  const onTap = async (n) => {
    try {
      if (!n.read) {
        await base44.entities.Notification.update(n.id, { read: true });
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 z-50 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" /> Notifications
              </h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {loading && items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onTap(n)}
                    className={`w-full text-left flex gap-3 rounded-2xl p-3 border active:scale-[0.99] transition-transform ${
                      n.read ? "bg-card border-border" : "bg-primary/10 border-primary/30"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_date)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}