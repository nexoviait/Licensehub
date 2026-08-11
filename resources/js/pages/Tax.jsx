import React, { useEffect, useMemo, useState } from "react";
import {
  Receipt,
  Plus,
  TrendingUp,
  Calculator,
  FileCheck2,
  AlertTriangle,
  Building2,
  Trash2,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const FILING_TYPES = ["VAT Monthly", "VAT Quarterly", "Income Tax", "TDS", "AIT", "Withholding"];

const CHART_MONTHS = [
  { month: "Feb", vat: 2.1, income: 1.4, tds: 0.6 },
  { month: "Mar", vat: 2.4, income: 1.6, tds: 0.7 },
  { month: "Apr", vat: 2.6, income: 1.9, tds: 0.8 },
  { month: "May", vat: 2.9, income: 2.1, tds: 0.9 },
  { month: "Jun", vat: 3.2, income: 3.5, tds: 1 },
  { month: "Jul", vat: 2.8, income: 2.4, tds: 1.1 },
];

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n || 0);

function StatusPill({ status }) {
  const map = {
    filed: "border-accent/40 text-accent bg-accent/5",
    completed: "border-accent/40 text-accent bg-accent/5",
    due: "border-primary/40 text-primary bg-primary/5",
    pending: "border-primary/40 text-primary bg-primary/5",
    overdue: "border-destructive/40 text-destructive bg-destructive/5",
    draft: "border-border/60 text-muted-foreground",
  };

  const label = {
    filed: "Filed",
    completed: "Filed",
    due: "Due",
    pending: "Due",
    overdue: "Overdue",
    draft: "Draft",
  };

  const st = status || "draft";

  return (
    <Badge variant="outline" className={`text-[11px] ${map[st] || map.draft}`}>
      {label[st] || st}
    </Badge>
  );
}

