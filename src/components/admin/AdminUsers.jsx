import React from "react";
import { Mail } from "lucide-react";

export default function AdminUsers({ users }) {
  if (!users.length)
    return <p className="text-sm text-muted-foreground">No users (or not permitted to list users).</p>;

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
            {(u.full_name || u.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{u.full_name || "Member"}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="w-3 h-3" /> {u.email}
            </p>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
              u.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {u.role || "user"}
          </span>
        </div>
      ))}
    </div>
  );
}