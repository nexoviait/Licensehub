import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_META, useAuth } from "@/lib/rbac";

export function AccessDenied({ module }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current role <span className="font-medium text-foreground">{ROLE_META[user.role]?.label || "User"}</span> doesn't have permission to open <span className="font-medium text-foreground">{module}</span>. Ask an administrator for access or switch role from the header.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
