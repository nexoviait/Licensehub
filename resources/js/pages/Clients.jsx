import React, { useEffect, useMemo, useState } from "react";
import {
  UserRound,
  Plus,
  Mail,
  Send,
  Ban,
  RotateCcw,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const ROLES = ["Owner", "Finance", "Viewer"];

function StatusBadge({ status }) {
  const map = {
    active: "border-accent/40 text-accent bg-accent/5",
    invited: "border-primary/40 text-primary bg-primary/5",
    revoked: "border-destructive/40 text-destructive bg-destructive/5",
  };
  const label = { active: "Active", invited: "Invited", revoked: "Revoked" };
  const st = status || "invited";

  return <Badge variant="outline" className={`text-[11px] ${map[st] || map.invited}`}>{label[st] || st}</Badge>;
}

function initialsOf(name) {
  if (!name) return "CL";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Clients() {
  const { can } = useAuth();
  const canManage = can("clients.manage");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [revokeId, setRevokeId] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    company_id: "",
    contact_name: "",
    contact_email: "",
    role: "Viewer",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, compRes] = await Promise.all([
        api.get("/client-accesses"),
        api.get("/companies"),
      ]);
      if (cRes?.data) setItems(cRes.data);
      if (compRes?.data) setCompanies(compRes.data);
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
    const active = items.filter((c) => c.status === "active").length;
    const invited = items.filter((c) => c.status === "invited").length;
    const onboarded = new Set(items.filter((c) => c.status !== "revoked").map((c) => c.company_id || c.company)).size;
    const documentsShared = items.reduce((s, c) => s + Number(c.documents_shared || c.documentsShared || 0), 0);
    return { active, invited, onboarded, documentsShared };
  }, [items]);

  function openInviteModal() {
    setErrors({});
    setForm({
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      contact_name: "",
      contact_email: "",
      role: "Viewer",
    });
    setOpen(true);
  }

  async function invite() {
    setErrors({});
    const newErrors = {};

    if (!form.contact_name.trim()) {
      newErrors.contact_name = "Contact name is required";
    }

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim());
    if (!form.contact_email.trim()) {
      newErrors.contact_email = "Contact email is required";
    } else if (!valid) {
      newErrors.contact_email = "Enter a valid email address (e.g. name@company.com)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Return directly so NO toast popups appear!
    }

    try {
      const payload = {
        company_id: form.company_id,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        role: form.role,
        status: "invited",
      };

      const res = await api.post("/client-accesses", payload);
      setItems((prev) => [res.data, ...prev]);
      setOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function resend(c) {
    toast.success(`Invite resent to ${c.contact_email || c.contactEmail}`);
  }

  async function reactivate(id) {
    try {
      const res = await api.put(`/client-accesses/${id}`, { status: "active" });
      setItems((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    } catch {
      // Handled in api helper
    }
  }

  async function confirmRevoke() {
    if (!revokeId) return;
    try {
      const res = await api.put(`/client-accesses/${revokeId}`, { status: "revoked" });
      setItems((prev) => prev.map((c) => (c.id === revokeId ? res.data : c)));
      setRevokeId(null);
    } catch {
      setRevokeId(null);
    }
  }

  return (
    <AdminShell
      title="Client Portal"
      requirePermission="clients.view"
      subtitle="Invite clients and manage their access to companies, documents and filings."
      actions={
        <Can permission="clients.manage">
          <Button size="sm" onClick={openInviteModal}>
            <Plus className="mr-1.5 h-4 w-4" /> Invite client
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">ACTIVE PORTAL USERS</div>
            <div className="mt-2 font-display text-3xl font-semibold text-accent">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">PENDING INVITES</div>
            <div className="mt-2 font-display text-3xl font-semibold text-primary">{stats.invited}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">COMPANIES ONBOARDED</div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.onboarded}</div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">DOCUMENTS SHARED</div>
            <div className="mt-2 font-display text-3xl font-semibold">{stats.documentsShared}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" /> Client access
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Loading client accesses…
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No client access invitations created yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => {
                  const compName = c.company?.name || c.company || "—";
                  const name = c.contact_name || c.contactName;
                  const email = c.contact_email || c.contactEmail;
                  const docs = c.documents_shared ?? c.documentsShared ?? 0;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initialsOf(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{compName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">{c.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.last_login || c.lastLogin || "Never"}</TableCell>
                      <TableCell className="text-sm font-medium">{docs}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            {c.status === "invited" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resend(c)}
                                title="Resend invite"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {c.status === "revoked" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reactivate(c.id)}
                                title="Reactivate access"
                              >
                                <RotateCcw className="h-4 w-4 text-accent" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokeId(c.id)}
                                title="Revoke access"
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
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

      {/* Invite Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite client</DialogTitle>
            <DialogDescription>
              Grant a client contact access to their company workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Contact Name Field + Inline Validation */}
            <div className="space-y-1">
              <Label htmlFor="contact_name">Contact name *</Label>
              <Input
                id="contact_name"
                placeholder="e.g. Mahmudul Karim"
                value={form.contact_name}
                maxLength={140}
                onChange={(e) => {
                  setForm((f) => ({ ...f, contact_name: e.target.value }));
                  setErrors((err) => ({ ...err, contact_name: null }));
                }}
              />
              {errors.contact_name && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors.contact_name}</p>
              )}
            </div>

            {/* Contact Email Field + Inline Validation */}
            <div className="space-y-1">
              <Label htmlFor="contact_email">Contact email *</Label>
              <Input
                id="contact_email"
                placeholder="name@company.com"
                value={form.contact_email}
                maxLength={160}
                onChange={(e) => {
                  setForm((f) => ({ ...f, contact_email: e.target.value }));
                  setErrors((err) => ({ ...err, contact_email: null }));
                }}
              />
              {errors.contact_email && (
                <p className="text-[11px] font-medium text-destructive mt-1">{errors.contact_email}</p>
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
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={invite}>
              <Send className="mr-1.5 h-4 w-4" /> Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={revokeId !== null} onOpenChange={(o) => !o && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke client access?</AlertDialogTitle>
            <AlertDialogDescription>
              The user will no longer be able to log in to view company documents or filings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
