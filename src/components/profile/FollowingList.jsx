import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Store } from "lucide-react";
import { Image } from "@/components/ui/image";

/**
 * Grid of restaurants the current user follows. Shown in the customer Profile.
 */
export default function FollowingList() {
  const [follows, setFollows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await base44.auth.me();
        const mine = await base44.entities.Follow.filter({ created_by_id: user.id }, "-created_date", 200);
        if (!cancelled) setFollows(mine);
      } catch {
        if (!cancelled) setFollows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!follows) return <p className="text-center text-sm text-muted-foreground py-10">Loading…</p>;
  if (!follows.length)
    return (
      <p className="text-center text-sm text-muted-foreground py-10">
        Not following any restaurants yet. Open a restaurant and tap Follow.
      </p>
    );

  return (
    <div className="grid grid-cols-3 gap-2">
      {follows.map((f) => (
        <Link
          key={f.id}
          to={`/restaurant/${f.restaurant_id}`}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-border bg-card active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
            {f.restaurant_logo_url ? (
              <Image src={f.restaurant_logo_url} fittingType="fill" className="w-full h-full" />
            ) : (
              <Store className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-center line-clamp-1 w-full">{f.restaurant_name || "Restaurant"}</span>
        </Link>
      ))}
    </div>
  );
}