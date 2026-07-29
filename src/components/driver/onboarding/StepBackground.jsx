import React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import NavButtons from "@/components/driver/onboarding/NavButtons";

export default function StepBackground({ data, update, onNext, onBack }) {
  const valid = (data.ssn_last4 || "").length === 4 && data.background_check_consent;

  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Background check</h2>
      <p className="text-sm text-muted-foreground mb-5">
        We use the last 4 of your SSN to verify your identity for a background check.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Last 4 digits of SSN
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={data.ssn_last4 || ""}
              onChange={(e) =>
                update({ ssn_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="••••"
              className="w-full h-12 pl-10 pr-4 rounded-2xl bg-card border border-border text-sm tracking-[0.3em] outline-none focus:border-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            We never store your full SSN — only the last 4 digits.
          </p>
        </div>

        <label className="flex items-start gap-3 bg-card border border-border rounded-2xl p-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.background_check_consent}
            onChange={(e) => update({ background_check_consent: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-primary shrink-0"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I authorize CraveReel to conduct a background check and review my motor vehicle record.
            I confirm all information and documents I provided are accurate and belong to me.
            I understand that providing false information will result in permanent removal.
          </span>
        </label>

        <div className="flex items-start gap-2.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            Your data is encrypted and used only for verification. Background checks are processed by
            CraveReel's compliance team.
          </p>
        </div>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to review"
        nextDisabled={!valid}
        disabledReason="Enter the last 4 digits of your SSN and check the consent box."
      />
    </div>
  );
}