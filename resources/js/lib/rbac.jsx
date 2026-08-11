import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const ROLE_META = {
  super_admin: { label: "Super Admin", description: "Full platform access", initials: "SA" },
  admin: { label: "Admin", description: "Manage all modules", initials: "AD" },
  compliance_officer: { label: "Compliance Officer", description: "Compliance, calendar & reminders", initials: "CO" },
  lawyer: { label: "Lawyer", description: "Lawyer portal & legal filings", initials: "LW" },
  accountant: { label: "CA / Accountant", description: "Tax, VAT & billing", initials: "CA" },
  client: { label: "Client", description: "Own company workspace", initials: "CL" },
  viewer: { label: "Viewer", description: "Read-only access", initials: "VW" },
};

const ALL_VIEW = [
  "dashboard.view",
  "companies.view",
  "calendar.view",
  "reminders.view",
  "vault.view",
  "share.view",
  "tax.view",
  "lawyer.view",
  "accountant.view",
  "clients.view",
  "tasks.view",
  "workflows.view",
  "billing.view",
  "reports.view",
  "users.view",
  "roles.view",
  "profile.view",
];

const ROLE_PERMISSIONS = {
  super_admin: [
    ...ALL_VIEW,
    "companies.manage",
    "calendar.manage",
    "reminders.manage",
    "vault.manage",
    "share.manage",
    "tax.manage",
    "lawyer.manage",
    "accountant.manage",
    "clients.manage",
    "tasks.manage",
    "workflows.manage",
    "billing.manage",
    "reports.manage",
    "users.manage",
    "roles.manage",
    "settings.manage",
  ],
  admin: [
    ...ALL_VIEW,
    "companies.manage",
    "calendar.manage",
    "reminders.manage",
    "vault.manage",
    "share.manage",
    "tax.manage",
    "clients.manage",
    "tasks.manage",
    "workflows.manage",
    "billing.manage",
    "reports.manage",
    "users.manage",
    "roles.manage",
    "settings.manage",
  ],
  compliance_officer: [
    "dashboard.view",
    "companies.view",
    "calendar.view",
    "calendar.manage",
    "reminders.view",
    "reminders.manage",
    "vault.view",
    "vault.manage",
    "share.view",
    "share.manage",
    "tax.view",
    "tasks.view",
    "tasks.manage",
    "reports.view",
    "profile.view",
  ],
  lawyer: [
    "dashboard.view",
    "companies.view",
    "calendar.view",
    "reminders.view",
    "vault.view",
    "vault.manage",
    "share.view",
    "share.manage",
    "lawyer.view",
    "lawyer.manage",
    "tasks.view",
    "tasks.manage",
    "profile.view",
  ],
  accountant: [
    "dashboard.view",
    "companies.view",
    "calendar.view",
    "reminders.view",
    "vault.view",
    "tax.view",
    "tax.manage",
    "accountant.view",
    "accountant.manage",
    "billing.view",
    "billing.manage",
    "reports.view",
    "tasks.view",
    "profile.view",
  ],
  client: [
    "dashboard.view",
    "companies.view",
    "calendar.view",
    "reminders.view",
    "vault.view",
    "share.view",
    "tax.view",
    "clients.view",
    "billing.view",
    "profile.view",
  ],
  viewer: ALL_VIEW,
};

const AuthContext = createContext(null);
const STORAGE_KEY = "lh.rbac.user";
const LOGGED_OUT_KEY = "lh.is_logged_out";
const JWT_KEY = "lh.jwt.token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      if (localStorage.getItem(LOGGED_OUT_KEY) === "true") {
        return null;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      const savedUser = raw ? JSON.parse(raw) : null;
      // Only trust a saved user if we also have a JWT token to back it —
      // otherwise it's a stale/local-only identity with nothing authenticated.
      return savedUser && localStorage.getItem(JWT_KEY) ? savedUser : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.removeItem(LOGGED_OUT_KEY);
      } else {
        localStorage.setItem(LOGGED_OUT_KEY, "true");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(JWT_KEY);
      }
    } catch {
      // Fallback
    }
  }, [user]);

  const value = useMemo(() => {
    const role = user?.role || user?.roles?.[0] || "viewer";
    const userPerms = Array.isArray(user?.permissions) ? new Set(user.permissions) : null;
    const fallbackPerms = new Set(ROLE_PERMISSIONS[role] || ALL_VIEW);

    const hasPermission = (p) => {
      if (!user) return false;
      if (p === "profile.view") return true; // Profile Settings accessible to ALL authenticated users
      if (role === "super_admin" || user?.roles?.includes("super_admin")) return true;
      if (userPerms) return userPerms.has(p);
      return fallbackPerms.has(p);
    };

    return {
      user,
      isAuthenticated: Boolean(user),
      setRole: (r) => setUser((u) => (u ? { ...u, role: r } : u)),
      updateUser: (partialData) => {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...partialData };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      },
      login: (tokenOrEmail, userDataOrRole, name, avatar = null) => {
        let token = null;
        let userData = null;

        if (typeof tokenOrEmail === "string" && typeof userDataOrRole === "object") {
          token = tokenOrEmail;
          userData = userDataOrRole;
        } else {
          userData = {
            name: name || "",
            email: tokenOrEmail || "",
            role: userDataOrRole || "viewer",
            avatar: avatar || user?.avatar || null,
          };
        }

        try {
          localStorage.removeItem(LOGGED_OUT_KEY);
          if (token) {
            localStorage.setItem(JWT_KEY, token);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        } catch {
          // Fallback
        }
        setUser(userData);
      },
      logout: () => {
        try {
          localStorage.setItem(LOGGED_OUT_KEY, "true");
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(JWT_KEY);
        } catch {
          // Fallback
        }
        setUser(null);
      },
      hasPermission,
      can: hasPermission,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function Can({ permission, fallback = null, children }) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
