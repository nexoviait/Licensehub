import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Plus,
  Download,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Reply,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const TEMPLATES = [
  {
    id: "t1",
    name: "Trade License Renewal Reminder",
    subject: "Action Required: Trade License Renewal Notice",
    body: "Dear Client,\n\nThis is an official compliance notification from LicenseHub regarding your upcoming Trade License Renewal deadline.\n\nPlease review the attached documentation and submit required filings at your earliest convenience.\n\nBest regards,\nLicenseHub Compliance Operations",
  },
  {
    id: "t2",
    name: "VAT Return Submitted",
    subject: "VAT Return (Mushak 9.1) filed successfully",
    body: "Hello,\n\nWe have successfully prepared and filed your monthly VAT return with NBR. Please find the acknowledgement slip and filing summary attached.\n\nRegards,\nTax & Audit Compliance Team",
  },
  {
    id: "t3",
    name: "Document Request",
    subject: "Statutory Filing Notice - Documents required",
    body: "Dear Management,\n\nTo proceed with your annual RJSC filing and tax returns, please provide the following updated documents:\n1. Latest Bank Statements\n2. Audited Financial Statements\n3. Updated Director List (Form XII)\n\nThank you for your prompt cooperation.",
  },
  { id: "t4", name: "Blank Template", subject: "", body: "" },
];

function StatusBadge({ status }) {
  const map = {
    opened: { label: "Opened", cls: "border-emerald-500/40 text-emerald-600 bg-emerald-50", icon: Eye },
    Opened: { label: "Opened", cls: "border-emerald-500/40 text-emerald-600 bg-emerald-50", icon: Eye },
    Delivered: { label: "Delivered", cls: "border-blue-500/40 text-blue-600 bg-blue-50", icon: CheckCircle2 },
    Sent: { label: "Sent", cls: "border-primary/40 text-primary bg-primary/5", icon: CheckCircle2 },
    sent: { label: "Sent", cls: "border-primary/40 text-primary bg-primary/5", icon: CheckCircle2 },
    pending: { label: "Pending", cls: "border-slate-300 text-slate-600 bg-slate-50", icon: Clock },
    bounced: { label: "Bounced", cls: "border-red-500/40 text-red-600 bg-red-50", icon: AlertTriangle },
  };
  const s = map[status] || map.Sent;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] font-medium ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </Badge>
  );
}

