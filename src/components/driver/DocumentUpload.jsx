import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, Check, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { toast } from "react-hot-toast";

export default function DocumentUpload({ label, value, onChange, accept = "image/*", hint }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-card">
          <div className="w-full h-28">
            <Image src={value} fittingType="fit" className="w-full h-full" />
          </div>
          <button
            onClick={() => onChange("")}
            type="button"
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[10px] font-semibold text-white bg-green-500/80 px-1.5 py-0.5 rounded-full">
            <Check className="w-2.5 h-2.5" /> Uploaded
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          type="button"
          className="w-full h-28 rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-xs">Tap to upload</span>
            </>
          )}
        </button>
      )}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}