import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Filter,
  ListFilter,
  CalendarDays,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { companies as mockCompanies } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EVENT_TYPES = [
  "Trade License",
  "VAT Return",
  "Income Tax",
  "RJSC Filing",
  "Audit Report",
  "Drug License",
  "TDS Return",
  "NGO Bureau Report",
  "Partnership Deed",
];

const statusStyles = {
  completed: "bg-success/10 text-success border-success/25",
  upcoming: "bg-warning/15 text-warning-foreground border-warning/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/25",
};

const statusDot = {
  completed: "bg-success",
  upcoming: "bg-warning",
  overdue: "bg-destructive",
};

const DEFAULT_ASSIGNEES = [
  { name: "Adv. Hasan", role: "lawyer" },
  { name: "Rahat CA", role: "accountant" },
  { name: "Nadia CA", role: "accountant" },
  { name: "M. Karim", role: "compliance_officer" },
  { name: "Sadia Ahmed", role: "super_admin" },
  { name: "Unassigned", role: "none" },
];

export default function Calendar() {
  const { user, can } = useAuth();
  const canManage = can("calendar.manage") && user?.role !== "client" && !user?.roles?.includes("client");

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState(mockCompanies);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    company_id: "",
    type: "Trade License",
    title: "",
    status: "upcoming",
    assignee: "Adv. Hasan",
    date: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, cRes, uRes] = await Promise.all([
        api.get("/compliance-events").catch(() => null),
        api.get("/companies").catch(() => null),
        api.get("/users").catch(() => null),
      ]);
      if (eRes?.data) setEvents(eRes.data);
      if (cRes?.data) setCompanies(cRes.data);
      const fetchedUsers = Array.isArray(uRes?.data) ? uRes.data : (Array.isArray(uRes) ? uRes : []);
      setUsers(fetchedUsers);
    } catch {
      // Fallback if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assigneeList = useMemo(() => {
    const map = new Map();
    DEFAULT_ASSIGNEES.forEach((a) => map.set(a.name, a));
    users.forEach((u) => {
      if (u.name) {
        map.set(u.name, {
          name: u.name,
          role: u.roles?.[0]?.name || "user"
        });
      }
    });
    return Array.from(map.values());
  }, [users]);

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        const cMatch = company === "all" || String(e.company_id || e.companyId) === String(company);
        const sMatch = status === "all" || e.status === status;
        return cMatch && sMatch;
      }),
    [events, company, status]
  );

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const counts = useMemo(() => {
    const inMonth = filtered.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear();
    });
    return {
      total: inMonth.length,
      upcoming: inMonth.filter((e) => e.status === "upcoming").length,
      overdue: inMonth.filter((e) => e.status === "overdue").length,
      completed: inMonth.filter((e) => e.status === "completed").length,
    };
  }, [filtered, cursor]);

  const shift = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      type: "Trade License",
      title: "",
      status: "upcoming",
      assignee: assigneeList[0]?.name || "Adv. Hasan",
      date: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  function openEdit(e) {
    setEditing(e);
    setErrors({});
    setForm({
      company_id: String(e.company_id || e.companyId || companies[0]?.id || 1),
      type: e.type || "Trade License",
      title: e.title || "",
      status: e.status || "upcoming",
      assignee: e.assignee || assigneeList[0]?.name || "Adv. Hasan",
      date: e.date || new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Event title is required";
    if (!form.assignee.trim()) newErrors.assignee = "Please select an assignee";
    if (!form.date) newErrors.date = "Due date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editing) {
        const res = await api.put(`/compliance-events/${editing.id}`, form);
        const updated = res.data;
        setEvents((prev) => prev.map((ev) => (ev.id === editing.id ? updated : ev)));
      } else {
        const res = await api.post("/compliance-events", form);
        const created = res.data;
        setEvents((prev) => [created, ...prev]);
        if (created.date) {
          const evDate = new Date(created.date);
          setCursor(new Date(evDate.getFullYear(), evDate.getMonth(), 1));
          setSelectedDay(String(created.date).slice(0, 10));
        }
      }
      setDialogOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function toggleStatus(e) {
    const next = e.status === "completed" ? "upcoming" : "completed";
    try {
      const res = await api.put(`/compliance-events/${e.id}`, { status: next });
      setEvents((prev) => prev.map((ev) => (ev.id === e.id ? res.data : ev)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/compliance-events/${deleteId}`);
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Compliance Calendar"
      requirePermission="calendar.view"
      subtitle="Every statutory obligation across your portfolio — auto-generated from the compliance catalogue."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => toast.success("Exporting compliance schedule...")}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Event
            </Button>
          )}
        </>
      }
    >
      {/* Toolbar */}
      <Card className="border-border/60">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[10rem] text-center">
              <p className="font-display text-lg font-semibold leading-tight">{monthLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                {counts.total} events · {counts.overdue} overdue
              </p>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1"
              onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            >
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <LegendDot cls="bg-success" label="Completed" />
              <LegendDot cls="bg-warning" label="Upcoming" />
              <LegendDot cls="bg-destructive" label="Overdue" />
            </div>

            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="h-9 w-[180px]">
                <Building2 className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[140px]">
                <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="month" className="space-y-4">
        <TabsList>
          <TabsTrigger value="month">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Month
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListFilter className="mr-1.5 h-3.5 w-3.5" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <MonthGrid
              cursor={cursor}
              events={filtered}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />

            <DayDetailsPanel
              day={selectedDay}
              events={filtered}
              onToggleStatus={toggleStatus}
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
              canManage={canManage}
            />
          </div>
        </TabsContent>

        <TabsContent value="list">
          <ListView
            events={filtered}
            onToggleStatus={toggleStatus}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>

      {/* Add / Edit Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Compliance Event" : "Add Compliance Event"}</DialogTitle>
            <DialogDescription>Schedule a license renewal, tax filing, or statutory deadline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Event Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Trade License Renewal"
              />
              {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
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
                <Label>Event Category</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Assignee</Label>
                <Select
                  value={form.assignee}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, assignee: v }));
                    if (errors.assignee) setErrors((prev) => ({ ...prev, assignee: null }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select Assignee" /></SelectTrigger>
                  <SelectContent>
                    {assigneeList.map((a) => (
                      <SelectItem key={a.name} value={a.name}>
                        {a.name} {a.role && a.role !== "none" ? `(${a.role.replace("_", " ")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignee && <p className="text-[11px] text-destructive">{errors.assignee}</p>}
              </div>

              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
                {errors.date && <p className="text-[11px] text-destructive">{errors.date}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Event"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Compliance Event?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the event from your compliance calendar.</AlertDialogDescription>
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

function LegendDot({ cls, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", cls)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function toYYYYMMDD(year, monthIndex, day) {
  const y = year;
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function MonthGrid({ cursor, events, selectedDay, onSelectDay }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const gridCells = [];

  for (let i = startDay - 1; i >= 0; i--) {
    gridCells.push({ day: prevMonthDays - i, currentMonth: false, monthOffset: -1 });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({ day: d, currentMonth: true, monthOffset: 0 });
  }

  const remaining = (gridCells.length <= 35 ? 35 : 42) - gridCells.length;
  for (let i = 1; i <= remaining; i++) {
    gridCells.push({ day: i, currentMonth: false, monthOffset: 1 });
  }

  const today = new Date();
  const isToday = (day, monthOffset) => {
    const targetDate = new Date(year, month + monthOffset, day);
    return (
      targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    );
  };

  const getCellDateStr = (day, monthOffset) => {
    let targetYear = year;
    let targetMonth = month + monthOffset;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    return toYYYYMMDD(targetYear, targetMonth, day);
  };

  const getDayEvents = (day, monthOffset) => {
    const dateStr = getCellDateStr(day, monthOffset);
    return events.filter((e) => String(e.date || "").slice(0, 10) === dateStr);
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-muted-foreground py-2 bg-muted/30">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr gap-px bg-border/40">
          {gridCells.map((cell, idx) => {
            const dayEvts = getDayEvents(cell.day, cell.monthOffset);
            const dateStr = getCellDateStr(cell.day, cell.monthOffset);
            const isSel = Boolean(dateStr) && Boolean(selectedDay) && selectedDay === dateStr;

            return (
              <div
                key={idx}
                onClick={() => onSelectDay(dateStr)}
                className={cn(
                  "min-h-[100px] bg-background p-2 transition flex flex-col justify-between cursor-pointer hover:bg-muted/40",
                  !cell.currentMonth && "opacity-50 bg-muted/20",
                  isToday(cell.day, cell.monthOffset) && "bg-accent/5 font-semibold",
                  isSel && "ring-2 ring-primary ring-inset"
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(cell.day, cell.monthOffset) && "bg-primary text-primary-foreground font-bold"
                    )}
                  >
                    {cell.day}
                  </span>
                  {dayEvts.length > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono font-semibold">{dayEvts.length}</span>
                  )}
                </div>

                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayEvts.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[10px] font-medium border",
                        statusStyles[ev.status]
                      )}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{dayEvts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DayDetailsPanel({ day, events, onToggleStatus, onEdit, onDelete, canManage }) {
  if (!day) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-xs">
          <CalendarDays className="h-8 w-8 text-muted-foreground/60 mb-2" />
          Click on any calendar day to view scheduled events.
        </CardContent>
      </Card>
    );
  }

  const dayEvents = events.filter((e) => String(e.date || "").slice(0, 10) === day);
  const formattedDay = new Date(day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{formattedDay}</CardTitle>
          <Badge variant="outline" className="text-xs">{dayEvents.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {dayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No events scheduled for this day.</p>
        ) : (
          dayEvents.map((e) => (
            <div key={e.id} className="rounded-lg border p-3 bg-card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-xs leading-snug">{e.title}</span>
                <Badge variant="outline" className={cn("text-[10px]", statusStyles[e.status])}>
                  {e.status}
                </Badge>
              </div>

              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p>{e.company?.name || e.companyName || "—"} · {e.type}</p>
                <p>Assigned to: <span className="text-foreground">{e.assignee}</span></p>
              </div>

              {canManage && (
                <div className="flex items-center gap-2 pt-2 border-t text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] flex-1"
                    onClick={() => onToggleStatus(e)}
                  >
                    {e.status === "completed" ? "Mark Upcoming" : "Mark Completed"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ListView({ events, onToggleStatus, onEdit, onDelete, canManage }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No events found matching your filters.</div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card">
              <div className="flex items-center gap-3">
                <span className={cn("h-2.5 w-2.5 rounded-full", statusDot[e.status])} />
                <div>
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.company?.name || e.companyName || "—"} · {e.type} · Assignee: {e.assignee}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium">{e.date}</span>
                <Badge variant="outline" className={cn("text-[11px]", statusStyles[e.status])}>
                  {e.status}
                </Badge>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onToggleStatus(e)}>
                      {e.status === "completed" ? "Mark Pending" : "Mark Done"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
