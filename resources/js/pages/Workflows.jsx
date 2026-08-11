import React, { useEffect, useMemo, useState } from "react";
import {
  Workflow as WorkflowIcon,
  Plus,
  Zap,
  Clock3,
  Trash2,
  Pencil,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";

const TRIGGERS = [
  "Deadline approaching (7 days)",
  "Deadline approaching (3 days)",
  "Filing marked overdue",
  "Document uploaded to vault",
  "New company added",
  "Tax filing status changed",
];

const ACTIONS = [
  "Send email reminder",
  "Send SMS + WhatsApp nudge",
  "Create follow-up task",
  "Notify assigned lawyer",
  "Notify assigned accountant",
  "Generate compliance report",
];

function StatusBadge({ status }) {
  return status === "active" ? (
    <Badge variant="outline" className="gap-1 border-accent/40 bg-accent/5 text-[11px] text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Active
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Paused
    </Badge>
  );
}

export default function Workflows() {
  const { can } = useAuth();
  const canManage = can("workflows.manage");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    trigger: TRIGGERS[0],
    action: ACTIONS[0],
    status: "active",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/workflows");
      if (res?.data) setItems(res.data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const active = items.filter((w) => w.status === "active").length;
    const totalRuns = items.reduce((s, w) => s + Number(w.runs || 0), 0);
    const avgSuccess = items.length
      ? Math.round(items.reduce((s, w) => s + Number(w.success_rate ?? w.successRate ?? 100), 0) / items.length)
      : 0;
    const timeSavedHrs = Math.round(totalRuns * 0.15);
    return { active, totalRuns, avgSuccess, timeSavedHrs };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({ name: "", trigger: TRIGGERS[0], action: ACTIONS[0], status: "active" });
    setDialogOpen(true);
  }

  function openEdit(w) {
    setEditing(w);
    setErrors({});
    setForm({
      name: w.name || "",
      trigger: w.trigger || TRIGGERS[0],
      action: w.action || ACTIONS[0],
      status: w.status || "active",
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Workflow name is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Return directly so NO toast popups appear!
    }

    try {
      const payload = {
        name: form.name.trim(),
        trigger: form.trigger,
        action: form.action,
        status: form.status,
      };

      if (editing) {
        const res = await api.put(`/workflows/${editing.id}`, payload);
        setItems((prev) => prev.map((w) => (w.id === editing.id ? res.data : w)));
      } else {
        const res = await api.post("/workflows", payload);
        setItems((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function toggleStatus(w) {
    const nextStatus = w.status === "active" ? "paused" : "active";
    try {
      const res = await api.put(`/workflows/${w.id}`, { status: nextStatus });
      setItems((prev) => prev.map((item) => (item.id === w.id ? res.data : item)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/workflows/${deleteId}`);
      setItems((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Workflow Automation"
      requirePermission="workflows.view"
      subtitle="Automate reminders, escalations and follow-up work across your portfolio."
      actions={
        <Can permission="workflows.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New Workflow
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">ACTIVE WORKFLOWS</div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">TOTAL RUNS</div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{stats.totalRuns}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">AVG. SUCCESS RATE</div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.avgSuccess}%</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">EST. TIME SAVED</div>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.timeSavedHrs}h</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> All workflows
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading automated workflows…
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No workflow automations created yet.
            </div>
          ) : (
            items.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4 transition hover:bg-muted/20"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <WorkflowIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm truncate">{w.name}</span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-0.5">{w.trigger}</span>
                    <span>→</span>
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5">{w.action}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs text-muted-foreground hidden sm:block">
                    <div>{w.runs || 0} runs</div>
                    <div>{w.success_rate ?? w.successRate ?? 100}% success</div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={w.status === "active"}
                        onCheckedChange={() => toggleStatus(w)}
                        title={w.status === "active" ? "Pause workflow" : "Activate workflow"}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEdit(w)} title="Edit workflow">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(w.id)} title="Delete workflow">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New / Edit Workflow Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit workflow" : "New workflow"}</DialogTitle>
            <DialogDescription>Pair a trigger with an automated action.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Workflow Name Field + Inline Validation */}
            <div className="space-y-1">
              <Label htmlFor="name">Workflow name *</Label>
              <Input
                id="name"
                placeholder="e.g. Trade license renewal nudge"
                value={form.name}
                maxLength={160}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  setErrors((err) => ({ ...err, name: null }));
                }}
              />
              {errors.name && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>When this happens (trigger)</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm((f) => ({ ...f, trigger: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Do this (action)</Label>
              <Select value={form.action} onValueChange={(v) => setForm((f) => ({ ...f, action: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="status" className="cursor-pointer">Enable immediately</Label>
              <Switch
                id="status"
                checked={form.status === "active"}
                onCheckedChange={(c) => setForm((f) => ({ ...f, status: c ? "active" : "paused" }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create workflow"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
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