export default function Share() {
  const { user, can } = useAuth();
  const canManage = can("share.manage") && user?.role !== "client" && !user?.roles?.includes("client");
  const isClientUser = user?.role === "client" || user?.roles?.includes("client");

  const [items, setItems] = useState([]);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientInput, setRecipientInput] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  const attachmentInputRef = useRef(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState("t4");
  const [errors, setErrors] = useState({});

  // Client Reply Modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyItem, setReplyItem] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

  // System settings state for default sender and admin receive email
  const [systemSettings, setSystemSettings] = useState({
    admin_receive_email: "",
    sender_email: "",
    sender_name: "LicenseHub Compliance",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, vRes, setRes] = await Promise.all([
        api.get("/share-logs").catch(() => null),
        api.get("/vault-documents").catch(() => null),
        api.get("/settings").catch(() => null),
      ]);
      if (sRes?.data) setItems(Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []));
      if (vRes?.data) setVaultDocs(Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []));
      if (setRes?.data?.data) {
        setSystemSettings((prev) => ({ ...prev, ...setRes.data.data }));
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenComposeModal = async () => {
    resetForm();
    let currentAdminEmail = systemSettings.admin_receive_email || "";

    try {
      const res = await api.get("/settings");
      if (res?.data?.data?.admin_receive_email) {
        currentAdminEmail = res.data.data.admin_receive_email;
        setSystemSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch {
      // fallback
    }

    if (currentAdminEmail) {
      setRecipients([currentAdminEmail]);
    }
    setOpen(true);
  };

  const filteredItems = useMemo(() => {
    const isClient = user?.role === "client" || user?.roles?.includes("client");
    const currentUserEmail = (user?.email || "").toLowerCase();

    return items.filter((r) => {
      // Client scoping: only see email logs sent to client's email address
      if (isClient && currentUserEmail) {
        const rec = (r.recipients || r.to || "").toLowerCase();
        if (!rec.includes(currentUserEmail)) return false;
      }

      const subjMatch = (r.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
      const recMatch = (r.recipients || r.to || "").toLowerCase().includes(searchTerm.toLowerCase());
      const attMatch = (Array.isArray(r.attachments) ? r.attachments.join(" ") : r.attachments || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = !searchTerm || subjMatch || recMatch || attMatch;

      const matchesStatus =
        statusFilter === "all" ||
        (r.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter, user]);

  const stats = useMemo(() => ({
    sent: items.filter((i) => ["sent", "opened", "Delivered", "Sent", "Opened"].includes(i.status)).length,
    opened: items.filter((i) => ["opened", "Opened"].includes(i.status)).length,
    pending: items.filter((i) => ["pending", "Pending"].includes(i.status)).length,
    bounced: items.filter((i) => ["bounced", "Bounced"].includes(i.status)).length,
  }), [items]);

  function applyTemplate(id) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setSubject(t.subject);
    setBody(t.body);
    setErrors((e) => ({ ...e, subject: null, body: null }));
  }

  function addRecipient() {
    const text = recipientInput.trim();
    if (!text) return;
    const splitEmails = text.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    const newRecs = [...recipients];
    let invalidFound = false;

    splitEmails.forEach((email) => {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (valid && !newRecs.includes(email)) {
        newRecs.push(email);
      } else if (!valid) {
        invalidFound = true;
      }
    });

    if (invalidFound && newRecs.length === recipients.length) {
      setErrors((e) => ({ ...e, recipients: "Please enter a valid email address (e.g. name@domain.com)" }));
      return;
    }

    setRecipients(newRecs);
    setRecipientInput("");
    setErrors((e) => ({ ...e, recipients: null }));
  }

  function addAttachmentText() {
    const a = attachmentInput.trim();
    if (!a) return;
    if (attachments.includes(a)) return;
    setAttachments((x) => [...x, a]);
    setAttachmentInput("");
  }

  function handleLocalAttachmentChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (attachments.includes(file.name)) return;
      setAttachments((x) => [...x, file.name]);
      toast.success(`Attached ${file.name}`);
    }
  }

  function attachVaultDocument(docName) {
    if (!docName || docName === "none") return;
    if (attachments.includes(docName)) {
      toast.error("Document already attached");
      return;
    }
    setAttachments((x) => [...x, docName]);
    toast.success(`Attached vault document: ${docName}`);
  }

  function resetForm() {
    setEditingItem(null);
    setRecipients([]);
    setRecipientInput("");
    setAttachments([]);
    setAttachmentInput("");
    setSubject("");
    setBody("");
    setTemplateId("t4");
    setErrors({});
  }

  function handleEdit(item) {
    setEditingItem(item);
    setSubject(item.subject || "");
    const recArr = (item.recipients || item.to || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setRecipients(recArr);
    setRecipientInput("");

    const attArr = Array.isArray(item.attachments)
      ? item.attachments
      : (item.attachments || "").split(",").map((s) => s.trim()).filter(Boolean);
    setAttachments(attArr);
    setAttachmentInput("");
    setBody(item.body || "");
    setOpen(true);
  }

  async function handleDelete(item) {
    if (!window.confirm(`Are you sure you want to delete the share record "${item.subject}"?`)) {
      return;
    }
    try {
      await api.delete(`/share-logs/${item.id}`);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success("Share record deleted successfully");
    } catch {
      toast.error("Failed to delete share record");
    }
  }

  async function send() {
    const newErrors = {};
    let finalRecipients = [...recipients];

    if (recipientInput.trim()) {
      const email = recipientInput.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (valid && !finalRecipients.includes(email)) {
        finalRecipients.push(email);
        setRecipients(finalRecipients);
        setRecipientInput("");
      } else if (!valid) {
        newErrors.recipients = "Valid recipient email address is required";
      }
    }

    if (finalRecipients.length === 0) {
      newErrors.recipients = "Please add at least one recipient email address";
    }

    if (!subject.trim()) {
      newErrors.subject = "Subject line is required";
    }

    if (!body.trim()) {
      newErrors.body = "Message body content is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSending(true);
    setErrors({});

    try {
      const payload = {
        subject: subject.trim(),
        recipients: finalRecipients.join(", "),
        body: body.trim(),
        attachments: attachments.join(", "),
        status: "Sent",
      };

      if (editingItem) {
        const res = await api.put(`/share-logs/${editingItem.id}`, payload);
        const updatedLog = res.data?.data || res.data;
        setItems((prev) => prev.map((x) => (x.id === editingItem.id ? updatedLog : x)));
        toast.success("Share record updated successfully");
      } else {
        const res = await api.post("/share-logs", payload);
        const createdLog = res.data?.data || res.data;
        setItems((prev) => [createdLog, ...prev]);
      }
      resetForm();
      setOpen(false);
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrs = err.response.data.errors;
        const formatted = {};
        if (backendErrs.subject) formatted.subject = backendErrs.subject[0];
        if (backendErrs.recipients) formatted.recipients = backendErrs.recipients[0];
        if (backendErrs.body) formatted.body = backendErrs.body[0];
        setErrors(formatted);
      } else {
        toast.error(err.response?.data?.message || "Failed to save share record");
      }
    } finally {
      setSending(false);
    }
  }

  function openReplyModal(item) {
    setReplyItem(item);
    setReplySubject(`Re: ${item.subject || "Compliance Notification"}`);
    setReplyBody(`Dear Admin Team,\n\nRegarding: ${item.subject || "Compliance Notification"}\n\n`);
    setReplyModalOpen(true);
  }

  async function handleSendReply() {
    if (!replyBody.trim()) {
      toast.error("Please enter a reply message body.");
      return;
    }
    try {
      setReplySending(true);
      const res = await api.post("/share-logs/reply", {
        parent_id: replyItem?.id,
        subject: replySubject.trim(),
        body: replyBody.trim(),
      });
      toast.success(res?.message || "Reply email dispatched successfully to Admin!");
      setReplyModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply email.");
    } finally {
      setReplySending(false);
    }
  }

  async function resend(rec) {
    try {
      toast.info(`Resending email to ${rec.recipients || "recipient"}...`);
      const payload = {
        subject: rec.subject,
        recipients: rec.recipients || (rec.to ? rec.to.join(", ") : ""),
        body: rec.body || `Resent message: ${rec.subject}`,
        attachments: Array.isArray(rec.attachments) ? rec.attachments.join(", ") : rec.attachments || "",
        status: "Sent",
      };

      const res = await api.post("/share-logs", payload);
      const createdLog = res.data?.data || res.data;
      setItems((prev) => [createdLog, ...prev]);
    } catch {
      toast.error("Failed to resend email nudge.");
    }
  }

  function downloadAttachment(fileName) {
    toast.success(`Downloading ${fileName}...`);
    const matchedDoc = vaultDocs.find((d) => d.name === fileName);
    const docId = matchedDoc ? matchedDoc.id : null;

    const link = document.createElement("a");
    if (docId) {
      link.href = `/api/vault-documents/${docId}/download`;
    } else {
      const content = `LicenseHub Email Attachment\n----------------------------------------\nFile Name: ${fileName}\nDispatched via LicenseHub Brevo Gateway.`;
      const blob = new Blob([content], { type: "application/octet-stream" });
      link.href = URL.createObjectURL(blob);
    }
    link.target = "_blank";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <AdminShell
      title="Share by E-mail"
      requirePermission="share.view"
      subtitle="Send compliance updates and vault documents with delivery tracking via Brevo API Gateway."
      actions={
        <Button size="sm" onClick={handleOpenComposeModal} className="gap-1.5 font-semibold shadow-sm">
          <Send className="h-4 w-4" /> Compose Email
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Sent", value: stats.sent, tone: "text-primary" },
          { label: "Opened", value: stats.opened, tone: "text-emerald-600" },
          { label: "Pending", value: stats.pending, tone: "text-slate-500" },
          { label: "Bounced", value: stats.bounced, tone: "text-destructive" },
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
            <Mail className="h-4 w-4 text-primary" /> Recent shares
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subject, recipient, file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs bg-background"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="h-9 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading share logs…
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "No email dispatches match your search filters."
                      : "No email dispatches logged yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((r) => {
                  const recStr = r.recipients || (r.to ? r.to.join(", ") : "");
                  const attList = Array.isArray(r.attachments)
                    ? r.attachments
                    : (r.attachments || "").split(",").map((s) => s.trim()).filter(Boolean);

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[280px]">
                        <div className="truncate text-sm font-medium text-slate-900">{r.subject}</div>
                        {r.opens > 0 && <div className="text-[11px] text-muted-foreground">Opened {r.opens}×</div>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="max-w-[220px] truncate" title={recStr}>{recStr}</div>
                      </TableCell>
                      <TableCell>
                        {attList.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {attList.map((file, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                onClick={() => downloadAttachment(file)}
                                title={`Click to download ${file}`}
                                className="text-[11px] font-normal gap-1 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition cursor-pointer py-0.5 group"
                              >
                                <Paperclip className="h-3 w-3 text-primary shrink-0" />
                                <span className="truncate max-w-[120px]">{file}</span>
                                <Download className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-0.5" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.sent_at || r.sentAt}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => resend(r)}
                              title="Resend Email"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              Resend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(r)}
                              title="Edit Share Record"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDelete(r)}
                              title="Delete Share Record"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1.5 font-medium"
                            onClick={() => openReplyModal(r)}
                          >
                            <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                            Reply Email
                          </Button>
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

      {/* Compose/Edit Dialog Modal */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Share Record" : "Compose E-mail"}</DialogTitle>
            <DialogDescription>
              Dispatched securely via LicenseHub Brevo Gateway using system sender email settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Template</Label>
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  maxLength={160}
                  placeholder="e.g. VAT Return filed successfully"
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((err) => ({ ...err, subject: null }));
                  }}
                  className={errors.subject ? "border-red-500" : ""}
                />
                {errors.subject && (
                  <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.subject}
                  </p>
                )}
              </div>
            </div>

            {/* Recipients Field */}
            <div className="space-y-1.5">
              <Label htmlFor="recipients" className="text-xs font-semibold">To (Recipients)</Label>

              {isClientUser ? (
                <p className="text-xs text-muted-foreground">
                  Sent directly to your compliance admin team at{" "}
                  <span className="font-medium text-foreground">
                    {recipients[0] || systemSettings.admin_receive_email || "the admin address configured in System Settings"}
                  </span>
                  .
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-normal">Press Enter or comma to add recipient</span>
                  </div>
                  <div
                    className={`min-h-[44px] p-2 rounded-md border bg-background flex flex-wrap items-center gap-1.5 transition focus-within:ring-2 focus-within:ring-ring focus-within:border-input ${
                      errors.recipients ? "border-red-500 ring-red-300" : "border-input"
                    }`}
                  >
                    {recipients.map((r) => (
                      <Badge key={r} variant="secondary" className="gap-1 pl-2.5 pr-1 py-1 bg-primary/10 text-primary border-primary/20 font-medium text-xs">
                        <span>{r}</span>
                        <button
                          type="button"
                          onClick={() => setRecipients((x) => x.filter((v) => v !== r))}
                          className="rounded-full p-0.5 hover:bg-primary/20 transition text-primary/70 hover:text-primary"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}

                    <input
                      id="recipients"
                      type="email"
                      value={recipientInput}
                      placeholder={recipients.length === 0 ? "Enter recipient email (e.g. client@company.com)…" : "Add another email…"}
                      onChange={(e) => {
                        setRecipientInput(e.target.value);
                        if (errors.recipients) setErrors((err) => ({ ...err, recipients: null }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addRecipient();
                        }
                      }}
                      onBlur={() => {
                        if (recipientInput.trim()) addRecipient();
                      }}
                      className="flex-1 bg-transparent text-xs border-0 outline-none focus:outline-none min-w-[180px] h-7 text-foreground placeholder:text-muted-foreground"
                    />

                    {recipientInput.trim() && (
                      <Button type="button" size="sm" variant="ghost" onClick={addRecipient} className="h-6 px-2 text-xs text-primary font-medium">
                        + Add
                      </Button>
                    )}
                  </div>
                </>
              )}
              {errors.recipients && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.recipients}
                </p>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Attachments</Label>
                {vaultDocs.length > 0 && (
                  <Select onValueChange={attachVaultDocument}>
                    <SelectTrigger className="h-7 text-xs border-primary/30 w-[200px]">
                      <SelectValue placeholder="Attach Vault File…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select from Vault…</SelectItem>
                      {vaultDocs.map((doc) => (
                        <SelectItem key={doc.id} value={doc.name}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={attachmentInputRef}
                  className="hidden"
                  onChange={handleLocalAttachmentChange}
                />
                <Input
                  value={attachmentInput}
                  placeholder="e.g. Nova-TL-2026.pdf or select file"
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttachmentText();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  title="Browse local computer file to attach"
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {attachmentInput.trim() && (
                  <Button type="button" variant="outline" onClick={addAttachmentText}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {attachments.map((a) => (
                    <Badge key={a} variant="outline" className="gap-1 pl-2 pr-1 bg-muted/40">
                      <Paperclip className="h-3 w-3 text-primary" />
                      <span>{a}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((x) => x.filter((v) => v !== a))}
                        className="rounded-sm p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={6}
                value={body}
                maxLength={4000}
                placeholder="Write your email message here…"
                onChange={(e) => {
                  setBody(e.target.value);
                  if (errors.body) setErrors((err) => ({ ...err, body: null }));
                }}
                className={errors.body ? "border-red-500" : ""}
              />
              {errors.body && (
                <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.body}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> Sending via Brevo…
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Reply Email Dialog Modal */}
      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-primary" />
              Reply to Compliance Email
            </DialogTitle>
            <DialogDescription>
              Your reply will be delivered live via Brevo API directly to the Admin Compliance Team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Recipient (Admin Receive Email)</Label>
              <Input
                readOnly
                value={systemSettings.admin_receive_email || "Not configured in System Settings"}
                className="bg-muted text-xs font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subject</Label>
              <Input
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Re: Subject"
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Your Reply Message *</Label>
              <Textarea
                rows={5}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your response, clarification, or inquiry to the admin compliance team..."
                className="text-xs leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyModalOpen(false)} disabled={replySending}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={replySending} className="gap-1.5">
              <Send className="h-4 w-4" />
              {replySending ? "Sending Reply…" : "Send Reply Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