export default function Tax() {
  const { user, can } = useAuth();
  const canManage = can("tax.manage") && user?.role !== "client" && !user?.roles?.includes("client");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  // Calculator State
  const [gross, setGross] = useState("100000");
  const [rate, setRate] = useState("15");

  const grossN = Number(gross) || 0;
  const rateN = Number(rate) || 0;
  const vatAmount = grossN * (rateN / 100);
  const net = grossN - vatAmount;

  const [form, setForm] = useState({
    company_id: "",
    tax_type: "VAT Monthly",
    period: "",
    amount: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "draft",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        api.get("/tax-filings"),
        api.get("/companies"),
      ]);
      if (tRes?.data) setItems(tRes.data);
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
    const isClient = user?.role === "client" || user?.roles?.includes("client");
    const currentUserId = user?.id;
    const currentUserEmail = (user?.email || "").toLowerCase();

    return items.filter((i) => {
      // Client scoping
      if (isClient && currentUserId) {
        const compObj = companies.find((c) => String(c.id) === String(i.company_id || i.company?.id));
        if (compObj) {
          const assignedIds = Array.isArray(compObj.assigned_user_ids) ? compObj.assigned_user_ids.map(Number) : [];
          const isAssigned = assignedIds.includes(Number(currentUserId));
          const emailMatches = (compObj.email || "").toLowerCase() === currentUserEmail;
          if (!isAssigned && !emailMatches) return false;
        }
      }

      if (statusFilter === "all") return true;
      if (statusFilter === "filed") return i.status === "filed" || i.status === "completed";
      if (statusFilter === "due") return i.status === "due" || i.status === "pending";
      return i.status === statusFilter;
    });
  }, [items, statusFilter, user, companies]);

  const stats = useMemo(() => {
    const filedAmt = items
      .filter((i) => i.status === "filed" || i.status === "completed")
      .reduce((s, i) => s + Number(i.amount || 0), 0);

    const dueAmt = items
      .filter((i) => i.status === "due" || i.status === "pending" || i.status === "overdue")
      .reduce((s, i) => s + Number(i.amount || 0), 0);

    return {
      filed: items.filter((i) => i.status === "filed" || i.status === "completed").length,
      due: items.filter((i) => i.status === "due" || i.status === "pending").length,
      overdue: items.filter((i) => i.status === "overdue").length,
      filedAmt,
      dueAmt,
    };
  }, [items]);

  function openCreate() {
    setErrors({});
    setForm({
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      tax_type: "VAT Monthly",
      period: "",
      amount: "",
      due_date: new Date().toISOString().slice(0, 10),
      status: "draft",
    });
    setOpen(true);
  }

  async function createFiling() {
    setErrors({});
    const newErrors = {};

    if (!form.period.trim()) {
      newErrors.period = "Period is required (e.g. Jun 2026)";
    }

    const amt = Number(form.amount);
    if (form.amount === "" || !Number.isFinite(amt) || amt < 0) {
      newErrors.amount = "Valid amount in BDT is required";
    }

    if (!form.due_date) {
      newErrors.due_date = "Due date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Return directly so NO toast popups appear!
    }

    try {
      const payload = {
        company_id: form.company_id,
        tax_type: form.tax_type,
        period: form.period.trim(),
        amount: amt,
        due_date: form.due_date,
        status: form.status,
      };

      const res = await api.post("/tax-filings", payload);
      setItems((prev) => [res.data, ...prev]);
      setOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function markFiled(id) {
    try {
      const res = await api.put(`/tax-filings/${id}`, { status: "completed" });
      setItems((prev) => prev.map((i) => (i.id === id ? res.data : i)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/tax-filings/${deleteId}`);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="VAT & Tax"
      requirePermission="tax.view"
      subtitle="Track VAT returns, income tax, TDS and withholding across every company."
      actions={
        <Can permission="tax.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New filing
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>FILED (THIS MONTH)</span>
              <FileCheck2 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.filed}</div>
            <div className="mt-1 text-xs text-muted-foreground">{fmtBDT(stats.filedAmt)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>DUE SOON</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{stats.due}</div>
            <div className="mt-1 text-xs text-muted-foreground">{fmtBDT(stats.dueAmt)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>OVERDUE</span>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-destructive">{stats.overdue}</div>
            <div className="mt-1 text-xs text-muted-foreground">Requires immediate action</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>COMPANIES</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{companies.length || 8}</div>
            <div className="mt-1 text-xs text-muted-foreground">With active filings</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="filings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="filings" className="gap-2">
            <Receipt className="h-4 w-4" /> Tax filings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" /> VAT Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="filings">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Tax filings
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        Loading tax filings…
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No tax filings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((i) => {
                      const compName = i.company?.name || i.company || "—";
                      const isFiled = i.status === "filed" || i.status === "completed";
                      return (
                        <TableRow key={i.id}>
                          <TableCell className="font-medium">{compName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {i.tax_type || i.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{i.period}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {String(i.due_date || i.dueDate || "").slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {fmtBDT(i.amount)}
                          </TableCell>
                          <TableCell>
                            <StatusPill status={i.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isFiled && canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markFiled(i.id)}
                                  className="text-xs text-accent hover:text-accent"
                                >
                                  Mark filed
                                </Button>
                              )}
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(i.id)}
                                  title="Delete filing"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Tax Liability Trends (in Million BDT)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_MONTHS}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="vat" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} name="VAT" />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.4} name="Income Tax" />
                    <Area type="monotone" dataKey="tds" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.4} name="TDS" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <Card className="border-border/60 max-w-xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> VAT & Tax Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Gross Amount (BDT)</Label>
                  <Input value={gross} onChange={(e) => setGross(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>VAT Rate (%)</Label>
                  <Input value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-4 space-y-2 border border-border/60">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span className="font-semibold">{fmtBDT(grossN)}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-500 font-medium">
                  <span>VAT ({rateN}%):</span>
                  <span>{fmtBDT(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-accent pt-2 border-t">
                  <span>Net Amount:</span>
                  <span>{fmtBDT(net)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Filing Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tax filing</DialogTitle>
            <DialogDescription>Record a VAT, income tax or TDS filing for a company.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Company</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm((f) => ({ ...f, company_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.tax_type} onValueChange={(v) => setForm((f) => ({ ...f, tax_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Field + Inline Validation */}
              <div className="space-y-1">
                <Label htmlFor="period">Period *</Label>
                <Input
                  id="period"
                  value={form.period}
                  placeholder="Jun 2026 / Q2 2026 / FY 2025"
                  maxLength={40}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, period: e.target.value }));
                    setErrors((err) => ({ ...err, period: null }));
                  }}
                />
                {errors.period && (
                  <p className="text-[11px] font-medium text-destructive mt-1">{errors.period}</p>
                )}
              </div>

              {/* Amount Field + Inline Validation */}
              <div className="space-y-1">
                <Label htmlFor="amount">Amount (BDT) *</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="450000"
                  value={form.amount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, amount: e.target.value }));
                    setErrors((err) => ({ ...err, amount: null }));
                  }}
                />
                {errors.amount && (
                  <p className="text-[11px] font-medium text-destructive mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Due Date Field + Inline Validation */}
              <div className="space-y-1">
                <Label htmlFor="due_date">Due date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, due_date: e.target.value }));
                    setErrors((err) => ({ ...err, due_date: null }));
                  }}
                />
                {errors.due_date && (
                  <p className="text-[11px] font-medium text-destructive mt-1">{errors.due_date}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Due</SelectItem>
                    <SelectItem value="completed">Filed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createFiling}>Create filing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tax filing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
