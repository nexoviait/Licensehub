import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileBarChart2,
  Receipt,
  FolderLock,
  Building2,
  ListChecks,
  Download,
  FileSpreadsheet,
  FileText as FileTextIcon
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { toast } from "sonner";
const REPORTS = [
  { id: "rep1", slug: "compliance-summary", name: "Compliance Summary", description: "Portfolio-wide status of every license and filing.", icon: FileBarChart2 },
  { id: "rep2", slug: "tax-filing", name: "Tax Filing Report", description: "VAT, income tax and TDS filings with amounts and due dates.", icon: Receipt },
  { id: "rep3", slug: "document-audit", name: "Document Audit Log", description: "Every upload, download and share event in the vault.", icon: FolderLock },
  { id: "rep4", slug: "company-directory", name: "Company Directory", description: "Full company profiles with directors and branches.", icon: Building2 },
  { id: "rep5", slug: "overdue-items", name: "Overdue Items Report", description: "Every overdue filing, task and reminder across companies.", icon: ListChecks },
  { id: "rep6", slug: "client-activity", name: "Client Activity Report", description: "Client portal logins, document access and messages.", icon: BarChart3 }
];

function sizeToKb(size) {
  const m = /([\d.]+)\s*(KB|MB)/i.exec(size || "");
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2].toUpperCase() === "MB" ? n * 1024 : n;
}

function formatKb(kb) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
}

async function downloadReport(slug, reportName, format) {
  const res = await fetch(`/api/reports/${slug}/export?format=${format.toLowerCase()}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const fileName = match ? match[1] : `${reportName}.${format.toLowerCase()}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const GENERATION_TREND = [
  { month: "Feb", reports: 8 },
  { month: "Mar", reports: 11 },
  { month: "Apr", reports: 9 },
  { month: "May", reports: 14 },
  { month: "Jun", reports: 18 },
  { month: "Jul", reports: 12 }
];
function formatIcon(format) {
  if (format === "XLSX") return <FileSpreadsheet className="h-3.5 w-3.5" />;
  return <FileTextIcon className="h-3.5 w-3.5" />;
}
export default function Reports() {
  const { can } = useAuth();
  const canManage = can("reports.manage");
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  async function loadExports() {
    try {
      const res = await api.get("/export-records");
      setExports(res.data ?? []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExports();
  }, []);

  const stats = useMemo(() => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonth = exports.filter((e) => e.generated_at?.startsWith(monthPrefix)).length;
    const storageKb = exports.reduce((sum, e) => sum + sizeToKb(e.size), 0);
    return {
      generated: exports.length,
      thisMonth,
      scheduled: 3,
      storage: formatKb(storageKb)
    };
  }, [exports]);

  function lastGeneratedFor(reportName) {
    const match = exports.find((e) => e.report_name === reportName);
    return match ? match.generated_at.slice(0, 10) : "Never";
  }

  async function generate(report, format) {
    setGenerating(`${report.id}:${format}`);
    try {
      await downloadReport(report.slug, report.name, format);
      toast.success(`${report.name} generated as ${format}`);
      await loadExports();
    } catch {
      toast.error(`Failed to generate ${report.name}`);
    } finally {
      setGenerating(null);
    }
  }
  return <AdminShell
    title="Reports & Exports"
    requirePermission="reports.view"
    subtitle="Generate and export compliance, tax and portfolio reports."
  >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Reports generated</div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.generated}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">This month</div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{stats.thisMonth}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Scheduled reports</div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Export storage used</div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.storage}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => {
    const Icon = r.icon;
    return <Card key={r.id} className="border-border/60">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm">{r.name}</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">{r.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <span className="text-[11px] text-muted-foreground">
                  Last generated {loading ? "…" : lastGeneratedFor(r.name)}
                </span>
                <Can permission="reports.manage">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={generating?.startsWith(`${r.id}:`)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        {generating?.startsWith(`${r.id}:`) ? "Generating…" : "Generate"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => generate(r, "PDF")}>Export as PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generate(r, "CSV")}>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generate(r, "XLSX")}>Export as XLSX</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Can>
              </CardContent>
            </Card>;
  })}
        {!canManage && <div className="col-span-full rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            You have view-only access. Ask an admin to generate new exports.
          </div>}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Reports generated per month</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={GENERATION_TREND}>
              <defs>
                <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="reports" stroke="hsl(var(--primary))" fill="url(#repFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Export history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Generated by</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && exports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No exports yet. Generate a report above to see it here.
                  </TableCell>
                </TableRow>
              )}
              {exports.map((e) => <TableRow key={e.id}>
                  <TableCell className="text-sm font-medium">{e.report_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      {formatIcon(e.format)} {e.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.generated_by}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.generated_at}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.size}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const r = REPORTS.find((rep) => rep.name === e.report_name);
                        if (r) generate(r, e.format);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>;
}
