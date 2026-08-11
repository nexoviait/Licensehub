import React from "react";
import { Link } from "react-router-dom";
import { ROLE_META, useAuth } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export function RoleSwitcher() {
  const { user } = useAuth();
  if (!user) return null;

  const roleKey = user.role || "viewer";
  const meta = ROLE_META[roleKey] || { label: roleKey, initials: "US" };

  return (
    <Link
      to="/profile"
      title="View & Edit Profile Settings"
      className="flex items-center gap-2.5 px-3 py-1 rounded-full border border-slate-200 bg-white/90 shadow-sm hover:bg-slate-50 transition hover:border-primary/40 cursor-pointer group"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0 border border-slate-200">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          meta.initials
        )}
      </div>
      <div className="hidden text-left leading-tight md:block">
        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          {user.name}
          <User className="h-3 w-3 text-slate-400 group-hover:text-primary transition" />
        </div>
        <div className="text-[10px] text-slate-500">{meta.label}</div>
      </div>
      <Badge variant="outline" className="text-[10px] uppercase font-semibold border-primary/20 text-primary bg-primary/5">
        {meta.label}
      </Badge>
    </Link>
  );
}

export default RoleSwitcher;
