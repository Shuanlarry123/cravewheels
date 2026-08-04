import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Shield,
  ShieldCheck,
  Bike,
  Utensils,
  Sparkles,
  Zap,
  Trash2,
  LogOut,
  Receipt,
  Bookmark,
  Star,
  BadgeCheck,
  User as UserIcon,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import { Switch } from "@/components/ui/switch";
import { useLiteMode } from "@/lib/liteMode";
import { useAdminRole } from "@/lib/useAdminRole";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";

function QuickTile({ icon: Icon, label, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-start gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function NavRow({ to, icon: Icon, title, desc, badge, onClick, right }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        if (onClick) onClick();
        else if (to) navigate(to);
      }}
      className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground/80" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {badge && (
            <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {desc && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>}
      </div>
      {right || <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </button>
  );
}

function AccountInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [lite, setLite] = useLiteMode();
  const isAdmin = useAdminRole();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44
      .auth.me()
      .then((me) => {
        setProfile({
          full_name: me.full_name || "",
          email: me.email || "",
          profile_picture: me.profile_picture || "",
        });
      })
      .catch(() => {});
  }, [user]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await Promise.allSettled([
        base44.entities.DriverProfile.deleteMany({ created_by_id: user.id }),
        base44.entities.CreatorProfile.deleteMany({ created_by_id: user.id }),
      ]);
      await base44.auth.logout("/login");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
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

  const displayName = (profile.full_name || profile.email || "Member").toUpperCase();
  const initial = (profile.full_name || profile.email || "U")[0].toUpperCase();

  return (
    <CustomerLayout>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-28 min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Star className="w-4 h-4 fill-primary text-primary" />
                Member
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                <BadgeCheck className="w-4 h-4" />
                Verified
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="shrink-0 w-14 h-14 rounded-full bg-primary/15 overflow-hidden flex items-center justify-center text-xl font-bold text-primary active:scale-95 transition-transform"
          >
            {profile.profile_picture ? (
              <Image src={profile.profile_picture} fittingType="fill" className="w-full h-full" alt="profile" />
            ) : (
              initial
            )}
          </button>
        </div>

        {/* Role chip */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 mb-5 active:scale-[0.99] transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium">Customer</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Quick-access tiles */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <QuickTile icon={Receipt} label="Orders" to="/orders" />
          <QuickTile icon={Bookmark} label="Saved" to="/profile" />
          <QuickTile icon={Info} label="Help" to="/about" />
          <QuickTile icon={ShieldCheck} label="Safety" to="/privacy" />
        </div>

        {/* Navigation list */}
        <div className="space-y-2.5">
          {/* Lite Mode with toggle */}
          <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-foreground/80" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Lite Mode</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Faster on slower devices — shows thumbnails instead of autoplaying videos.
              </p>
            </div>
            <Switch checked={lite} onCheckedChange={setLite} aria-label="Toggle Lite Mode" />
          </div>

          {/* Join the platform */}
          <NavRow to="/apply/driver" icon={Bike} title="Apply as Driver" desc="Deliver food and earn on your schedule" />
          <NavRow to="/apply/restaurant" icon={Utensils} title="Apply as Restaurant" desc="List your dishes and reach hungry customers" />
          <NavRow to="/apply/influencer" icon={Sparkles} title="Apply as Influencer" desc="Share dishes and earn commission per order" badge="NEW" />

          {/* General */}
          <NavRow to="/about" icon={Info} title="About CraveReel" desc="What the platform does and how it works" />
          <NavRow to="/privacy" icon={ShieldCheck} title="Privacy & Security" desc="What data we collect and how we use GPS" />

          {/* Admin */}
          {isAdmin && (
            <NavRow to="/admin-dashboard" icon={Shield} title="Admin Dashboard" desc="Review applications & monitor performance" />
          )}

          {/* Log Out */}
          <button
            onClick={() => base44.auth.logout("/login")}
            className="w-full flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-foreground/80" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Log Out</p>
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mt-4 active:scale-[0.99] transition-transform text-left">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">Delete Account</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Permanently remove your account and all associated data.
                </p>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. You will permanently lose all order history, driver and restaurant
                profiles, creator referrals, saved dishes, likes, and comments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CustomerLayout>
  );
}

export default function Settings() {
  return (
    <CartProvider>
      <AccountInner />
    </CartProvider>
  );
}