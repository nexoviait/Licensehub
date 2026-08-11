import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  BellRing,
  FolderLock,
  Mail,
  Receipt,
  Scale,
  Calculator,
  UserRound,
  UserCog,
  KeyRound,
  ListChecks,
  Workflow,
  FileText,
  BarChart3,
  ShieldCheck,
  LogOut,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ROLE_META, useAuth } from "@/lib/rbac";
import { toast } from "sonner";

const overview = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: "dashboard.view" },
];

const modules = [
  { title: "Companies", url: "/companies", icon: Building2, permission: "companies.view" },
  { title: "Compliance Calendar", url: "/calendar", icon: CalendarClock, permission: "calendar.view" },
  { title: "Reminders", url: "/reminders", icon: BellRing, permission: "reminders.view" },
  { title: "Document Vault", url: "/vault", icon: FolderLock, permission: "vault.view" },
  { title: "Share by E-mail", url: "/share", icon: Mail, permission: "share.view" },
  { title: "VAT & Tax", url: "/tax", icon: Receipt, permission: "tax.view" },
];

const workspaces = [
  { title: "Lawyer Portal", url: "/lawyer", icon: Scale, permission: "lawyer.view" },
  { title: "CA / Accountant", url: "/accountant", icon: Calculator, permission: "accountant.view" },
  { title: "Client Portal", url: "/clients", icon: UserRound, permission: "clients.view" },
];

const operations = [
  { title: "Tasks", url: "/tasks", icon: ListChecks, permission: "tasks.view" },
  { title: "Workflow Automation", url: "/workflows", icon: Workflow, permission: "workflows.view" },
  { title: "Invoicing & Billing", url: "/billing", icon: FileText, permission: "billing.view" },
  { title: "Reports & Exports", url: "/reports", icon: BarChart3, permission: "reports.view" },
  { title: "User Management", url: "/users", icon: UserRound, permission: "users.view" },
  { title: "Roles & Permissions", url: "/roles", icon: KeyRound, permission: "roles.view" },
  { title: "System Settings", url: "/settings", icon: Settings, permission: "settings.manage" },
  { title: "Profile Settings", url: "/profile", icon: UserCog, permission: "profile.view" },
];

export function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { user, can, logout } = useAuth();
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem("licensehub_logo") || "");

  useEffect(() => {
    const updateLogo = () => {
      setCustomLogo(localStorage.getItem("licensehub_logo") || "");
    };
    window.addEventListener("licensehub_logo_changed", updateLogo);
    return () => window.removeEventListener("licensehub_logo_changed", updateLogo);
  }, []);

  const isActive = (url) => (url === "/" ? path === "/" : path.startsWith(url));

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  const renderGroup = (label, items) => {
    const visible = items.filter((i) => can(i.permission));
    if (visible.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.url)}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-medium hover:bg-sidebar-accent/60"
                >
                  <Link to={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const meta = ROLE_META[user.role] || { initials: "CL", label: user.role };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm overflow-hidden">
            {customLogo ? (
              <img src={customLogo} alt="Platform Logo" className="h-full w-full object-cover" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold text-sidebar-foreground">
              LicenseHub
            </span>
            <span className="text-[11px] text-sidebar-foreground/60">Compliance Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {renderGroup("Overview", overview)}
        {renderGroup("Modules", modules)}
        {renderGroup("Workspaces", workspaces)}
        {renderGroup("Operations", operations)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <Link to="/profile" title="View & Edit Profile" className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold overflow-hidden shrink-0 border border-sidebar-border">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                meta.initials
              )}
            </div>
            <div className="flex flex-col text-xs">
              <span className="font-medium text-sidebar-foreground">{user.name}</span>
              <span className="text-sidebar-foreground/50">{meta.label}</span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
