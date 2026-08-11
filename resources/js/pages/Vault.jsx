import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderLock,
  Upload,
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  File as FileIcon,
  Download,
  Trash2,
  Lock,
  Star,
  Filter,
  FileCheck,
} from "lucide-react";

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
import { Can, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  "Trade License",
  "TIN Certificate",
  "BIN/VAT Registration",
  "Certificate of Incorporation",
  "RJSC Filing",
  "Annual Return",
  "Tax Return",
  "VAT Return",
  "Financial Statement",
  "Audit Report",
  "Bank Statement",
  "Contract",
  "Agreement",
  "NDA",
  "Employment Document",
  "Board Resolution",
  "Shareholder Resolution",
  "Land Document",
  "Insurance",
  "License",
  "Certificate",
  "Invoice",
  "Purchase Order",
  "Receipt",
  "Miscellaneous",
  "Other",
];

function FileGlyph({ ext }) {
  const base = "h-9 w-9 rounded-lg flex items-center justify-center";
  const e = (ext || "").toLowerCase();
  if (e === "pdf") return <div className={`${base} bg-destructive/10 text-destructive`}><FileText className="h-5 w-5" /></div>;
  if (e === "xlsx" || e === "xls" || e === "csv") return <div className={`${base} bg-accent/10 text-accent`}><FileSpreadsheet className="h-5 w-5" /></div>;
  if (e === "png" || e === "jpg" || e === "jpeg") return <div className={`${base} bg-primary/10 text-primary`}><FileImage className="h-5 w-5" /></div>;
  return <div className={`${base} bg-muted text-muted-foreground`}><FileIcon className="h-5 w-5" /></div>;
}

