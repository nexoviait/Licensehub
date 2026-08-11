import React, { useEffect, useMemo, useState } from "react";
import {
  ListChecks,
  Plus,
  Circle,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
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
import { toast } from "sonner";

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const PRIORITIES = ["low", "medium", "high"];

function PriorityBadge({ priority }) {
  const map = {
    low: "border-border/60 text-muted-foreground",
    medium: "border-warning/40 text-warning-foreground bg-warning/10",
    high: "border-destructive/40 text-destructive bg-destructive/5",
  };
  const label = { low: "Low", medium: "Medium", high: "High" };
  return <Badge variant="outline" className={`text-[11px] ${map[priority]}`}>{label[priority]}</Badge>;
}

function StatusIcon({ status }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-accent" />;
  if (status === "in_progress") return <CircleDot className="h-4 w-4 text-primary" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

function isOverdue(t) {
  if (t.status === "done") return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  const cleanStr = String(t.due_date || t.dueDate || "").slice(0, 10);
  return cleanStr < todayStr;
}

export default function Tasks() {
  const { can } = useAuth();
  const canManage = can("tasks.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    company_id: "",
    assignee: "",
    priority: "medium",
    status: "todo",
    due_date: addDays(7),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        api.get("/tasks"),
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
    return items.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [items, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const open = items.filter((t) => t.status !== "done").length;
    const overdue = items.filter(isOverdue).length;
    const done = items.filter((t) => t.status === "done").length;
    const inProgress = items.filter((t) => t.status === "in_progress").length;
    return { open, overdue, done, inProgress };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      title: "",
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      assignee: "",
      priority: "medium",
      status: "todo",
      due_date: addDays(7),
    });
    setDialogOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setErrors({});
    setForm({
      title: t.title || "",
      company_id: String(t.company_id || companies[0]?.id || 1),
      assignee: t.assignee || "",
      priority: t.priority || "medium",
      status: t.status || "todo",
      due_date: t.due_date || addDays(7),
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Task title is required";
    if (!form.assignee.trim()) newErrors.assignee = "Assignee name is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editing) {
        const res = await api.put(`/tasks/${editing.id}`, form);
        setItems((prev) => prev.map((t) => (t.id === editing.id ? res.data : t)));
      } else {
        const res = await api.post("/tasks", form);
        setItems((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function markDone(id) {
    try {
      const res = await api.put(`/tasks/${id}`, { status: "done" });
      setItems((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/tasks/${deleteId}`);
      setItems((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Tasks"
      requirePermission="tasks.view"
      subtitle="Assign and track compliance work items across your team."
      actions={
        <Can permission="tasks.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New Task
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Open", value: stats.open, tone: "text-primary" },
          { label: "In progress", value: stats.inProgress, tone: "text-primary" },
          { label: "Overdue", value: stats.overdue, tone: "text-destructive" },
          { label: "Done", value: stats.done, tone: "text-accent" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className={`mt-2 font-display text-3xl font-semibold ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" /> All tasks
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Loading tasks…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No tasks match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={t.status} />
                        {t.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.company?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.assignee}</TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell className="text-sm">
                      <span className={isOverdue(t) ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {String(t.due_date || t.dueDate || "").slice(0, 10)}
                      </span>
                      {isOverdue(t) && <AlertTriangle className="ml-1 inline h-3 w-3 text-destructive" />}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.status === "done"
                            ? "border-accent/40 text-accent text-[11px]"
                            : t.status === "in_progress"
                              ? "border-primary/40 text-primary text-[11px]"
                              : "text-[11px]"
                        }
                      >
                        {t.status === "done" ? "Done" : t.status === "in_progress" ? "In progress" : "To do"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          {t.status !== "done" && (
                            <Button variant="ghost" size="sm" onClick={() => markDone(t.id)} title="Mark done">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Task" : "New Task"}</DialogTitle>
            <DialogDescription>Assign a compliance work item to a team member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Task Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Collect trade license documents"
              />
              {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Company</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm((f) => ({ ...f, company_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Assignee Name *</Label>
                <Input
                  value={form.assignee}
                  onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                  placeholder="e.g. Rahim Uddin"
                />
                {errors.assignee && <p className="text-[11px] text-destructive">{errors.assignee}</p>}
              </div>

              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
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
