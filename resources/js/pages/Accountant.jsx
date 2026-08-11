import React, { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Plus,
  Building2,
  DollarSign,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";

const ENGAGEMENT_TYPES = [
  "Statutory Audit",
  "VAT Return Filing",
  "Corporate Tax Return",
  "Bookkeeping & Payroll",
  "Transfer Pricing Study",
];
const ACCOUNTANTS = ["Sadia Ahmed", "Mohammad Ali", "Anisur Rahman"];

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n || 0);

function StatusBadge({ status }) {
  const map = {
    active: "border-accent/40 text-accent bg-accent/5",
    on_hold: "border-warning/40 text-amber-500 bg-amber-500/10",
    completed: "border-primary/40 text-primary bg-primary/5",
  };
  const label = { active: "Active", on_hold: "On hold", completed: "Completed" };
  const st = status || "active";

  return <Badge variant="outline" className={`text-[11px] ${map[st] || map.active}`}>{label[st] || st}</Badge>;
}

export default function Accountant() {
  const { can } = useAuth();
  const canManage = can("accountant.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    company_id: "",
    engagement_type: "Statutory Audit",
    accountant: ACCOUNTANTS[0],
    fee: "150000",
    status: "active",
    next_milestone: "",
    next_milestone_date: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, cRes] = await Promise.all([
        api.get("/engagements"),
        api.get("/companies"),
      ]);
      if (eRes?.data) setItems(eRes.data);
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
    return statusFilter === "all" ? items : items.filter((e) => e.status === statusFilter);
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const active = items.filter((e) => e.status === "active").length;
    const feesYtd = items.reduce((s, e) => s + Number(e.fee || 0), 0);
    const onHold = items.filter((e) => e.status === "on_hold").length;
    const upcoming = items.filter((e) => e.status === "active").length;
    return { active, feesYtd, onHold, upcoming };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      engagement_type: "Statutory Audit",
      accountant: ACCOUNTANTS[0],
      fee: "150000",
      status: "active",
      next_milestone: "",
      next_milestone_date: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  function openEdit(e) {
    setEditing(e);
    setErrors({});
    setForm({
      company_id: e.company_id ? String(e.company_id) : companies[0]?.id ? String(companies[0].id) : "1",
      engagement_type: e.engagement_type || e.engagementType || "Statutory Audit",
      accountant: e.accountant || ACCOUNTANTS[0],
      fee: String(e.fee || 0),
      status: e.status || "active",
      next_milestone: e.next_milestone || e.nextMilestone || "",
      next_milestone_date: e.next_milestone_date || e.nextMilestoneDate || new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};

    if (!form.next_milestone.trim()) {
      newErrors.next_milestone = "Next milestone description is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Return directly so NO toast popups appear!
    }

    try {
      const payload = {
        company_id: form.company_id,
        engagement_type: form.engagement_type,
        accountant: form.accountant,
        fee: Number(form.fee || 0),
        status: form.status,
        next_milestone: form.next_milestone.trim(),
        next_milestone_date: form.next_milestone_date,
      };

      if (editing) {
        const res = await api.put(`/engagements/${editing.id}`, payload);
        setItems((prev) => prev.map((e) => (e.id === editing.id ? res.data : e)));
      } else {
        const res = await api.post("/engagements", payload);
        setItems((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/engagements/${deleteId}`);
      setItems((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="CA / Accountant Portal"
      requirePermission="accountant.view"
      subtitle="Manage audit engagements, tax filings and accounting tasks across client companies."
      actions={
        <Can permission="accountant.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New engagement
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">ACTIVE ENGAGEMENTS</div>
              <Building2 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">ANNUAL FEES</div>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{fmtBDT(stats.feesYtd)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">ON HOLD</div>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-amber-500">{stats.onHold}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">UPCOMING MILESTONES</div>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.upcoming}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" /> Audit & Tax Engagements
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Engagement type</TableHead>
                <TableHead>Accountant</TableHead>
                <TableHead className="text-right">Annual Fee</TableHead>
                <TableHead>Next milestone</TableHead>
                <TableHead>Target date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Loading engagements…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No accounting engagements found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const compName = e.company?.name || e.company || "—";
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{compName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {e.engagement_type || e.engagementType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.accountant}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtBDT(e.fee)}</TableCell>
                      <TableCell className="text-sm font-medium">{e.next_milestone || e.nextMilestone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {String(e.next_milestone_date || e.nextMilestoneDate || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(e)} title="Edit engagement">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(e.id)} title="Delete engagement">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New / Edit Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit engagement" : "New engagement"}</DialogTitle>
            <DialogDescription>Assign a CA/accountant and set milestone deliverables.</DialogDescription>
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
                <Label>Engagement type</Label>
                <Select value={form.engagement_type} onValueChange={(v) => setForm((f) => ({ ...f, engagement_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Assigned accountant</Label>
                <Select value={form.accountant} onValueChange={(v) => setForm((f) => ({ ...f, accountant: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNTANTS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fee">Annual Fee (BDT)</Label>
                <Input
                  id="fee"
                  inputMode="decimal"
                  value={form.fee}
                  onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="next_milestone_date">Target date</Label>
                <Input
                  id="next_milestone_date"
                  type="date"
                  value={form.next_milestone_date}
                  onChange={(e) => setForm((f) => ({ ...f, next_milestone_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Next Milestone Field + Inline Validation */}
            <div className="space-y-1">
              <Label htmlFor="next_milestone">Next milestone *</Label>
              <Input
                id="next_milestone"
                placeholder="e.g. Draft Audit Report submission"
                value={form.next_milestone}
                maxLength={200}
                onChange={(e) => {
                  setForm((f) => ({ ...f, next_milestone: e.target.value }));
                  setErrors((err) => ({ ...err, next_milestone: null }));
                }}
              />
              {errors.next_milestone && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors.next_milestone}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create engagement"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete engagement?</AlertDialogTitle>
            <AlertDialogDescription>This action can't be undone.</AlertDialogDescription>
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
