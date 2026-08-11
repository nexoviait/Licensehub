import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Briefcase,
  ShieldCheck,
  KeyRound,
  Bell,
  Camera,
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ROLE_META, useAuth } from "@/lib/rbac";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Profile() {
  const { user, login, updateUser, can } = useAuth();
  const isAdmin = can("settings.manage") || user?.role === "super_admin" || user?.role === "admin";
  const roleMeta = ROLE_META[user?.role] || { label: user?.role || "User", initials: "US" };

  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Password visibility state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [notificationsForm, setNotificationsForm] = useState({
    email_alerts: true,
    sms_reminders: true,
    weekly_digest: true,
    system_updates: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled ?? true);
  const [toggling2FA, setToggling2FA] = useState(false);

  const [errors, setErrors] = useState({});

  // Load latest profile from API
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile");
        if (isMounted && res?.data) {
          const d = res.data;
          setProfileForm({
            name: d.name || "",
            email: d.email || "",
            phone: d.phone || "+880 1912-345680",
            designation: d.designation || "Director of Compliance",
            bio: d.bio || "",
            avatar: d.avatar || "",
          });
          if (d.two_factor_enabled !== undefined) {
            setTwoFactorEnabled(Boolean(d.two_factor_enabled));
          }
          if (d.notification_settings) {
            setNotificationsForm((prev) => ({ ...prev, ...d.notification_settings }));
          }
          // Sync with AuthContext
          if (updateUser) {
            updateUser({
              name: d.name || user?.name,
              email: d.email || user?.email,
              avatar: d.avatar || user?.avatar,
            });
          }
        }
      } catch (err) {
        // Fallback to current context state
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle2FA = async (newVal) => {
    try {
      setToggling2FA(true);
      const res = await api.post("/profile/2fa", { enabled: newVal });
      setTwoFactorEnabled(res.data?.two_factor_enabled ?? newVal);
      toast.dismiss();
      toast.success(res.data?.message || (newVal ? "2FA Protection Activated!" : "2FA Protection Deactivated."));
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to update 2FA status.");
    } finally {
      setToggling2FA(false);
    }
  };

  // Update Profile Info handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!profileForm.name.trim()) {
      setErrors({ name: "Full name is required" });
      return;
    }
    if (!profileForm.email.trim()) {
      setErrors({ email: "Email address is required" });
      return;
    }

    try {
      setSavingInfo(true);
      const res = await api.put("/profile", profileForm);
      toast.dismiss();
      toast.success(res?.message || "Profile updated successfully!");

      // Sync with global auth state so header & sidebar reflect updated avatar, name & email
      if (updateUser) {
        updateUser({
          name: profileForm.name,
          email: profileForm.email,
          avatar: profileForm.avatar,
        });
      }
    } catch (err) {
      toast.dismiss();
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setSavingInfo(false);
    }
  };

  // Update Password handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!passwordForm.current_password) {
      setErrors({ current_password: "Current password is required" });
      return;
    }
    if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
      setErrors({ new_password: "New password must be at least 8 characters long" });
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setErrors({ new_password_confirmation: "Passwords do not match" });
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put("/profile/password", passwordForm);
      toast.dismiss();
      toast.success(res?.message || "Password updated successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      toast.dismiss();
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || "Failed to update password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // Update Notifications handler
  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      const res = await api.put("/profile/notifications", notificationsForm);
      toast.dismiss();
      toast.success(res?.message || "Notification preferences saved!");
    } catch {
      toast.dismiss();
      toast.error("Failed to save notification preferences.");
    } finally {
      setSavingNotifications(false);
    }
  };

  // Avatar upload selection with automatic client-side resizing
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.dismiss();
        toast.error("Image file is too large. Please select an image under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 300;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");

          let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
          if (img.width > img.height) {
            srcWidth = img.height;
            srcX = (img.width - img.height) / 2;
          } else {
            srcHeight = img.width;
            srcY = (img.height - img.width) / 2;
          }

          ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, size, size);
          const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setProfileForm((prev) => ({ ...prev, avatar: resizedDataUrl }));
          toast.dismiss();
          toast.info("Avatar updated! Click 'Save Profile Changes' to save.");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Password strength checker
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: "", score: 0, color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { label: "Weak", score: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Fair", score: 50, color: "bg-yellow-500" };
    if (score === 3) return { label: "Good", score: 75, color: "bg-blue-500" };
    return { label: "Strong", score: 100, color: "bg-emerald-500" };
  };

  const passStrength = getPasswordStrength(passwordForm.new_password);

  return (
    <AdminShell
      title="Profile Management"
      subtitle="Manage your personal information, security credentials, and system preferences."
    >
      <div className="space-y-6">
        {/* Banner Card */}
        <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Upload Container */}
              <div className="relative group shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-white text-3xl font-bold border-2 border-white/20 shadow-inner overflow-hidden backdrop-blur-md">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Profile Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span>{roleMeta.initials}</span>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110"
                  title="Change avatar photo"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </label>
              </div>

              {/* User Bio Summary */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h2 className="text-2xl font-bold tracking-tight">{profileForm.name}</h2>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Verified User
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10 px-2.5 py-0.5 text-xs">
                    {roleMeta.label}
                  </Badge>
                </div>

                <p className="text-xs md:text-sm text-slate-300 flex items-center justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-slate-400" /> {profileForm.designation}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {profileForm.email}</span>
                </p>

                <p className="text-xs text-slate-400 max-w-2xl pt-1">
                  {profileForm.bio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Navigation Bar */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "info"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Personal Info
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="h-4 w-4" />
            Security & Password
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
        </div>

        {/* Tab 1: Personal Information */}
        {activeTab === "info" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal & Professional Details
              </CardTitle>
              <CardDescription>
                Update your account profile information and contact details.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="prof-name"
                      value={profileForm.name}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, name: e.target.value }));
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Sadia Ahmed"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="prof-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, email: e.target.value }));
                        if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="sadia@licensehub.io"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone">Phone Number (SMS Notifications)</Label>
                    <Input
                      id="prof-phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+880 1912-345680"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-designation">Designation / Job Title</Label>
                    <Input
                      id="prof-designation"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm((p) => ({ ...p, designation: e.target.value }))}
                      placeholder="Director of Compliance Operations"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-bio">Bio & Professional Summary</Label>
                  <Textarea
                    id="prof-bio"
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Brief description of your role and responsibilities..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={savingInfo} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingInfo ? "Saving Changes..." : "Save Profile Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Ensure your account uses a strong, secure password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSavePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="curr-pass">Current Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="curr-pass"
                        type={showCurrentPass ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))}
                        className={errors.current_password ? "border-red-500 pr-10" : "pr-10"}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.current_password && <p className="text-[11px] text-red-500">{errors.current_password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass">New Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="new-pass"
                        type={showNewPass ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                        className={errors.new_password ? "border-red-500 pr-10" : "pr-10"}
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.new_password && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Password strength:</span>
                          <span className="font-semibold">{passStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${passStrength.color} transition-all duration-300`} style={{ width: `${passStrength.score}%` }} />
                        </div>
                      </div>
                    )}
                    {errors.new_password && <p className="text-[11px] text-red-500">{errors.new_password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="conf-pass">Confirm New Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="conf-pass"
                        type={showConfirmPass ? "text" : "password"}
                        value={passwordForm.new_password_confirmation}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                        className={errors.new_password_confirmation ? "border-red-500 pr-10" : "pr-10"}
                        placeholder="Re-type new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.new_password_confirmation && <p className="text-[11px] text-red-500">{errors.new_password_confirmation}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button type="submit" disabled={savingPassword} className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    {savingPassword ? "Updating Password..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Security Status Box */}
            <div className="space-y-6">
              {/* 2FA Interactive Card */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${twoFactorEnabled ? "text-emerald-600" : "text-slate-400"}`} />
                      Two-Factor Authentication (2FA)
                    </CardTitle>
                    <Badge variant="outline" className={twoFactorEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"}>
                      {twoFactorEnabled ? "Active & Protected" : "Deactivated"}
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] leading-normal pt-1">
                    Require an OTP verification code sent via Email/SMS for 100% secure logins.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-lg border bg-background hover:bg-muted/10 transition">
                    <div className="space-y-0.5">
                      <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                        {twoFactorEnabled ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span>{twoFactorEnabled ? "2FA Protection Enabled" : "2FA Protection Disabled"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {twoFactorEnabled
                          ? "Secure OTP authentication is active for your account."
                          : "Enable 2FA to require multi-factor verification on login."}
                      </p>
                    </div>

                    {/* Interactive Switch Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => handleToggle2FA(e.target.checked)}
                        disabled={toggling2FA}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  {twoFactorEnabled && (
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-800 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" /> Security Method: Email & SMS OTP
                      </div>
                      <p className="text-emerald-700/90 leading-relaxed">
                        Verification codes will be dispatched to <span className="font-mono font-medium">{profileForm.email}</span> when signing in from unrecognized devices.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Active Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>Windows PC (Chrome Browser)</span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Current Device</Badge>
                    </div>
                    <p className="text-muted-foreground text-[11px]">IP: 127.0.0.1 • Active Now</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 3: Notification Preferences */}
        {activeTab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Delivery & Alert Channels
              </CardTitle>
              <CardDescription>
                Choose how LicenseHub delivers compliance deadline alerts and statutory nudges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-background hover:bg-muted/20 transition">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-indigo-600" /> Email Notifications (Brevo API)
                    </div>
                    <p className="text-xs text-muted-foreground">Receive instant email alerts for upcoming statutory filings & license renewals.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.email_alerts}
                    onChange={(e) => setNotificationsForm((f) => ({ ...f, email_alerts: e.target.checked }))}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-background hover:bg-muted/20 transition">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-600" /> SMS Reminders (Brevo SMS API)
                    </div>
                    <p className="text-xs text-muted-foreground">Send SMS alerts directly to your mobile phone when compliance items are overdue.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.sms_reminders}
                    onChange={(e) => setNotificationsForm((f) => ({ ...f, sms_reminders: e.target.checked }))}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-background hover:bg-muted/20 transition">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" /> Weekly Compliance Summary
                    </div>
                    <p className="text-xs text-muted-foreground">Get a consolidated weekly digest of all companies and legal matter progress.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.weekly_digest}
                    onChange={(e) => setNotificationsForm((f) => ({ ...f, weekly_digest: e.target.checked }))}
                    className="h-4 w-4 accent-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={handleSaveNotifications} disabled={savingNotifications} className="gap-2">
                <Save className="h-4 w-4" />
                {savingNotifications ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
