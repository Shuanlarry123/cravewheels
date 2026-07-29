import React from "react";
import DocumentUpload from "@/components/driver/DocumentUpload";
import NavButtons from "@/components/driver/onboarding/NavButtons";

export default function StepPhoto({ data, update, onNext, onBack }) {
  const valid = data.profile_photo_url;
  return (
    <div>
      <h2 className="text-lg font-bold mb-1">Profile photo</h2>
      <p className="text-sm text-muted-foreground mb-5">
        This appears on deliveries so restaurants and customers recognize you.
      </p>
      <div className="flex flex-col items-center gap-4">
        <div className="w-28 h-28">
          <DocumentUpload
            label="Your photo"
            value={data.profile_photo_url}
            onChange={(v) => update({ profile_photo_url: v })}
          />
        </div>
      </div>
      <ul className="text-[11px] text-muted-foreground space-y-1 mt-4">
        <li>• Face the camera directly, head centered</li>
        <li>• Good lighting, no shadows</li>
        <li>• No sunglasses, hats, or filters</li>
        <li>• Neutral expression, plain background</li>
      </ul>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}