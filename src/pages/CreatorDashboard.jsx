import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Sparkles } from "lucide-react";
import CreatorOnboarding from "@/components/creator/CreatorOnboarding";
import CreatorStats from "@/components/creator/CreatorStats";
import CreatorShares from "@/components/creator/CreatorShares";
import { toast } from "react-hot-toast";

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadShares = useCallback(async (uid) => {
    setShares(await base44.entities.CreatorShare.filter({ creator_id: uid }, "-earnings", 50));
  }, []);

  useEffect(() => {
    let uid = null;
    (async () => {
      try {
        const u = await base44.auth.me();
        uid = u.id;
        const profs = await base44.entities.CreatorProfile.filter({});
        const mine = profs.find((p) => p.created_by_id === u.id);
        setProfile(mine || null);
        if (mine) await loadShares(u.id);
      } catch {
        toast.error("Failed to load creator dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground m-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <CreatorOnboarding onCreated={setProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ChevronLeft className="w-4 h-4" /> Back to feed
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Track your referrals & earnings</p>

        <div className="space-y-4">
          <CreatorStats profile={profile} />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
              Shared Dishes ({shares.length})
            </h2>
            <CreatorShares shares={shares} />
          </div>
        </div>
      </div>
    </div>
  );
}