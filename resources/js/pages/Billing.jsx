import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Wallet,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { toast } from "sonner";

const REVENUE_CHART = [
  { month: "Feb", revenue: 2.1 },
  { month: "Mar", revenue: 2.6 },
  { month: "Apr", revenue: 2.9 },
  { month: "May", revenue: 3.3 },
  { month: "Jun", revenue: 3.7 },
  { month: "Jul", revenue: 2.4 },
];

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

function StatusBadge({ status }) {
  const map = {
    paid: "border-accent/40 text-accent bg-accent/5",
    pending: "border-primary/40 text-primary bg-primary/5",
    overdue: "border-destructive/40 text-destructive bg-destructive/5",
    draft: "border-border/60 text-muted-foreground",
  };
  const label = { paid: "Paid", pending: "Pending", overdue: "Overdue", draft: "Draft" };
  return <Badge variant="outline" className={`text-[11px] ${map[status]}`}>{label[status]}</Badge>;
}

export default function Billing() {
  const { can } = useAuth();
  const canManage = can("billing.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    company_id: "",
    amount: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    status: "draft",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, cRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/companies"),
      ]);
      if (iRes?.data) setItems(iRes.data);
      if (cRes?.data) setCompanies(cRes.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const totalInvoiced = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const outstanding = items.filter((i) => i.status === "pending" || i.status === "overdue").reduce((s, i) => s + Number(i.amount || 0), 0);
    const overdue = items.filter((i) => i.status === "overdue").length;
    const paidThisMonth = items.filter((i) => i.status === "paid" && (i.issue_date || "").startsWith("2026-07")).reduce((s, i) => s + Number(i.amount || 0), 0);
    return { totalInvoiced, outstanding, overdue, paidThisMonth };
  }, [items]);

  function openCreate() {
    setErrors({});
    setForm({
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      amount: "",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      status: "draft",
    });
    setOpen(true);
  }

  async function createInvoice() {
    setErrors({});
    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErrors({ amount: "Amount must be a positive number" });
      return;
    }

    try {
      const res = await api.post("/invoices", form);
      setItems((prev) => [res.data, ...prev]);
      setOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function markPaid(id) {
    try {
      const res = await api.put(`/invoices/${id}`, { status: "paid" });
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
    } catch {
      // Handled in api helper
    }
  }

  function downloadInvoice(inv) {
    const compName = inv.company?.name || "Client_Company";
    const compSlug = compName.replace(/[^A-Za-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    const fileName = `${compSlug}_${inv.number}.pdf`;

    toast.success(`Downloading ${fileName}...`);
    const link = document.createElement("a");
    link.href = `/api/invoices/${inv.id}/download`;
    link.target = "_blank";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <AdminShell
      title="Invoicing & Billing"
      requirePermission="billing.view"
      subtitle="Issue invoices, track payments and monitor outstanding balances."
      actions={
        <Can permission="billing.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New invoice
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total invoiced</div>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">{fmtBDT(stats.totalInvoiced)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</div>
              <Clock3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-primary">{fmtBDT(stats.outstanding)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Overdue</div>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Paid this month</div>
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-display text-2xl font-semibold text-accent">{fmtBDT(stats.paidThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" /> Invoices
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Issue date</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Loading invoices…
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-sm font-medium">{i.number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.company?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{String(i.issue_date || "").slice(0, 10)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{String(i.due_date || "").slice(0, 10)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtBDT(i.amount)}</TableCell>
                      <TableCell><StatusBadge status={i.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="Download invoice" onClick={() => downloadInvoice(i)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {canManage && i.status !== "paid" && (
                            <Button variant="ghost" size="sm" onClick={() => markPaid(i.id)}>Mark paid</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Revenue collected (BDT lakh)</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_CHART}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>Issue an invoice for compliance or advisory services.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Company</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm((f) => ({ ...f, company_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Amount (BDT) *</Label>
              <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              {errors.amount && <p className="text-[11px] text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Issue date</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label>Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createInvoice}>Create invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
