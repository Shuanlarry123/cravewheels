import React, { useState } from "react";
import { Bike, Check, X, ShieldCheck, ShieldAlert, Clock, FileText, ChevronDown, ChevronUp, Camera, Car } from "lucide-react";
import { Image } from "@/components/ui/image";

const ID_STATUS = {
  verified: { label: "ID Verified", cls: "bg-green-500/20 text-green-400", icon: ShieldCheck },
  pending: { label: "ID Pending", cls: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  rejected: { label: "ID Rejected", cls: "bg-red-500/20 text-red-400", icon: ShieldAlert },
  not_started: { label: "No ID Check", cls: "bg-muted text-muted-foreground", icon: ShieldAlert },
};
const BG_STATUS = {
  passed: { label: "BG Passed", cls: "bg-green-500/20 text-green-400" },
  pending: { label: "BG Pending", cls: "bg-yellow-500/20 text-yellow-400" },
  failed: { label: "BG Failed", cls: "bg-red-500/20 text-red-400" },
  not_started: { label: "No BG", cls: "bg-muted text-muted-foreground" },
};

export default function AdminDrivers({ drivers, users, onApprove, onReject, busy }) {
  const [open, setOpen] = useState(null);
  const userById = Object.fromEntries((users || []).map((u) => [u.id, u]));

  return (
    <div className="space-y-2">
      {drivers.map((d) => {
        const u = userById[d.created_by_id];
        const idS = ID_STATUS[d.id_verification_status] || ID_STATUS.not_started;
        const bgS = BG_STATUS[d.background_check_status] || BG_STATUS.not_started;
        const IdIcon = idS.icon;
        const isOpen = open === d.id;
        return (
          <div key={d.id} className="bg-card border border-border rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0 overflow-hidden">
                {d.profile_photo_url ? (
                  <Image src={d.profile_photo_url} fittingType="fill" className="w-full h-full" />
                ) : (
                  <Bike className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {d.legal_full_name || u?.full_name || "Driver"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u?.email || "—"}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${idS.cls}`}
                  >
                    <IdIcon className="w-2.5 h-2.5" /> {idS.label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${bgS.cls}`}>
                    {bgS.label}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {!d.is_approved ? (
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      onClick={() => onApprove(d.id)}
                      disabled={busy}
                      className="text-[11px] px-2 py-1 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => onReject(d.id)}
                      disabled={busy}
                      className="text-[11px] px-2 py-1 rounded-lg bg-red-500/15 text-red-400 font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-green-400 font-semibold">Approved</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setOpen(isOpen ? null : d.id)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground py-1"
            >
              {isOpen ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> View documents & details
                </>
              )}
            </button>

            {isOpen && (
              <div className="mt-1 pt-2 border-t border-border space-y-2.5">
                <Detail
                  label="License"
                  value={`${d.license_number || "—"}${d.license_state ? ` · ${d.license_state}` : ""}${
                    d.license_expiry ? ` · exp ${d.license_expiry}` : ""
                  }`}
                />
                <Detail
                  label="Vehicle"
                  value={
                    d.vehicle_type === "bicycle"
                      ? "Bicycle"
                      : `${d.vehicle_make || ""} ${d.vehicle_model || ""} ${d.vehicle_year || ""} (${
                          d.vehicle_color || ""
                        }) · Plate: ${d.license_plate || "—"}`
                  }
                />
                <Detail label="DOB" value={d.date_of_birth || "—"} />
                <Detail label="Address" value={d.address || "—"} />
                <Detail label="Phone" value={d.phone || "—"} />
                {d.id_verification_notes && (
                  <Detail label="ID check notes" value={d.id_verification_notes} />
                )}
                {d.extracted_name && (
                  <Detail label="ID extracted name" value={d.extracted_name} />
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <DocThumb label="License front" url={d.license_front_url} icon={FileText} />
                  <DocThumb label="License back" url={d.license_back_url} icon={FileText} />
                  {d.vehicle_type !== "bicycle" && (
                    <>
                      <DocThumb label="Registration" url={d.registration_url} icon={Car} />
                      <DocThumb label="Insurance" url={d.insurance_url} icon={FileText} />
                    </>
                  )}
                  <DocThumb label="Profile photo" url={d.profile_photo_url} icon={Camera} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-xs leading-snug">{value}</p>
    </div>
  );
}

function DocThumb({ label, url, icon: Icon }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <div className="relative rounded-xl overflow-hidden border border-border bg-background h-20">
        <Image src={url} fittingType="fit" className="w-full h-full" />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
    </a>
  );
}