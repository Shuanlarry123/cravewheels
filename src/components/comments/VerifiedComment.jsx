import React from "react";
import { BadgeCheck } from "lucide-react";
import StarRating from "@/components/comments/StarRating";
import OrderBadge from "@/components/comments/OrderBadge";

/**
 * Renders a single comment.
 * Verified CraveWheels comments show the author, a "Verified" badge, the dish
 * they ordered, their star rating, and their text. Legacy (unverified) comments
 * render plainly without the badge.
 */
export default function VerifiedComment({ comment: c, orderInfo }) {
  const verified = c.verified === true;
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
        {(c.author_name || "U")[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold">{c.author_name || "User"}</p>
          {verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified CraveWheels Order
            </span>
          )}
        </div>
        {verified && orderInfo?.[c.created_by_id]?.count > 0 && (
          <div className="mt-0.5">
            <OrderBadge info={orderInfo[c.created_by_id]} itemName={c.menu_item_name} />
          </div>
        )}
        {verified && c.rating ? (
          <StarRating value={c.rating} size={12} className="mt-1" />
        ) : null}
        <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.comment}</p>
      </div>
    </div>
  );
}