import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ChevronRight,
  Info,
  ShieldCheck,
  Wallet,
  History,
  Bike,
  Star,
  BadgeCheck,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  ArrowLeftRight,
  Trash2,
  LogOut,
} from "lucide-react";
import DriverLayout from "@/components/DriverLayout";
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

const VEHICLES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "scooter", label: "Scooter" },
];

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

export default function DriverSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState("car");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setAccount({
          full_name: u.full_name || "",
          email: u.email || "",
          profile_picture: u.profile_picture || "",
        });
        const profs = await base44.entities.DriverProfile.filter({});
        const mine = profs.find((p) => p.created_by_id === u.id) || null;
        setProfile(mine);
        setVehicle(mine?.vehicle_type || "car");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const onPickPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSavingPhoto(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      setAccount((a) => ({ ...a, profile_picture: file_url }));
      toast.success("Picture updated");
    } catch {
      toast.error("Failed to upload picture");
    } finally {
      setSavingPhoto(false);
    }
  };

  const saveName = async () => {
    if (!nameDraft.trim() || savingName) return;
    try {
      setSavingName(true);
      await base44.auth.updateMe({ full_name: nameDraft.trim() });
      setAccount((a) => ({ ...a, full_name: nameDraft.trim() }));
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const saveVehicle = async () => {
    if (!profile) return;
    setSavingVehicle(true);
    try {
      await base44.entities.DriverProfile.update(profile.id, { vehicle_type: vehicle });
      setProfile({ ...profile, vehicle_type: vehicle });
      toast.success("Vehicle updated");
    } catch {
      toast.error("Failed to update vehicle");
    } finally {
      setSavingVehicle(false);
    }
  };

  const goCustomer = async () => {
    setSwitching(true);
    try {
      await base44.auth.updateMe({ role: "customer" });
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setSwitching(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.entities.DriverProfile.deleteMany({ created_by_id: user.id });
      await base44.auth.updateMe({ role: "customer" });
      navigate("/");
    } catch {
      toast.error("Failed to delete driver account");
      setDeleting(false);
    }
  };

  if (!user || !account)
    return (
      <DriverLayout>
        <div className="h-[100dvh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );

  const displayName = (account.full_name || account.email || "Driver").toUpperCase();
  const initial = (account.full_name || account.email || "D")[0].toUpperCase();
  const rating = profile?.rating ?? 5;
  const approved = profile?.is_approved;

  return (
    <DriverLayout>
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-28 min-h-screen">
        {/* Profile section */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-[72px] h-[72px] rounded-full bg-primary/15 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary">
                {account.profile_picture ? (
                  <img src={account.profile_picture} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={savingPhoto}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-50"
                aria-label="Change profile picture"
              >
                {savingPhoto && !editingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-4 h-4" />}
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
                    disabled={savingName || !nameDraft.trim()}
                    className="shrink-0 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(account.full_name || "");
                    }}
                    disabled={savingName}
                    className="shrink-0 w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNameDraft(account.full_name || "");
                  }}
                  className="flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-left">{displayName}</h1>
                  <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}
              {account.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{account.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <span className={"inline-flex items-center gap-1 text-sm font-medium " + (approved ? "text-green-400" : "text-amber-300")}>
              <BadgeCheck className="w-4 h-4" />
              {approved ? "Approved Driver" : "Pending Approval"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Quick-access tiles */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <QuickTile icon={Wallet} label="Earnings" to="/driver/earnings" />
          <QuickTile icon={History} label="History" to="/driver/history" />
          <QuickTile icon={Info} label="Help" to="/about" />
          <QuickTile icon={ShieldCheck} label="Safety" to="/privacy" />
        </div>

        {/* Navigation list */}
        <div className="space-y-2.5">
          {/* Vehicle type */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5 text-foreground/80" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Vehicle Type</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {profile?.vehicle_make ? `${profile.vehicle_make} ${profile.vehicle_model || ""}`.trim() : "Choose your vehicle"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVehicle(v.value)}
                  className={"py-2 rounded-lg border text-xs font-medium transition-all " + (vehicle === v.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground")}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {vehicle !== profile?.vehicle_type && (
              <button
                onClick={saveVehicle}
                disabled={savingVehicle}
                className="w-full mt-3 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {savingVehicle ? "Saving..." : "Save Vehicle"}
              </button>
            )}
          </div>

          {/* General */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 px-1">
            General
          </p>
          <NavRow to="/about" icon={Info} title="About Cravewheels" desc="What the platform does and how it works" />
          <NavRow to="/privacy" icon={ShieldCheck} title="Privacy & Security" desc="What data we collect and how we use GPS" />

          {/* Switch mode */}
          <NavRow
            icon={ArrowLeftRight}
            title="Switch to Customer Mode"
            desc="Return to the customer app"
            onClick={switching ? undefined : goCustomer}
            right={
              switching ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )
            }
          />

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
                <p className="text-sm font-semibold text-red-500">Delete Driver Account</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Permanently remove your driver profile and return to customer mode.
                </p>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your driver account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your driver profile, vehicle information, and delivery history. Your customer
                account will remain active.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {deleting ? "Deleting..." : "Delete Driver Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DriverLayout>
  );
}