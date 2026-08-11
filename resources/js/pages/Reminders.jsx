import React, { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Send,
  Search,
  AlertCircle
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CHANNELS = ["Email", "Email + SMS", "SMS"];

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function relativeDue(dueDate, status) {
  if (status === "done") return "Completed";
  const cleanStr = String(dueDate || "").slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(cleanStr);
  const diff = Math.round((due.getTime() - today.getTime()) / 864e5);
  if (diff < 0 || status === "overdue") return `Overdue by ${Math.abs(diff || 1)}d`;
  if (diff === 0) return "Due today";
  return `In ${diff}d`;
}

function StatusIcon({ status, dueDate }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const cleanStr = String(dueDate || "").slice(0, 10);
  if (status === "overdue" || (status !== "done" && cleanStr < todayStr)) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <Clock className="h-4 w-4 text-primary" />;
}

export default function Reminders() {
  const { can } = useAuth();
  const canManage = can("companies.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  // Nudge dispatch modal state
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [nudgeReminder, setNudgeReminder] = useState(null);
  const [nudgeForm, setNudgeForm] = useState({
    recipient: "",
    subject: "",
    body: "",
  });

  const [form, setForm] = useState({
    title: "",
    company_id: "",
    channel: "Email",
    due_date: addDays(7),
    status: "upcoming",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, cRes] = await Promise.all([
        api.get("/reminders").catch(() => null),
        api.get("/companies").catch(() => null),
      ]);
      if (rRes?.data) setItems(rRes.data);
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

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const titleMatch = (r.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const companyMatch = (r.company?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const channelMatch = (r.channel || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = !searchTerm || titleMatch || companyMatch || channelMatch;

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isItemOverdue = (i) => i.status === "overdue" || (i.status !== "done" && String(i.due_date || i.dueDate || "").slice(0, 10) < todayStr);
    const overdue = items.filter(isItemOverdue).length;
    const done = items.filter((i) => i.status === "done").length;
    const upcoming = items.filter((i) => !isItemOverdue(i) && i.status !== "done").length;
    return { upcoming, overdue, done };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      title: "",
      company_id: companies[0]?.id ? String(companies[0].id) : "",
      channel: "Email",
      due_date: addDays(7),
      status: "upcoming",
    });
    setDialogOpen(true);
  }

  function openEdit(r) {
    setEditing(r);
    setErrors({});
    setForm({
      title: r.title || "",
      company_id: r.company_id ? String(r.company_id) : companies[0]?.id ? String(companies[0].id) : "",
      channel: r.channel || "Email",
      due_date: r.due_date || r.dueDate || addDays(7),
      status: r.status || "upcoming",
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    if (!form.title.trim()) {
      setErrors({ title: "Reminder title is required." });
      return;
    }

    try {
      if (editing) {
        const res = await api.put(`/reminders/${editing.id}`, form);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? res.data : r)));
      } else {
        const res = await api.post("/reminders", form);
        setItems((prev) => [res.data, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  function openNudgeModal(r) {
    setNudgeReminder(r);
    const matchedComp = companies.find((c) => String(c.id) === String(r.company_id || r.company?.id));
    const companyName = matchedComp?.name || r.company?.name || "Client Company";
    const companyEmail = matchedComp?.email || r.company?.email || "";
    const companyPhone = matchedComp?.phone || r.company?.phone || "";
    const dueDateStr = String(r.due_date || r.dueDate || "").slice(0, 10);
    const defaultSubject = `Compliance Nudge: ${r.title}`;
    const defaultBody = `Dear ${companyName} Management,\n\nThis is an official compliance reminder from LicenseHub regarding your upcoming deadline:\n\nReminder: ${r.title}\nDue Date: ${dueDateStr}\n\nPlease review and submit required statutory filings at your earliest convenience.\n\nBest regards,\nLicenseHub Compliance Operations`;

    setNudgeForm({
      recipient: companyEmail,
      phone: companyPhone,
      subject: defaultSubject,
      body: defaultBody,
    });
    setNudgeModalOpen(true);
  }

  async function dispatchNudge() {
    if (!nudgeReminder) return;
    try {
      setSendingId(nudgeReminder.id);
      const res = await api.post(`/reminders/${nudgeReminder.id}/send`, nudgeForm);
      if (res?.message) {
        toast.success(res.message);
      }
      if (res?.sms_status && !res.sms_status.success) {
        toast.info(`Brevo SMS Status: ${res.sms_status.message}`);
      }
      setNudgeModalOpen(false);
    } catch {
      toast.error("Failed to dispatch reminder nudge.");
    } finally {
      setSendingId(null);
    }
  }

  async function markDone(id) {
    try {
      const res = await api.put(`/reminders/${id}`, { status: "done" });
      setItems((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/reminders/${deleteId}`);
      setItems((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Reminders"
      requirePermission="reminders.view"
      subtitle="Automated compliance nudges across email and SMS."
      actions={
        <Can permission="companies.manage">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New Reminder
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Scheduled", value: stats.upcoming, tone: "text-primary" },
          { label: "Overdue", value: stats.overdue, tone: "text-destructive" },
          { label: "Completed", value: stats.done, tone: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</div>
              <div className={`mt-2 font-display text-3xl font-semibold ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-primary" /> All reminders
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reminders, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Scheduled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="divide-y divide-border/60 p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading reminders…</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? "No reminders match your search." : "No reminders created yet."}
            </div>
          ) : (
            filteredItems.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/30 transition">
                <StatusIcon status={r.status} dueDate={r.due_date || r.dueDate} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.company?.name ? `${r.company.name} · ` : ""}
                    <span className="font-medium text-foreground">{r.channel}</span> · Due {String(r.due_date || r.dueDate || "").slice(0, 10)}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    r.status === "overdue"
                      ? "border-destructive/40 text-destructive text-[11px]"
                      : r.status === "done"
                        ? "border-emerald-500/40 text-emerald-600 text-[11px]"
                        : "text-[11px]"
                  }
                >
                  {relativeDue(r.due_date || r.dueDate, r.status)}
                </Badge>

                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      disabled={sendingId === r.id}
                      onClick={() => openNudgeModal(r)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sendingId === r.id ? "Sending…" : "Send Nudge"}
                    </Button>

                    {r.status !== "done" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markDone(r.id)}
                        title="Mark as done"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit">
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dispatch Compliance Nudge Modal */}
      <Dialog open={nudgeModalOpen} onOpenChange={setNudgeModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Dispatch Compliance Message
            </DialogTitle>
            <DialogDescription>
              Review and dispatch compliance reminder via Brevo API or Email.
            </DialogDescription>
          </DialogHeader>
          {nudgeReminder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Reminder: </span>
                  {nudgeReminder.title}
                </div>
                <Badge variant="outline">{nudgeReminder.channel}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nudge-recipient">Recipient Email</Label>
                  <Input
                    id="nudge-recipient"
                    value={nudgeForm.recipient}
                    onChange={(e) => setNudgeForm((f) => ({ ...f, recipient: e.target.value }))}
                    placeholder="e.g. client@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nudge-phone">Recipient Phone (SMS)</Label>
                  <Input
                    id="nudge-phone"
                    value={nudgeForm.phone || ""}
                    onChange={(e) => setNudgeForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. +8801712345678"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="nudge-subject">Subject</Label>
                <Input
                  id="nudge-subject"
                  value={nudgeForm.subject}
                  onChange={(e) => setNudgeForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Subject line..."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nudge-body">Message Body</Label>
                <Textarea
                  id="nudge-body"
                  rows={6}
                  value={nudgeForm.body}
                  onChange={(e) => setNudgeForm((f) => ({ ...f, body: e.target.value }))}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNudgeModalOpen(false)}>Cancel</Button>
            <Button
              disabled={sendingId !== null}
              onClick={dispatchNudge}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              {sendingId !== null ? "Dispatching…" : "Dispatch Message Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Reminder" : "New Reminder"}</DialogTitle>
            <DialogDescription>
              Configure a compliance nudge with a due date and delivery channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                maxLength={140}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                placeholder="e.g. Trade License Renewal – Acme Ltd"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Target Company</Label>
              <Select
                value={form.company_id}
                onValueChange={(v) => setForm((f) => ({ ...f, company_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const selectedComp = companies.find((c) => String(c.id) === String(form.company_id));
                if (!selectedComp) return null;
                return (
                  <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap items-center gap-3 bg-muted/40 px-3 py-1.5 rounded border border-border/40">
                    <span className="truncate">📧 {selectedComp.email || "No email registered"}</span>
                    <span className="shrink-0">📞 {selectedComp.phone || "No phone registered"}</span>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="due">Due Date</Label>
                <Input
                  id="due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Delivery Channel</Label>
              <Select
                value={form.channel}
                onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Reminder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
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
