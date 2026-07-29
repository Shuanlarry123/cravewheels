import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useOrderedItems } from "@/lib/useOrderedItems";
import { X, Utensils } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const REACTIONS = [
  { key: "loved", emoji: "🔥", label: "Loved it" },
  { key: "good", emoji: "👍", label: "Good" },
  { key: "average", emoji: "😐", label: "Average" },
  { key: "not_worth", emoji: "👎", label: "Not worth it" },
];

/**
 * "I Tried It" — a quick post-delivery reaction picker.
 * Only shown to customers who ordered (and received) this dish via CraveWheels.
 * Records one reaction per user (re-picking updates it) and shows a live tally.
 */
export default function TriedItButton({ itemId, itemName, restaurantId }) {
  const { user } = useAuth();
  const orderedIds = useOrderedItems();
  const canUse = !!orderedIds?.has(itemId);
  const [records, setRecords] = useState([]);
  const [mine, setMine] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const all = await base44.entities.TriedIt.filter({ menu_item_id: itemId }, "-created_date", 500);
      setRecords(all);
      setMine(user ? all.find((r) => r.created_by_id === user.id) || null : null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (canUse) load();
  }, [canUse, itemId, user?.id]);

  if (!canUse) return null;

  const countFor = (key) => records.filter((x) => x.reaction === key).length;
  const myReaction = REACTIONS.find((r) => r.key === mine?.reaction);

  const pick = async (key) => {
    if (!user || saving) return;
    setSaving(true);
    try {
      if (mine) {
        const updated = await base44.entities.TriedIt.update(mine.id, { reaction: key });
        setMine(updated);
        setRecords((rs) => rs.map((r) => (r.id === mine.id ? updated : r)));
      } else {
        const created = await base44.entities.TriedIt.create({
          menu_item_id: itemId,
          menu_item_name: itemName,
          restaurant_id: restaurantId,
          author_name: user.full_name || user.email,
          reaction: key,
        });
        setMine(created);
        setRecords((rs) => [created, ...rs]);
      }
      setOpen(false);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Failed to save reaction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
      >
        <span
          className={cn(
            "w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-2xl leading-none",
            myReaction && "ring-2 ring-primary"
          )}
        >
          {myReaction ? myReaction.emoji : <Utensils className="w-6 h-6 text-white" />}
        </span>
        <span className="text-white text-xs font-medium">{myReaction ? myReaction.label : "Tried It"}</span>
      </button>

      {open && (
        <div className="absolute right-full mr-2 top-0 z-30 w-56 bg-card border border-border rounded-2xl p-3 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">How was it?</span>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-1.5">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                disabled={saving}
                onClick={() => pick(r.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl px-3 h-11 text-sm font-medium active:scale-[0.98] transition-transform",
                  mine?.reaction === r.key ? "bg-primary/15 text-primary" : "bg-background"
                )}
              >
                <span className="text-xl">{r.emoji}</span>
                <span>{r.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{countFor(r.key)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}