import React from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import NavButtons from "@/components/driver/onboarding/NavButtons";

const VEHICLES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "scooter", label: "Scooter" },
  { value: "bicycle", label: "Bicycle" },
];

export default function StepPersonal({ data, update, onNext, onBack }) {
  const valid =
    data.legal_full_name?.trim() && data.date_of_birth && data.address?.trim() && data.vehicle_type;

  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Personal information</h2>
      <p className="text-sm text-muted-foreground mb-5">This must match your government ID exactly.</p>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
            What will you deliver with?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLES.map((v) => (
              <button
                key={v.value}
                onClick={() => update({ vehicle_type: v.value })}
                type="button"
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  data.vehicle_type === v.value ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="block text-sm font-semibold">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Legal full name">
          <input
            value={data.legal_full_name || ""}
            onChange={(e) => update({ legal_full_name: e.target.value })}
            placeholder="First Middle Last"
            className={inputCls}
          />
        </Field>

        <Field label="Date of birth">
          <input
            type="date"
            value={data.date_of_birth || ""}
            onChange={(e) => update({ date_of_birth: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Residential address">
          <AddressAutocomplete
            value={data.address || ""}
            onChange={(v) => update({ address: v })}
            onPick={({ address }) => update({ address })}
            placeholder="Start typing your home address..."
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            value={data.phone || ""}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="(203) 555-0100"
            className={inputCls}
          />
        </Field>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!valid}
        disabledReason="Please complete your legal name, date of birth, and address."
      />
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