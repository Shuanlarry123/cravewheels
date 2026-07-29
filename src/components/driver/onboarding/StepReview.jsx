import React from "react";
import { Loader2, CheckCircle2, FileText, Car, User, ShieldCheck } from "lucide-react";
import NavButtons from "@/components/driver/onboarding/NavButtons";

export default function StepReview({ data, onBack, onSubmit, saving }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Review & submit</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Make sure everything looks right before submitting.
      </p>

      <div className="space-y-3">
        <Section icon={User} title="Personal">
          <Row label="Name" value={data.legal_full_name} />
          <Row label="Date of birth" value={data.date_of_birth} />
          <Row label="Address" value={data.address} />
          <Row label="Phone" value={data.phone} />
        </Section>

        <Section icon={FileText} title="Driver's license">
          <Row label="Number" value={data.license_number} />
          <Row label="State" value={data.license_state} />
          <Row label="Expires" value={data.license_expiry} />
          <Row label="Front photo" value={data.license_front_url ? "Uploaded" : "—"} />
          <Row label="Back photo" value={data.license_back_url ? "Uploaded" : "—"} />
        </Section>

        {data.vehicle_type !== "bicycle" && (
          <Section icon={Car} title="Vehicle">
            <Row
              label="Vehicle"
              value={`${data.vehicle_make || ""} ${data.vehicle_model || ""} ${data.vehicle_year || ""}`.trim()}
            />
            <Row label="Color" value={data.vehicle_color} />
            <Row label="Plate" value={data.license_plate} />
            <Row label="Registration" value={data.registration_url ? "Uploaded" : "—"} />
            <Row label="Insurance" value={data.insurance_url ? "Uploaded" : "—"} />
          </Section>
        )}

        <Section icon={ShieldCheck} title="Background check">
          <Row label="SSN last 4" value={data.ssn_last4 ? "••••" : "—"} />
          <Row label="Consent" value={data.background_check_consent ? "Granted" : "Not granted"} />
        </Section>
      </div>

      <div className="flex items-start gap-2.5 mt-4 text-[11px] text-muted-foreground">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          By submitting, your ID photo will be scanned by our verification system. Your application
          goes to our admin team for final approval.
        </p>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={saving ? "Submitting..." : "Submit application"}
        nextDisabled={saving}
      />
      {saving && (
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying your ID...
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium truncate">{value || "—"}</span>
    </div>
  );
}