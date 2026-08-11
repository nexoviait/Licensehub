import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  Users,
  MapPin,
  Filter,
  MoreHorizontal,
  Download,
  Pencil,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ENTITY_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited Company",
  "Public Limited Company",
  "One Person Company (OPC)",
  "NGO",
  "Society",
  "Trust",
  "Cooperative Society",
  "Foundation",
  "Branch Office",
  "Liaison Office",
  "Foreign Company",
];

const entityFilters = ["All", ...ENTITY_TYPES];

export default function Companies() {
  const { user, can } = useAuth();
  const canManage = can("companies.manage") && user?.role !== "client" && !user?.roles?.includes("client");
  const [items, setItems] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    entity_type: "Private Limited Company",
    tin: "",
    bin: "",
    rjsc: "",
    address: "",
    email: "",
    phone: "",
    directors: 3,
    branches: 2,
    next_due_label: "Trade License Renewal",
    status: "upcoming",
    assigned_user_ids: [],
  });

  const loadData = async () => {
    setLoading(true);
    const [cRes, uRes] = await Promise.all([
      api.get("/companies").catch(() => null),
      api.get("/users").catch(() => null),
    ]);
    if (cRes?.data) setItems(cRes.data);
    if (uRes?.data) setUsersList(uRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const isClient = user?.role === "client" || user?.roles?.includes("client");
    const currentUserId = user?.id;
    const currentUserEmail = (user?.email || "").toLowerCase();

    return items.filter((c) => {
      // Client scoping: only see assigned companies or company matching email
      if (isClient && currentUserId) {
        const assignedIds = Array.isArray(c.assigned_user_ids) ? c.assigned_user_ids.map(Number) : [];
        const isAssigned = assignedIds.includes(Number(currentUserId));
        const emailMatches = (c.email || "").toLowerCase() === currentUserEmail;
        if (!isAssigned && !emailMatches) {
          return false;
        }
      }

      const nameMatch = (c.name || "").toLowerCase().includes(query.toLowerCase());
      const tinMatch = (c.tin || "").includes(query);
      const binMatch = (c.bin || "").includes(query);
      const matchesQ = !query || nameMatch || tinMatch || binMatch;
      const matchesF = filter === "All" || c.entity_type === filter;
      return matchesQ && matchesF;
    });
  }, [items, query, filter, user]);

  function openCreate() {
    setEditing(null);
    setErrors({});
    setForm({
      name: "",
      entity_type: "Private Limited Company",
      tin: "",
      bin: "",
      rjsc: "",
      address: "",
      email: "",
      phone: "",
      directors: 3,
      branches: 2,
      next_due_label: "Trade License Renewal",
      status: "upcoming",
      assigned_user_ids: [],
    });
    setDialogOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setErrors({});
    setForm({
      name: c.name || "",
      entity_type: c.entity_type || "Private Limited Company",
      tin: c.tin || "",
      bin: c.bin || "",
      rjsc: c.rjsc || "",
      address: c.address || "",
      email: c.email || "",
      phone: c.phone || "",
      directors: c.directors || 1,
      branches: c.branches || 1,
      next_due_label: c.next_due_label || "",
      status: c.status || "upcoming",
      assigned_user_ids: Array.isArray(c.assigned_user_ids) ? c.assigned_user_ids.map(Number) : [],
    });
    setDialogOpen(true);
  }

  async function save() {
    setErrors({});
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Company name is required";
    if (!form.entity_type) newErrors.entity_type = "Entity type is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editing) {
        const res = await api.put(`/companies/${editing.id}`, form);
        setItems((prev) => prev.map((c) => (c.id === editing.id ? res.data : c)));
      } else {
        const res = await api.post("/companies", form);
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
      await api.delete(`/companies/${deleteId}`);
      setItems((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Companies"
      requirePermission="companies.view"
      subtitle={`${items.length} companies registered · ${items.reduce((n, c) => n + (c.branches || 0), 0)} branches`}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Company
            </Button>
          )}
        </>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, TIN or BIN…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-64">
              <Select value={filter} onValueChange={(v) => setFilter(v)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{filter === "All" ? "Filter by Entity Type (All)" : filter}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Entity Types ({ENTITY_TYPES.length})</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filter !== "All" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("All")}
                className="h-9 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset Filter
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} of {items.length} companies
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading company directory…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CompanyCard key={c.id} c={c} canManage={canManage} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm font-medium">No companies match your search</p>
              <p className="text-xs text-muted-foreground">Try clearing filters or adding a new company.</p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Company" : "Add New Company"}</DialogTitle>
            <DialogDescription>Enter statutory profile, TIN, BIN and RJSC registration details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. ABC Traders Ltd."
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Entity Type</Label>
                <Select value={form.entity_type} onValueChange={(v) => setForm((f) => ({ ...f, entity_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {entityFilters.filter((f) => f !== "All").map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>TIN Number</Label>
                <Input value={form.tin} onChange={(e) => setForm((f) => ({ ...f, tin: e.target.value }))} placeholder="12-digit TIN" />
              </div>

              <div className="space-y-1">
                <Label>BIN Number</Label>
                <Input value={form.bin} onChange={(e) => setForm((f) => ({ ...f, bin: e.target.value }))} placeholder="9-digit BIN" />
              </div>

              <div className="space-y-1">
                <Label>RJSC Registration</Label>
                <Input value={form.rjsc} onChange={(e) => setForm((f) => ({ ...f, rjsc: e.target.value }))} placeholder="e.g. C-145892/2018" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Office Address</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. Motijheel C/A, Dhaka" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. contact@company.com"
                />
              </div>

              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. +8801712345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Directors Count</Label>
                <Input type="number" value={form.directors} onChange={(e) => setForm((f) => ({ ...f, directors: Number(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-1">
                <Label>Branches Count</Label>
                <Input type="number" value={form.branches} onChange={(e) => setForm((f) => ({ ...f, branches: Number(e.target.value) || 1 }))} />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Assigned Client / Users Access
              </Label>
              <p className="text-[11px] text-muted-foreground">Select users who are authorized to access and view this company's compliance data.</p>
              <div className="border rounded-md p-2 max-h-36 overflow-y-auto space-y-1 bg-background text-xs">
                {usersList.length === 0 ? (
                  <p className="text-muted-foreground text-[11px] py-1 text-center">No additional system users found</p>
                ) : (
                  usersList.map((u) => {
                    const uId = Number(u.id);
                    const isChecked = (form.assigned_user_ids || []).includes(uId);
                    return (
                      <label key={u.id} className="flex items-center justify-between p-1.5 rounded hover:bg-muted/60 cursor-pointer border border-transparent hover:border-border/40 transition">
                        <span className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = form.assigned_user_ids || [];
                              const next = e.target.checked
                                ? [...current, uId]
                                : current.filter((id) => id !== uId);
                              setForm((f) => ({ ...f, assigned_user_ids: next }));
                            }}
                            className="h-3.5 w-3.5 accent-primary rounded cursor-pointer shrink-0"
                          />
                          <span className="font-medium text-foreground truncate">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">({u.email})</span>
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 shrink-0 ml-1">
                          {u.role || u.roles?.[0]?.name || "user"}
                        </Badge>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Company"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company profile and associated statutory filings.
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

function CompanyCard({ c, canManage, onEdit, onDelete }) {
  const statusStyles = {
    completed: "bg-success/10 text-success border-success/20",
    upcoming: "bg-warning/15 text-warning-foreground border-warning/30",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const statusLabel = { completed: "On track", upcoming: "Upcoming", overdue: "Overdue" };

  return (
    <Card className="group border-border/60 shadow-[var(--shadow-card)] transition hover:border-accent/40 hover:shadow-[var(--shadow-elegant)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm">
              {c.logo || "CO"}
            </div>
            <div>
              <p className="font-medium leading-tight">{c.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.entity_type}</p>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit company</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete profile</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <InfoRow label="TIN" value={c.tin || "N/A"} />
          <InfoRow label="BIN" value={c.bin || "N/A"} />
          <InfoRow label="RJSC" value={c.rjsc || "N/A"} />
          <InfoRow
            label="Branches"
            value={
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {c.branches || 1}
              </span>
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {c.directors || 1} directors · {(c.address || "Dhaka").split(",")[0]}
          </div>

          {Array.isArray(c.assigned_user_ids) && c.assigned_user_ids.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1">
              <Users className="h-3 w-3" />
              {c.assigned_user_ids.length} Assigned User{c.assigned_user_ids.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {(c.email || c.phone) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
            {c.email && (
              <span className="inline-flex items-center gap-1.5 truncate" title={c.email}>
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <a href={`mailto:${c.email}`} className="hover:underline truncate max-w-[170px]">{c.email}</a>
              </span>
            )}
            {c.phone && (
              <span className="inline-flex items-center gap-1.5" title={c.phone}>
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
              </span>
            )}
          </div>
        )}

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Next deadline
            </span>
            <Badge variant="outline" className={statusStyles[c.status || "upcoming"]}>
              {statusLabel[c.status || "upcoming"]}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium">{c.next_due_label || "Annual Compliance"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-foreground/90">{value}</p>
    </div>
  );
}
