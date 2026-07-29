import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAdminRole } from "@/lib/useAdminRole";
import { Image } from "@/components/ui/image";
import {
  Camera,
  Heart,
  Bookmark,
  Receipt,
  MessageCircle,
  Shield,
  Pencil,
  ChevronRight,
  PlayCircle,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import RestaurantOwnerProfile from "@/components/profile/RestaurantOwnerProfile";
import { CartProvider } from "@/lib/cartContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "comments", label: "Comments", icon: MessageCircle },
];

function Thumb({ item }) {
  return (
    <Link to={`/item/${item.menu_item_id}`} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card block">
      {item.thumbnail_url ? (
        <Image src={item.thumbnail_url} fittingType="fill" className="w-full h-full" alt={item.menu_item_name} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <PlayCircle className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-[10px] text-white font-medium line-clamp-1">{item.menu_item_name}</p>
        {item.price != null && <p className="text-[10px] text-primary font-bold">${Number(item.price).toFixed(2)}</p>}
      </div>
    </Link>
  );
}

function ProfileInner() {
  const { user } = useAuth();
  const isAdmin = useAdminRole();
  const [profile, setProfile] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [saved, setSaved] = useState([]);
  const [liked, setLiked] = useState([]);
  const [orders, setOrders] = useState([]);
  const [comments, setComments] = useState([]);
  const [tab, setTab] = useState("saved");
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setProfile({
          full_name: me.full_name || "",
          email: me.email || "",
          bio: me.bio || "",
          profile_picture: me.profile_picture || "",
        });
        setBioDraft(me.bio || "");
        const mine = await base44.entities.Restaurant.filter({ created_by_id: user.id });
        if (cancelled) return;
        if (mine && mine.length) {
          setRestaurant(mine[0]);
          return;
        }
        const [sv, lk, ords, cmts] = await Promise.all([
          base44.entities.Saved.filter({ created_by_id: user.id }, "-created_date", 60),
          base44.entities.Like.filter({ created_by_id: user.id }, "-created_date", 60),
          base44.entities.Order.filter({ created_by_id: user.id }, "-created_date", 60),
          base44.entities.Comment.filter({ created_by_id: user.id }, "-created_date", 60),
        ]);
        if (cancelled) return;
        setSaved(sv);
        setLiked(lk);
        setOrders(ords);
        setComments(cmts);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onPickPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      setProfile((p) => ({ ...p, profile_picture: file_url }));
      toast.success("Picture updated");
    } catch {
      toast.error("Failed to upload picture");
    } finally {
      setSaving(false);
    }
  };

  const saveBio = async () => {
    try {
      setSaving(true);
      await base44.auth.updateMe({ bio: bioDraft.trim() });
      setProfile((p) => ({ ...p, bio: bioDraft.trim() }));
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!profile)
    return (
      <CustomerLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );

  if (restaurant)
    return (
      <CustomerLayout>
        <RestaurantOwnerProfile restaurant={restaurant} />
      </CustomerLayout>
    );

  const handle = `@${(profile.full_name || profile.email || "user").replace(/\s+/g, "").toLowerCase()}`;

  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary">
              {profile.profile_picture ? (
                <Image src={profile.profile_picture} fittingType="fill" className="w-full h-full" alt="profile" />
              ) : (
                (profile.full_name || profile.email || "U")[0].toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPicture} />
          </div>

          <div className="flex-1 grid grid-cols-3 text-center">
            <div>
              <p className="text-lg font-bold">{saved.length}</p>
              <p className="text-[11px] text-muted-foreground">Saved</p>
            </div>
            <div>
              <p className="text-lg font-bold">{liked.length}</p>
              <p className="text-[11px] text-muted-foreground">Liked</p>
            </div>
            <div>
              <p className="text-lg font-bold">{orders.length}</p>
              <p className="text-[11px] text-muted-foreground">Orders</p>
            </div>
          </div>
        </div>

        <h1 className="text-lg font-bold">{profile.full_name || "Member"}</h1>
        <p className="text-sm text-muted-foreground">{handle}</p>

        {/* Bio */}
        {editing ? (
          <div className="mt-3">
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={2}
              placeholder="Add a bio..."
              className="w-full rounded-xl bg-card border border-border p-3 text-sm resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={saveBio}
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setBioDraft(profile.bio || "");
                }}
                className="h-10 px-4 rounded-xl bg-card border border-border text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-2">
            <p className="flex-1 text-sm text-muted-foreground">{profile.bio || "No bio yet."}</p>
            <button onClick={() => setEditing(true)} className="text-muted-foreground mt-0.5">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex border-b border-border">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium border-b-2 transition-colors",
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tab === "saved" &&
            (saved.length ? (
              <div className="grid grid-cols-3 gap-1.5">
                {saved.map((it) => (
                  <Thumb key={it.id} item={it} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No saved videos yet. Tap the bookmark on a video to save it.</p>
            ))}

          {tab === "liked" &&
            (liked.length ? (
              <div className="grid grid-cols-3 gap-1.5">
                {liked.map((it) => (
                  <Thumb key={it.id} item={it} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No liked videos yet. Tap the heart on a video you love.</p>
            ))}

          {tab === "orders" &&
            (orders.length ? (
              <div className="space-y-2">
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/order/${o.id}/tracking`}
                    className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{o.restaurant_name || "Restaurant"}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {o.status} · ${Number(o.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No orders yet.</p>
            ))}

          {tab === "comments" &&
            (comments.length ? (
              <div className="space-y-2">
                {comments.map((c) => (
                  <Link
                    key={c.id}
                    to={`/item/${c.menu_item_id}`}
                    className="block bg-card border border-border rounded-2xl p-3"
                  >
                    <p className="text-xs font-semibold text-primary mb-0.5">{c.menu_item_name || "Dish"}</p>
                    <p className="text-sm text-muted-foreground">{c.comment}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">No comments yet. Comment on any video from the feed.</p>
            ))}
        </div>

        {/* Footer links */}
        <div className="mt-8 space-y-2">
          {isAdmin && (
            <Link to="/admin-dashboard" className="flex items-center gap-3 bg-primary/15 border border-primary/30 rounded-2xl p-3.5 active:scale-[0.99] transition-transform">
              <Shield className="w-5 h-5 text-primary" />
              <span className="flex-1 font-medium text-sm">Admin Dashboard</span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </Link>
          )}

        </div>
      </div>
    </CustomerLayout>
  );
}

export default function Profile() {
  return (
    <CartProvider>
      <ProfileInner />
    </CartProvider>
  );
}