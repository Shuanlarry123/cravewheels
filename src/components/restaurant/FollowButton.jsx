import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { UserPlus, UserCheck } from "lucide-react";

/**
 * Follow / Following toggle for a restaurant, with live follower count.
 * Works on a public app — if the viewer isn't logged in, follow prompts login.
 */
export default function FollowButton({ restaurantId, restaurantName, restaurantLogoUrl }) {
  const [me, setMe] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = null;
      try {
        user = await base44.auth.me();
        if (!cancelled) setMe(user);
      } catch {
        /* public/unauthenticated viewer */
      }
      try {
        const all = await base44.entities.Follow.filter({ restaurant_id: restaurantId }, "-created_date", 1000);
        if (cancelled) return;
        setFollowers(all.length);
        if (user) setFollowing(!!all.find((f) => f.created_by_id === user.id));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const toggle = async () => {
    if (!me) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setBusy(true);
    try {
      if (following) {
        const mine = await base44.entities.Follow.filter(
          { restaurant_id: restaurantId, created_by_id: me.id },
          "-created_date",
          5
        );
        if (mine[0]) await base44.entities.Follow.delete(mine[0].id);
        setFollowing(false);
        setFollowers((n) => Math.max(0, n - 1));
      } else {
        await base44.entities.Follow.create({
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          restaurant_logo_url: restaurantLogoUrl,
        });
        setFollowing(true);
        setFollowers((n) => n + 1);
        toast.success(`Following ${restaurantName || "restaurant"}`);
      }
    } catch {
      toast.error("Could not update follow");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={toggle}
        disabled={busy || loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          following ? "bg-secondary text-secondary-foreground border border-border" : "bg-primary text-primary-foreground"
        }`}
      >
        {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        {following ? "Following" : "Follow"}
      </button>
      <span className="text-xs text-muted-foreground">
        {followers} {followers === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}