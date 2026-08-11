import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  Receipt,
  FolderLock,
  Mail,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companies, complianceStats } from "@/lib/mock-data";
import { useAuth } from "@/lib/rbac";

const trendData = [
  { m: "Jan", filed: 18, due: 22 },
  { m: "Feb", filed: 24, due: 26 },
  { m: "Mar", filed: 31, due: 33 },
  { m: "Apr", filed: 28, due: 30 },
  { m: "May", filed: 35, due: 38 },
  { m: "Jun", filed: 42, due: 44 },
  { m: "Jul", filed: 30, due: 47 },
];

const byType = [
  { t: "Trade Lic.", n: 12 },
  { t: "VAT", n: 18 },
  { t: "Income Tax", n: 9 },
  { t: "RJSC", n: 7 },
  { t: "Audit", n: 5 },
  { t: "TDS", n: 11 },
];

const statCards = [
  {
    label: "Companies",
    value: complianceStats.totalCompanies,
    icon: Building2,
    delta: "+2 this quarter",
    tone: "info",
  },
  {
    label: "Upcoming (30 days)",
    value: complianceStats.upcoming,
    icon: CalendarClock,
    delta: "Next: 5 days",
    tone: "warning",
  },
  {
    label: "Overdue",
    value: complianceStats.overdue,
    icon: AlertTriangle,
    delta: "Escalated",
    tone: "destructive",
  },
  {
    label: "Completed (YTD)",
    value: 128,
    icon: CheckCircle2,
    delta: "+12% vs. last year",
    tone: "success",
  },
];

const toneStyles = {
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
};

export default function Dashboard() {
  const { user } = useAuth();
  const isClient = user?.role === "client" || user?.roles?.includes("client");
  const upcoming = [...companies].sort((a, b) => a.nextDue.localeCompare(b.nextDue)).slice(0, 6);

  if (isClient) {
    return (
      <AdminShell
        title="Client Portal Command Center"
        requirePermission="dashboard.view"
        subtitle="Overview of your company's licenses, statutory filings, document vault & tax compliance status."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <Link to="/vault">
                <FolderLock className="h-4 w-4 text-primary" />
                Document Vault
              </Link>
            </Button>
            <Button size="sm" asChild className="gap-1.5 text-xs">
              <Link to="/share">
                <Mail className="h-4 w-4" />
                Reply Email
              </Link>
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Client Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">My Assigned Companies</p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight">1</p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Meridian Foods Ltd.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active Licenses</p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight">2</p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Trade License & VAT Reg</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Document Vault Files</p>
                  <p className="mt-2 font-display text-3xl font-semibold tracking-tight">8</p>
                  <p className="mt-1 text-xs text-muted-foreground">Form XII, Tax & RJSC Slips</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FolderLock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next Obligation Due</p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-tight">15 Jul 2026</p>
                  <p className="mt-1 text-xs text-amber-600 font-medium">Income Tax Return Q2</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <CalendarClock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Overview Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* My Companies Table */}
            <Card className="lg:col-span-2 border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">My Company Compliance Overview</CardTitle>
                  <CardDescription className="text-xs">Your registered enterprise details & trade license status</CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  100% Compliant
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> Meridian Foods Ltd.
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">RJSC Reg: C-198234/2021 • TIN: 8492019281</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
                      Active & Compliant
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded bg-background border space-y-1">
                      <span className="text-muted-foreground font-medium">Trade License Number:</span>
                      <p className="font-mono font-semibold text-foreground">TRAD/DNCC/019283/2026</p>
                    </div>
                    <div className="p-2.5 rounded bg-background border space-y-1">
                      <span className="text-muted-foreground font-medium">Renewal Due Date:</span>
                      <p className="font-mono font-semibold text-emerald-700">30 June 2027 (Valid)</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
                      <Link to="/vault">
                        <FolderLock className="h-3.5 w-3.5 text-primary" />
                        View Vault Documents
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Email Notices */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-primary" />
                  Compliance Notices & Emails
                </CardTitle>
                <CardDescription className="text-xs">Direct communications sent to your email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    subject: "Action Required: Trade License Renewal Notice",
                    date: "2026-07-28",
                    status: "Opened",
                  },
                  {
                    subject: "VAT Return (Mushak 9.1) filed successfully",
                    date: "2026-07-15",
                    status: "Delivered",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs">
                    <div className="font-medium text-foreground truncate">{item.subject}</div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>{item.date}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" asChild className="w-full text-xs gap-1.5 mt-2">
                  <Link to="/share">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    Reply to Compliance Email
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Modules Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 shadow-sm hover:border-primary/40 transition group cursor-pointer" asChild>
              <Link to="/vault">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <FolderLock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Document Vault</h4>
                    <p className="text-xs text-muted-foreground">Access Form XII, Audited Reports & TIN</p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-border/60 shadow-sm hover:border-primary/40 transition group cursor-pointer" asChild>
              <Link to="/tax">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">VAT & Tax Filings</h4>
                    <p className="text-xs text-muted-foreground">View filed Mushak 9.1 returns & tax slips</p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="border-border/60 shadow-sm hover:border-primary/40 transition group cursor-pointer" asChild>
              <Link to="/calendar">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <CalendarClock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Compliance Calendar</h4>
                    <p className="text-xs text-muted-foreground">Track statutory deadlines & renewals</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Compliance Command Center"
      requirePermission="dashboard.view"
      subtitle="Every company, license and filing across your portfolio — in one view."
      actions={
        <>
          <Button variant="outline" size="sm">
            <FileText className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" asChild>
            <Link to="/companies">
              <Building2 className="mr-1.5 h-4 w-4" /> Add Company
            </Link>
          </Button>
        </>
      }
    >
      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneStyles[s.tone]}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Filings vs. Obligations</CardTitle>
              <CardDescription>Monthly, across all companies</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live
            </Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gFiled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="due"
                    stroke="var(--color-primary)"
                    fill="url(#gDue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="filed"
                    stroke="var(--color-accent)"
                    fill="url(#gFiled)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">By Compliance Type</CardTitle>
            <CardDescription>Active items across portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="t" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--color-muted)" }}
                  />
                  <Bar dataKey="n" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadlines table */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            <CardDescription>Sorted by nearest due date</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link to="/calendar">
              View calendar <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-xs shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted font-display font-semibold text-muted-foreground">
                    {item.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-muted-foreground">{item.nextDueLabel}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Due {item.nextDue}
                    </p>
                  </div>
                </div>
                <StatusChip status={item.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function StatusChip({ status }) {
  if (status === "Overdue") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Overdue
      </Badge>
    );
  }
  if (status === "Upcoming") {
    return (
      <Badge variant="secondary" className="text-[10px] bg-warning/15 text-warning-foreground border-warning/30">
        Upcoming
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/30">
      Compliant
    </Badge>
  );
}
