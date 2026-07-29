import React from "react";
import DocumentUpload from "@/components/driver/DocumentUpload";
import NavButtons from "@/components/driver/onboarding/NavButtons";

export default function StepVehicle({ data, update, onNext, onBack }) {
  const valid =
    data.vehicle_make?.trim() &&
    data.vehicle_model?.trim() &&
    data.vehicle_year &&
    data.vehicle_color?.trim() &&
    data.license_plate?.trim() &&
    data.registration_url &&
    data.insurance_url;

  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Vehicle & insurance</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Register your {data.vehicle_type} and upload proof of registration and insurance.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make">
            <input
              value={data.vehicle_make || ""}
              onChange={(e) => update({ vehicle_make: e.target.value })}
              placeholder="Toyota"
              className={inputCls}
            />
          </Field>
          <Field label="Model">
            <input
              value={data.vehicle_model || ""}
              onChange={(e) => update({ vehicle_model: e.target.value })}
              placeholder="Camry"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input
              type="number"
              value={data.vehicle_year || ""}
              onChange={(e) => update({ vehicle_year: e.target.value })}
              placeholder="2021"
              className={inputCls}
            />
          </Field>
          <Field label="Color">
            <input
              value={data.vehicle_color || ""}
              onChange={(e) => update({ vehicle_color: e.target.value })}
              placeholder="Silver"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="License plate">
          <input
            value={data.license_plate || ""}
              onChange={(e) => update({ license_plate: e.target.value.toUpperCase() })}
            placeholder="ABC-1234"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <DocumentUpload
            label="Registration"
            value={data.registration_url}
            onChange={(v) => update({ registration_url: v })}
            hint="Vehicle registration card"
          />
          <DocumentUpload
            label="Insurance"
            value={data.insurance_url}
            onChange={(v) => update({ insurance_url: v })}
            hint="Proof of auto insurance"
          />
        </div>
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