import React from "react";
import DocumentUpload from "@/components/driver/DocumentUpload";
import NavButtons from "@/components/driver/onboarding/NavButtons";

export default function StepLicense({ data, update, onNext, onBack }) {
  const valid =
    data.license_number?.trim() && data.license_state?.trim() && data.license_expiry && data.license_front_url;

  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Driver's license</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Upload a clear photo of your license. We verify it's genuine and not expired.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="License number">
            <input
              value={data.license_number || ""}
              onChange={(e) => update({ license_number: e.target.value })}
              placeholder="DL-1234567"
              className={inputCls}
            />
          </Field>
          <Field label="State issued">
            <input
              value={data.license_state || ""}
              onChange={(e) => update({ license_state: e.target.value.toUpperCase().slice(0, 2) })}
              placeholder="CT"
              maxLength={2}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Expiration date">
          <input
            type="date"
            value={data.license_expiry || ""}
            onChange={(e) => update({ license_expiry: e.target.value })}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <DocumentUpload
            label="License — front"
            value={data.license_front_url}
            onChange={(v) => update({ license_front_url: v })}
            hint="Photo of the front"
          />
          <DocumentUpload
            label="License — back"
            value={data.license_back_url}
            onChange={(v) => update({ license_back_url: v })}
            hint="Photo of the back"
          />
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Use good lighting, no glare. We never share your ID.
        </p>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-card border border-border text-sm outline-none focus:border-primary";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}