import React, { useEffect, useRef, useState } from "react";
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
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
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
  const fileRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);

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

  const saveName = async () => {
    if (!nameDraft.trim() || saving) return;
    try {
      setSaving(true);
      await base44.auth.updateMe({ full_name: nameDraft.trim() });
      setProfile((p) => ({ ...p, full_name: nameDraft.trim() }));
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

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
        {/* Profile section */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-full bg-primary/15 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary">
                {profile.profile_picture ? (
                  <Image src={profile.profile_picture} fittingType="fill" className="w-full h-full" alt="profile" />
                ) : (
                  initial
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={saving}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-50"
                aria-label="Change profile picture"
              >
                {saving && !editingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPicture} />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    placeholder="Your name"
                    maxLength={50}
                    className="flex-1 min-w-0 h-10 rounded-xl bg-background border border-border px-3 text-base font-bold"
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    disabled={saving || !nameDraft.trim()}
                    className="shrink-0 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(profile.full_name || "");
                    }}
                    disabled={saving}
                    className="shrink-0 w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNameDraft(profile.full_name || "");
                  }}
                  className="flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-left">{displayName}</h1>
                  <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}
              {profile.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{profile.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Star className="w-4 h-4 fill-primary text-primary" />
              Member
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <BadgeCheck className="w-4 h-4" />
              Verified
            </span>
          </div>
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