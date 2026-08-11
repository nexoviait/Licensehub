import React from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { AccessDenied } from "@/components/AccessDenied";
import { LoginScreen } from "@/components/LoginScreen";
import { useAuth } from "@/lib/rbac";
import { toast } from "sonner";

export function AdminShell({ title, subtitle, actions, children, requirePermission }) {
  const { user, isAuthenticated, can, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  const allowed = !requirePermission || can(requirePermission);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies, licenses, filings…"
                className="h-9 pl-9 bg-muted/60 border-transparent focus-visible:bg-background"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              </Button>

              <Badge variant="outline" className="hidden gap-1.5 border-accent/30 bg-accent/10 text-accent lg:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                All systems normal
              </Badge>

              <RoleSwitcher />

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition gap-1.5 ml-1"
                title="Log out of session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                    {title}
                  </h1>
                  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {allowed && actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
              {allowed ? children : <AccessDenied module={title} />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminShell;
