import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  ShieldCheck,
  Bike,
  Utensils,
  Sparkles,
  Zap,
  Trash2,
} from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { CartProvider } from "@/lib/cartContext";
import { Switch } from "@/components/ui/switch";
import { useLiteMode } from "@/lib/liteMode";
import { useAdminRole } from "@/lib/useAdminRole";
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

function Row({ to, icon: Icon, title, desc }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

function SettingsInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [lite, setLite] = useLiteMode();
  const isAdmin = useAdminRole();
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!user)
    return (
      <CustomerLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </CustomerLayout>
    );

  return (
    <CustomerLayout>
      <div className="px-4 pt-8 pb-24 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">General</h2>
        <div className="space-y-3 mb-6">
          <Row to="/about" icon={Info} title="About CraveReel" desc="What the platform does and how it works." />
          <Row to="/privacy" icon={ShieldCheck} title="Privacy & Security" desc="What data we collect and how we use GPS." />
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">Performance</h2>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Lite Mode</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Faster on slower devices. Shows dish thumbnails instead of autoplaying videos and skips AI ranking.
            </p>
          </div>
          <Switch checked={lite} onCheckedChange={setLite} aria-label="Toggle Lite Mode" />
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
          Join the platform
        </h2>
        <div className="space-y-3 mb-6">
          <Row to="/apply/driver" icon={Bike} title="Apply as Driver" desc="Deliver food and earn on your schedule." />
          <Row to="/apply/restaurant" icon={Utensils} title="Apply as Restaurant" desc="List your dishes and reach hungry customers." />
          <Row to="/apply/influencer" icon={Sparkles} title="Apply as Influencer" desc="Share dishes and earn commission per order." />
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Review applications & monitor performance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
          To switch between Browsing, Driver, Restaurant, or Influencer mode, log out and choose your role
          on the login screen.
        </p>

        <h2 className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-2 px-1 mt-8">Danger Zone</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 active:scale-[0.99] transition-transform text-left">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-500">Delete Account</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Permanently remove your account and all associated data.</p>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. You will permanently lose all order history, driver and restaurant profiles, creator referrals, saved dishes, likes, and comments.
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
      <SettingsInner />
    </CartProvider>
  );
}