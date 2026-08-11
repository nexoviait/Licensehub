import React, { useEffect, useState } from "react";
import {
  Settings,
  Mail,
  Smartphone,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  History,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileImage,
  Eye,
  EyeOff,
  AlertTriangle,
  Send,
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/rbac";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("email");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const [logo, setLogo] = useState(() => localStorage.getItem("licensehub_logo") || "");
  const [favicon, setFavicon] = useState(() => localStorage.getItem("licensehub_favicon") || "");

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setLogo(result);
        localStorage.setItem("licensehub_logo", result);
        window.dispatchEvent(new Event("licensehub_logo_changed"));
        toast.success("Platform Logo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Favicon file size must be under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setFavicon(result);
        localStorage.setItem("licensehub_favicon", result);
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = result;
        toast.success("Browser Favicon updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo("");
    localStorage.removeItem("licensehub_logo");
    window.dispatchEvent(new Event("licensehub_logo_changed"));
    toast.info("Platform Logo reset to default.");
  };

  const removeFavicon = () => {
    setFavicon("");
    localStorage.removeItem("licensehub_favicon");
    toast.info("Browser Favicon reset to default.");
  };

  const [form, setForm] = useState({
    admin_receive_email: "",
    sender_name: "LicenseHub Compliance",
    sender_email: "noreply@licensehub.io",
    brevo_api_key: "",
    brevo_smtp_user: "",
    sms_sender_name: "LicenseHub",
    sms_default_country: "+880",
    platform_name: "LicenseHub Statutory Compliance Platform",
    timezone: "Asia/Dhaka (GMT+6)",
    currency: "BDT (৳)",
    session_timeout_hours: "24",
    enable_sms_nudges: true,
    enable_email_alerts: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/settings");
        const dataObj = res?.data || (res?.status === "success" ? res : null);
        if (isMounted && dataObj) {
          setForm((prev) => ({
            ...prev,
            ...dataObj,
          }));
          setTestEmailRecipient((prev) => prev || dataObj.admin_receive_email || "");
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post("/settings", form);
      const updatedData = res?.data || (res?.status === "success" ? res : null);
      if (updatedData) {
        setForm((prev) => ({
          ...prev,
          ...updatedData,
        }));
      }
      toast.dismiss();
      toast.success("System & Gateway Settings saved successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast.error("Enter a recipient email address first.");
      return;
    }
    try {
      setTestingEmail(true);
      setTestEmailResult(null);
      const res = await api.post("/settings/test-email", { recipient: testEmailRecipient });
      toast.dismiss();
      if (res.status === "warning") {
        toast.warning(res.message);
      } else {
        toast.success(res.message);
      }
      setTestEmailResult(res);
    } catch (err) {
      toast.dismiss();
      const data = err.response?.data;
      toast.error(data?.message || "Failed to send test email.");
      setTestEmailResult(data || { status: "error", message: "Failed to send test email." });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <AdminShell
      title="System Settings"
      requirePermission="settings.manage"
      subtitle="Configure global system parameters, Brevo email & SMS gateways, and client message routing."
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[680px]">
            <TabsTrigger value="email" className="gap-2 text-xs">
              <Mail className="h-4 w-4" />
              Email & Gateway
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2 text-xs">
              <Smartphone className="h-4 w-4" />
              SMS Gateway
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2 text-xs">
              <Globe className="h-4 w-4" />
              General Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs">
              <Shield className="h-4 w-4" />
              Security & Audit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab 1: Email & Communication Gateway */}
        {activeTab === "email" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Brevo Email Gateway & Reply Routing
              </CardTitle>
              <CardDescription>
                Manage Brevo API transactional email settings and designate the official admin email for incoming client replies.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-5">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <Label className="font-semibold text-xs flex items-center gap-2 text-primary">
                    <Mail className="h-4 w-4 text-primary shrink-0" /> Admin Receiving Email for Client Replies
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Designate the official admin email address where incoming replies and messages from client portal users are routed.
                  </p>
                  <Input
                    type="email"
                    value={form.admin_receive_email}
                    onChange={(e) => setForm((f) => ({ ...f, admin_receive_email: e.target.value }))}
                    placeholder="e.g. admin@licensehub.io"
                    className="max-w-md text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sender-name">Default Sender Name</Label>
                    <Input
                      id="sender-name"
                      value={form.sender_name}
                      onChange={(e) => setForm((f) => ({ ...f, sender_name: e.target.value }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sender-email">Default Sender Email</Label>
                    <Input
                      id="sender-email"
                      type="email"
                      value={form.sender_email}
                      onChange={(e) => setForm((f) => ({ ...f, sender_email: e.target.value }))}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-amber-700">
                      Must be a <span className="font-semibold">verified sender</span> in your Brevo account (Brevo Dashboard → Senders, Domains &amp; Dedicated IPs → Senders). An unverified address will be silently rejected even though sends appear to succeed here.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label htmlFor="brevo-key">Brevo API Key (Transactional Emails)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-md">
                      <Input
                        id="brevo-key"
                        type={showApiKey ? "text" : "password"}
                        value={form.brevo_api_key}
                        onChange={(e) => setForm((f) => ({ ...f, brevo_api_key: e.target.value }))}
                        placeholder="xkeysib-..."
                        className="text-xs font-mono pr-9 bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] h-9">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Dynamic System API Key
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter your Brevo v3 REST API Key (<code className="font-mono">xkeysib-...</code>) to dynamically send all transactional emails & attachments live.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label htmlFor="brevo-smtp-user">Brevo SMTP Login Username</Label>
                  <Input
                    id="brevo-smtp-user"
                    value={form.brevo_smtp_user}
                    onChange={(e) => setForm((f) => ({ ...f, brevo_smtp_user: e.target.value }))}
                    placeholder="e.g. 1234ab001@smtp-brevo.com"
                    className="max-w-md text-xs font-mono bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your Brevo account's SMTP login (found in Brevo Dashboard → SMTP &amp; API → SMTP tab). Used only as a fallback transport if the API key above is an SMTP key rather than a REST key. Fully controlled here — no server file editing needed.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                  <Label className="font-semibold text-xs flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary shrink-0" /> Send Test Email
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sends a live test using the settings above (saved or not yet saved won't matter — save first to test the values you just entered) and reports back exactly which channel delivered it.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="you@example.com"
                      className="max-w-xs text-xs bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={testingEmail}
                      onClick={handleSendTestEmail}
                      className="gap-2 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {testingEmail ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>

                  {testEmailResult && (
                    <div
                      className={
                        "rounded-md border p-3 text-[11px] flex items-start gap-2 " +
                        (testEmailResult.status === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : testEmailResult.status === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-rose-50 border-rose-200 text-rose-800")
                      }
                    >
                      {testEmailResult.status === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                      {testEmailResult.status === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                      {testEmailResult.status === "error" && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                      <span>{testEmailResult.message}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving Settings..." : "Save Email Settings"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Tab 2: SMS Gateway Settings */}
        {activeTab === "sms" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                Brevo SMS API Configuration
              </CardTitle>
              <CardDescription>
                Configure automated compliance SMS reminders and phone formatting rules.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveSettings}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sms-sender">SMS Sender ID</Label>
                    <Input
                      id="sms-sender"
                      value={form.sms_sender_name}
                      onChange={(e) => setForm((f) => ({ ...f, sms_sender_name: e.target.value }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sms-country">Default Country Code</Label>
                    <Input
                      id="sms-country"
                      value={form.sms_default_country}
                      onChange={(e) => setForm((f) => ({ ...f, sms_default_country: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border bg-muted/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">E.164 Auto-Formatting</p>
                    <p className="text-muted-foreground text-[11px]">Automatically formats local Bangladesh numbers (`019...`) to international E.164 (`88019...`).</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving Settings..." : "Save SMS Settings"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Tab 3: General Platform Config */}
        {activeTab === "general" && (
          <div className="space-y-6">
            {/* Logo & Favicon Upload Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Platform Branding & Visual Assets
                </CardTitle>
                <CardDescription>
                  Upload custom application logo and browser favicon for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload Box */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-primary" /> Platform Header Logo
                      </Label>
                      {logo && (
                        <Button variant="ghost" size="sm" onClick={removeLogo} className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Reset
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Appears on the top-left sidebar header & login portal (PNG, SVG, JPG, max 2MB).
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white shadow-inner overflow-hidden shrink-0">
                        {logo ? (
                          <img src={logo} alt="Custom Logo" className="h-full w-full object-contain p-1" />
                        ) : (
                          <ShieldCheck className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <Button variant="outline" size="sm" asChild className="w-full text-xs gap-2 border-dashed border-primary/40 hover:bg-primary/5">
                          <div>
                            <Upload className="h-3.5 w-3.5 text-primary" />
                            <span>{logo ? "Change Platform Logo" : "Upload Platform Logo"}</span>
                          </div>
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Favicon Upload Box */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-600" /> Browser Favicon Icon
                      </Label>
                      {favicon && (
                        <Button variant="ghost" size="sm" onClick={removeFavicon} className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Reset
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Appears on browser tabs & bookmarks (ICO, PNG, SVG, max 1MB).
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background border text-foreground shadow-sm overflow-hidden shrink-0">
                        {favicon ? (
                          <img src={favicon} alt="Custom Favicon" className="h-8 w-8 object-contain" />
                        ) : (
                          <Globe className="h-6 w-6 text-indigo-600" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <Button variant="outline" size="sm" asChild className="w-full text-xs gap-2 border-dashed border-indigo-500/40 hover:bg-indigo-50/50">
                          <div>
                            <Upload className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{favicon ? "Change Favicon" : "Upload Favicon Icon"}</span>
                          </div>
                        </Button>
                        <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  Platform Localization & Identity
                </CardTitle>
                <CardDescription>
                  System title, default currency, and statutory timezones.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveSettings}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="platform-name">Platform Title</Label>
                    <Input
                      id="platform-name"
                      value={form.platform_name}
                      onChange={(e) => setForm((f) => ({ ...f, platform_name: e.target.value }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tz">Timezone</Label>
                      <Input
                        id="tz"
                        readOnly
                        value={form.timezone}
                        className="text-xs bg-muted"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="curr">Default Currency</Label>
                      <Input
                        id="curr"
                        readOnly
                        value={form.currency}
                        className="text-xs bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving Settings..." : "Save Platform Settings"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        {/* Tab 4: Security & Audit */}
        {activeTab === "security" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-rose-600" />
                Security Policies & Audit Logs
              </CardTitle>
              <CardDescription>
                JWT session timeout, password complexity requirements, and system activity auditing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <p className="font-semibold text-foreground">JWT Session Lifetime</p>
                  <p className="text-muted-foreground text-[11px]">Tokens expire after 24 hours of inactivity.</p>
                </div>

                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1">
                  <p className="font-semibold text-foreground">Audit Logging</p>
                  <p className="text-muted-foreground text-[11px]">All administrative actions are logged in system audit trail.</p>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <History className="h-4 w-4 text-primary" /> System Activity & Audit Logs
                </div>
                <div className="space-y-2.5">
                  {[
                    { action: "Profile & Settings Updated", desc: "Updated system email routing and gateway preferences", time: "Just now", icon: User, color: "text-blue-600 bg-blue-50" },
                    { action: "Brevo SMS Nudge Sent", desc: "Compliance reminder dispatched to client portal user", time: "10 mins ago", icon: Smartphone, color: "text-emerald-600 bg-emerald-50" },
                    { action: "JWT Auth Token Refreshed", desc: "Session authenticated via JWT Bearer Token API", time: "1 hour ago", icon: KeyRound, color: "text-indigo-600 bg-indigo-50" },
                    { action: "System Admin Login", desc: "Successful authentication from Windows (Chrome)", time: "Today at 10:15 AM", icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${item.color}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{item.action}</div>
                          <div className="text-muted-foreground text-[11px]">{item.desc}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
