import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import StepWelcome from "@/components/driver/onboarding/StepWelcome";
import StepPersonal from "@/components/driver/onboarding/StepPersonal";
import StepLicense from "@/components/driver/onboarding/StepLicense";
import StepVehicle from "@/components/driver/onboarding/StepVehicle";
import StepPhoto from "@/components/driver/onboarding/StepPhoto";
import StepBackground from "@/components/driver/onboarding/StepBackground";
import StepReview from "@/components/driver/onboarding/StepReview";

const STEPS = ["welcome", "personal", "license", "vehicle", "photo", "background", "review"];

export default function DriverOnboarding({ userId, onCreated }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ vehicle_type: "car" });

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const goNext = () => {
    setStep((s) => {
      const nxt = s + 1;
      if (nxt === 3 && data.vehicle_type === "bicycle") return 4;
      return Math.min(nxt, STEPS.length - 1);
    });
  };
  const goBack = () => {
    setStep((s) => {
      const prev = s - 1;
      if (prev === 3 && data.vehicle_type === "bicycle") return 2;
      return Math.max(prev, 0);
    });
  };

  const submit = async () => {
    setSaving(true);
    try {
      const created = await base44.entities.DriverProfile.create({
        vehicle_type: data.vehicle_type,
        license_number: data.license_number,
        legal_full_name: data.legal_full_name,
        date_of_birth: data.date_of_birth,
        address: data.address,
        phone: data.phone,
        license_state: data.license_state,
        license_expiry: data.license_expiry,
        license_front_url: data.license_front_url,
        license_back_url: data.license_back_url,
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_year: Number(data.vehicle_year) || null,
        vehicle_color: data.vehicle_color,
        license_plate: data.license_plate,
        registration_url: data.registration_url,
        insurance_url: data.insurance_url,
        profile_photo_url: data.profile_photo_url,
        ssn_last4: data.ssn_last4,
        background_check_consent: data.background_check_consent,
        consent_date: new Date().toISOString(),
        is_available: false,
        is_approved: false,
        application_status: "submitted",
        id_verification_status: "pending",
        background_check_status: "pending",
        total_earnings: 0,
        total_deliveries: 0,
        rating: 5,
      });

      try {
        const res = await base44.functions.invoke("verifyDriverId", {
          license_front_url: data.license_front_url,
          license_back_url: data.license_back_url,
        });
        const v = res.data?.verification;
        if (v) {
          await base44.entities.DriverProfile.update(created.id, {
            id_verification_status: v.is_valid ? "verified" : "rejected",
            id_verification_notes: v.notes || "",
            id_verification_confidence: v.confidence,
            extracted_name: v.extracted_name,
            extracted_license_number: v.extracted_license_number,
          });
        }
      } catch {
        /* admin can re-verify later */
      }

      toast.success("Application submitted — pending verification");
      onCreated(created);
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen">
      {step > 0 && (
        <div className="mb-6">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Step {step} of {STEPS.length - 1}
          </span>
          <div className="h-1.5 rounded-full bg-card overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {step === 0 && <StepWelcome onNext={goNext} />}
      {step === 1 && <StepPersonal data={data} update={update} onNext={goNext} onBack={goBack} />}
      {step === 2 && <StepLicense data={data} update={update} onNext={goNext} onBack={goBack} />}
      {step === 3 && <StepVehicle data={data} update={update} onNext={goNext} onBack={goBack} />}
      {step === 4 && <StepPhoto data={data} update={update} onNext={goNext} onBack={goBack} />}
      {step === 5 && <StepBackground data={data} update={update} onNext={goNext} onBack={goBack} />}
      {step === 6 && (
        <StepReview data={data} onBack={goBack} onSubmit={submit} saving={saving} />
      )}
    </div>
  );
}