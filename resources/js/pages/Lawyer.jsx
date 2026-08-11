import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  Plus,
  Gavel,
  Clock3,
  CheckCircle2,
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

const MATTER_TYPES = ["Contract Review", "RJSC Dispute", "Litigation", "Compliance Advisory", "IP Registration"];
const LAWYERS = ["Farhana Islam", "Tanvir Ahmed", "Nusrat Jahan"];

function StatusBadge({ status }) {
  const map = {
    open: "border-primary/40 text-primary bg-primary/5",
    active: "border-primary/40 text-primary bg-primary/5",
    in_review: "border-warning/40 text-amber-500 bg-amber-500/10",
    pending: "border-warning/40 text-amber-500 bg-amber-500/10",
    closed: "border-accent/40 text-accent bg-accent/5",
  };
  const label = { open: "Open", active: "Open", in_review: "In review", pending: "In review", closed: "Closed" };
  const st = status || "open";

  return <Badge variant="outline" className={`text-[11px] ${map[st] || map.open}`}>{label[st] || st}</Badge>;
}

function PriorityBadge({ priority }) {
  const p = (priority || "medium").toLowerCase();
  const map = {
    low: "border-border/60 text-muted-foreground",
    medium: "border-warning/40 text-amber-500 bg-amber-500/10",
    high: "border-destructive/40 text-destructive bg-destructive/5",
  };
  return <Badge variant="outline" className={`text-[11px] ${map[p] || map.medium}`}>{p[0].toUpperCase() + p.slice(1)}</Badge>;
}

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return Math.round((new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
}

export default function Lawyer() {
  const { can } = useAuth();
  const canManage = can("lawyer.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    company_id: "",
    matter_type: "Contract Review",
    lawyer: LAWYERS[0],
    priority: "medium",
    status: "open",
    next_hearing: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [lRes, cRes] = await Promise.all([
        api.get("/legal-matters"),
        api.get("/companies"),
      ]);
      if (lRes?.data) setItems(lRes.data);
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
    return statusFilter === "all"
      ? items
      : items.filter((m) => m.status === statusFilter || (statusFilter === "open" && m.status === "active"));
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const open = items.filter((m) => m.status === "open" || m.status === "active").length;
    const inReview = items.filter((m) => m.status === "in_review" || m.status === "pending").length;
    const upcoming = items.filter((m) => m.status !== "closed" && daysUntil(m.next_hearing || m.nextDate) >= 0 && daysUntil(m.next_hearing || m.nextDate) <= 30).length;
    const closedThisYear = items.filter((m) => m.status === "closed").length;
    return { open, inReview, upcoming, closedThisYear };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      title: "",
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      matter_type: "Contract Review",
      lawyer: LAWYERS[0],
      priority: "medium",
      status: "open",
      next_hearing: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  function openEdit(m) {
    setEditing(m);
    setErrors({});
    setForm({
      title: m.title || "",
      company_id: m.company_id ? String(m.company_id) : companies[0]?.id ? String(companies[0].id) : "1",
      matter_type: m.matter_type || m.matterType || "Contract Review",
      lawyer: m.lawyer || m.assignedLawyer || LAWYERS[0],
      priority: m.priority || "medium",
      status: m.status || "open",
      next_hearing: m.next_hearing || m.nextDate || new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Matter title is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Return directly so NO toast popups appear!
    }

    try {
      const payload = {
        company_id: form.company_id,
        title: form.title.trim(),
        matter_type: form.matter_type,
        lawyer: form.lawyer,
        priority: form.priority,
        status: form.status,
        next_hearing: form.next_hearing,
      };

      if (editing) {
        const res = await api.put(`/legal-matters/${editing.id}`, payload);
        setItems((prev) => prev.map((m) => (m.id === editing.id ? res.data : m)));
      } else {
        const res = await api.post("/legal-matters", payload);
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
      await api.delete(`/legal-matters/${deleteId}`);
      setItems((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Lawyer Portal"
      requirePermission="lawyer.view"
      subtitle="Track legal matters, contract reviews and litigation across companies."
      actions={
        <Can permission="lawyer.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New matter
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">OPEN MATTERS</div>
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{stats.open}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">IN REVIEW</div>
              <Gavel className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-amber-500">{stats.inReview}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">UPCOMING (30D)</div>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">CLOSED THIS YEAR</div>
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.closedThisYear}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" /> Legal matters
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matter</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Matter type</TableHead>
                <TableHead>Lawyer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Next date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Loading legal matters…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No legal matters found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const compName = m.company?.name || m.company || "—";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium max-w-[220px] truncate">{m.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{compName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {m.matter_type || m.matterType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.lawyer || m.assignedLawyer}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={m.priority} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {String(m.next_hearing || m.nextDate || "").slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(m)} title="Edit matter">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)} title="Delete matter">
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
            <DialogTitle>{editing ? "Edit legal matter" : "New legal matter"}</DialogTitle>
            <DialogDescription>Log a legal matter and assign it to a lawyer.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Matter Title Field + Inline Validation */}
            <div className="space-y-1">
              <Label htmlFor="title">Matter title *</Label>
              <Input
                id="title"
                value={form.title}
                placeholder="e.g. Vendor supply agreement review"
                maxLength={160}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  setErrors((err) => ({ ...err, title: null }));
                }}
              />
              {errors.title && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors.title}</p>
              )}
            </div>

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
                <Label>Matter type</Label>
                <Select value={form.matter_type} onValueChange={(v) => setForm((f) => ({ ...f, matter_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATTER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Assigned lawyer</Label>
                <Select value={form.lawyer} onValueChange={(v) => setForm((f) => ({ ...f, lawyer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAWYERS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="next_hearing">Next date</Label>
                <Input
                  id="next_hearing"
                  type="date"
                  value={form.next_hearing}
                  onChange={(e) => setForm((f) => ({ ...f, next_hearing: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_review">In review</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create matter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete legal matter?</AlertDialogTitle>
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
