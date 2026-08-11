import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, KeyRound, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/rbac";
import axios from "axios";
import { toast } from "sonner";

export function LoginScreen() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [step, setStep] = useState("login"); // "login" | "2fa"
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [targetEmail, setTargetEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!email || !email.trim()) {
      newErrors.email = "Please enter your registered email address.";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = "Please enter a valid email format (e.g. user@licensehub.io).";
    }

    if (!password) {
      newErrors.password = "Please enter your account password.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await axios.post("/api/auth/login", {
        email: email.trim(),
        password: password
      });

      if (res.data?.status === "2fa_required") {
        setTempToken(res.data.temp_token);
        setTargetEmail(res.data.email || email);
        setOtpCode("");
        setStep("2fa");
        toast.info("2FA Verification Required! Enter the 6-digit OTP code sent to your email.");
      } else if (res.data && res.data.access_token) {
        const token = res.data.access_token;
        const apiUser = res.data.user;

        login(token, apiUser);
        toast.success(`Welcome back, ${apiUser.name}`);
        navigate("/", { replace: true });
      } else {
        setErrors({
          general: "Authentication failed. Please verify your credentials and try again."
        });
      }
    } catch (err) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;

      if (status === 401 || status === 403) {
        setErrors({
          general: "Invalid email address or password. Please verify your login credentials.",
          email: "Verify your email address.",
          password: "Verify your password."
        });
      } else if (status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        const backendErrors = err.response.data.errors;
        if (backendErrors.email) serverErrors.email = backendErrors.email[0];
        if (backendErrors.password) serverErrors.password = backendErrors.password[0];
        setErrors(serverErrors);
      } else {
        setErrors({
          general: apiMessage || "An unexpected error occurred. Please try again later."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    try {
      setLoading(true);
      setErrors({});
      const res = await axios.post("/api/auth/resend-2fa", { temp_token: tempToken });
      if (res.data?.temp_token) {
        setTempToken(res.data.temp_token);
      }
      toast.success("A new 6-digit OTP code has been sent to " + targetEmail);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend 2FA code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpCode || !otpCode.trim()) {
      setErrors({ otp: "Please enter the 6-digit OTP code." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await axios.post("/api/auth/verify-2fa", {
        temp_token: tempToken,
        otp: otpCode.trim()
      });

      if (res.data && res.data.access_token) {
        const token = res.data.access_token;
        const apiUser = res.data.user;

        login(token, apiUser);
        toast.success(`2FA Verification Successful! Welcome back, ${apiUser.name}`);
        navigate("/", { replace: true });
      } else {
        setErrors({
          otp: "2FA Verification failed. Please check the OTP code and try again."
        });
      }
    } catch (err) {
      setErrors({
        otp: err.response?.data?.message || "Invalid or expired OTP code. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold font-display tracking-tight">
              LicenseHub
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Enterprise Compliance & Entity Management Portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {step === "2fa" ? (
            <form onSubmit={handleVerify2FA} className="space-y-4" noValidate>
              {errors.otp && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errors.otp}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-xs font-semibold">
                  6-Digit OTP Code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                    }}
                    className={`pl-9 h-11 bg-muted/30 text-base tracking-widest font-mono font-semibold text-center ${
                      errors.otp ? "border-red-500 focus-visible:ring-red-400" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold gap-2 shadow-lg shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    "Verifying 2FA Code…"
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={handleResend2FA}
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 h-8 gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend Code
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => {
                      setStep("login");
                      setErrors({});
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 h-8"
                  >
                    ← Back to Login
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <>
              {errors.general && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="sadia@licensehub.io"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                      }}
                      className={`pl-9 h-10 bg-muted/30 text-sm ${
                        errors.email ? "border-red-500 focus-visible:ring-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                      }}
                      className={`pl-9 h-10 bg-muted/30 text-sm ${
                        errors.password ? "border-red-500 focus-visible:ring-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold gap-2 shadow-lg shadow-primary/20 mt-2"
                >
                  {loading ? (
                    "Authenticating…"
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            Protected by LicenseHub Security Gateway • 256-bit SSL
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginScreen;
