import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSidebar({ sections, active, onSelect, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed md:static z-40 top-0 left-0 h-full w-60 bg-card border-r border-border p-3 flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="font-bold">Admin Console</span>
          <button onClick={onClose} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1 overflow-y-auto no-scrollbar flex-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{s.label}</span>
              {s.badge ? (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-black font-bold">
                  {s.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}