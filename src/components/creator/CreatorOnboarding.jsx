import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CreatorOnboarding({ onCreated }) {
  const [code, setCode] = useState(generateCode());
  const [bio, setBio] = useState("");
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!code.trim()) {
      toast.error("Referral code is required");
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.CreatorProfile.create({
        referral_code: code.trim(),
        bio,
        social_handle: handle,
        status: "pending",
      });
      toast.success("Creator profile created — pending approval");
      onCreated(created);
    } catch {
      toast.error("Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-11 rounded-xl bg-background border border-border px-3 text-sm";

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Become a Creator</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Share dishes, earn commission on every order placed with your code.
      </p>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div>
          <span className="text-xs text-muted-foreground">Referral code</span>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} />
            <button
              onClick={() => setCode(generateCode())}
              className="shrink-0 px-3 rounded-xl bg-primary/15 text-primary text-xs font-semibold"
            >
              New
            </button>
          </div>
        </div>
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Social handle (e.g. @foodie)" className={inputCls} />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={3} className="w-full rounded-xl bg-background border border-border p-3 text-sm" />
        <button
          onClick={submit}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create creator profile"}
        </button>
      </div>
    </div>
  );
}