export default function Vault() {
  const { user, can } = useAuth();
  const canManage = can("vault.manage") && user?.role !== "client" && !user?.roles?.includes("client");

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [comp, setComp] = useState("all");

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    company_id: "",
    category: "Trade License",
    confidential: true,
    starred: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, cRes] = await Promise.all([
        api.get("/vault-documents"),
        api.get("/companies"),
      ]);
      if (dRes?.data) setItems(dRes.data);
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

    return items.filter((d) => {
      // Client scoping: only see documents for assigned companies
      if (isClient && currentUserId) {
        const compObj = companies.find((c) => String(c.id) === String(d.company_id || d.company?.id));
        if (compObj) {
          const assignedIds = Array.isArray(compObj.assigned_user_ids) ? compObj.assigned_user_ids.map(Number) : [];
          const isAssigned = assignedIds.includes(Number(currentUserId));
          const emailMatches = (compObj.email || "").toLowerCase() === currentUserEmail;
          if (!isAssigned && !emailMatches) return false;
        }
      }

      if (cat !== "all" && d.category !== cat) return false;
      if (comp !== "all" && String(d.company_id || "") !== String(comp) && d.company?.name !== comp) return false;
      const compName = d.company?.name || "";
      if (q && !`${d.name} ${compName}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, q, cat, comp, user, companies]);

  const stats = useMemo(() => {
    const totalSizeMb = items.reduce((s, d) => {
      const [n, u] = (d.size || "1.0 MB").split(" ");
      const mb = u === "KB" ? Number(n) / 1024 : Number(n);
      return s + (Number.isFinite(mb) ? mb : 1.0);
    }, 0);

    return {
      total: items.length,
      confidential: items.filter((i) => i.confidential).length,
      starred: items.filter((i) => i.starred).length,
      storage: `${totalSizeMb.toFixed(1)} MB`,
    };
  }, [items]);

  function openUpload() {
    setErrors({});
    setSelectedFile(null);
    setForm({
      name: "",
      company_id: companies[0]?.id ? String(companies[0].id) : "1",
      category: "Trade License",
      confidential: true,
      starred: false,
    });
    setOpen(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setForm((f) => ({ ...f, name: file.name }));
    }
  }

  async function upload() {
    setErrors({});
    if (!form.name.trim()) {
      setErrors({ name: "File name is required" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("company_id", form.company_id);
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("confidential", form.confidential ? "1" : "0");
      formData.append("starred", form.starred ? "1" : "0");
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await api.post("/vault-documents", formData);

      if (res?.success) {
        setItems((prev) => [res.data, ...prev]);
        setOpen(false);
        setSelectedFile(null);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  }

  async function toggleStar(d) {
    try {
      const res = await api.put(`/vault-documents/${d.id}`, { starred: !d.starred });
      setItems((prev) => prev.map((item) => (item.id === d.id ? res.data : item)));
    } catch {
      // Handled in api helper
    }
  }

  async function toggleConfidential(d) {
    try {
      const res = await api.put(`/vault-documents/${d.id}`, { confidential: !d.confidential });
      setItems((prev) => prev.map((item) => (item.id === d.id ? res.data : item)));
    } catch {
      // Handled in api helper
    }
  }

  function downloadDocument(d) {
    toast.success(`Downloading ${d.name}...`);
    const link = document.createElement("a");
    link.href = `/api/vault-documents/${d.id}/download`;
    link.target = "_blank";
    link.download = d.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/vault-documents/${deleteId}`);
      setItems((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch {
      setDeleteId(null);
    }
  }

  return (
    <AdminShell
      title="Document Vault"
      requirePermission="vault.view"
      subtitle="Encrypted storage for licenses, filings and confidential contracts."
      actions={
        <Can permission="vault.manage">
          <Button size="sm" onClick={openUpload}>
            <Upload className="mr-1.5 h-4 w-4" /> Upload
          </Button>
        </Can>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "DOCUMENTS", value: stats.total, tone: "text-primary" },
          { label: "CONFIDENTIAL", value: stats.confidential, tone: "text-destructive" },
          { label: "STARRED", value: stats.starred, tone: "text-amber-500" },
          { label: "STORAGE USED", value: stats.storage, tone: "text-accent" },
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
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderLock className="h-4 w-4 text-primary" /> All documents
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search documents, company name..."
                  className="h-9 w-64 pl-8 text-xs bg-background"
                />
              </div>

              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={comp} onValueChange={setComp}>
                <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(q || cat !== "all" || comp !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setCat("all");
                    setComp("all");
                  }}
                  className="h-9 text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading document vault…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No documents match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  const ext = d.ext || (d.name || "").split(".").pop() || "pdf";
                  const compName = d.company?.name || "—";
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileGlyph ext={ext} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {d.name}
                              {d.confidential && (
                                <button
                                  type="button"
                                  onClick={() => canManage && toggleConfidential(d)}
                                  title="Confidential document (Click to toggle)"
                                >
                                  <Lock className="h-3.5 w-3.5 text-destructive" />
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              .{ext}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{compName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">{d.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.size || "1.2 MB"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.uploaded_at || d.uploadedAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStar(d)}
                            title={d.starred ? "Unstar document" : "Star document"}
                          >
                            <Star className={`h-4 w-4 ${d.starred ? "fill-amber-400 text-amber-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download document"
                            onClick={() => downloadDocument(d)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete document"
                              onClick={() => setDeleteId(d.id)}
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

      {/* Upload Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>
              Files are encrypted at rest. Confidential documents require explicit share approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File Dropzone */}
            <div className="space-y-1">
              <Label>Select File to Upload</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-muted/20 p-5 text-center cursor-pointer hover:bg-muted/40 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-primary font-medium text-xs">
                    <FileCheck className="h-5 w-5 text-accent" />
                    <span>{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-primary mb-1" />
                    <p className="text-xs font-medium text-foreground">
                      Click or drag & drop a file to upload
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      PDF, XLSX, PNG, JPG or DOCX up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="file">File name *</Label>
              <Input
                id="file"
                placeholder="e.g. Nova-Textiles-TIN-2026.pdf"
                value={form.name}
                maxLength={140}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
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
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.confidential}
                onChange={(e) => setForm((f) => ({ ...f, confidential: e.target.checked }))}
              />
              <Lock className="h-3.5 w-3.5 text-destructive" />
              Mark as confidential (restrict sharing)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={upload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This document will be permanently deleted from the vault.
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
