import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, Shield } from "lucide-react";
import {
  getApiBaseUrl,
  isAdminAuthenticated,
  storeAdminSession,
} from "../auth";

type LoginResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      _id?: string;
      email: string;
      role: string;
      status?: string;
      adminProfile?: {
        fullName?: string;
        phoneNumber?: string;
        profilePhotoUrl?: string;
      };
    };
  };
  message?: string;
};

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  if (isAdminAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      let payload: (LoginResponse & { message?: string }) | null = null;
      try {
        payload = (await response.json()) as LoginResponse & {
          message?: string;
        };
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const serverMessage = payload?.message?.trim();
        throw new Error(
          serverMessage === "Required"
            ? "The admin panel is pointing at the wrong backend or receiving an invalid server response."
            : serverMessage || "Unable to sign in right now."
        );
      }

      const authData = payload?.data;
      if (!authData?.accessToken || !authData?.refreshToken || !authData?.user) {
        throw new Error("Login response is missing required auth data.");
      }

      if (authData.user.role !== "ADMIN") {
        throw new Error("This account is not allowed to access the admin panel.");
      }

      storeAdminSession({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
      });

      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.08),_transparent_28%)]" />
      <div className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full overflow-hidden rounded-[36px] border border-white/10 bg-[#0a0a0a]/92 shadow-[0_35px_140px_rgba(0,0,0,0.58)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.08),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_50%)]" />

            <div className="relative">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm font-medium text-yellow-300 shadow-[0_0_0_1px_rgba(250,204,21,0.08)]">
                <Shield size={16} />
                TruckFix Admin Control
              </div>

              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-white/35">
                Platform Operations Console
              </p>
              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] text-white xl:text-6xl">
                Command the full TruckFix platform from a sharper admin workspace.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/62">
                Review live service demand, oversee fleet companies, moderate disputes,
                approve mechanics, and keep the operating layer of TruckFix moving with
                confidence.
              </p>

              <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
                {[
                  { label: "Admin routes", value: "15+", tone: "text-yellow-300" },
                  { label: "Control scope", value: "End-to-end", tone: "text-blue-300" },
                  { label: "Security", value: "Role-locked", tone: "text-emerald-300" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">
                      {item.label}
                    </p>
                    <p className={`mt-4 text-3xl font-semibold ${item.tone}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-[28px] border border-white/10 bg-black/30 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-medium text-white/75">Live command focus</p>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Secured
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    "Service request triage and escalation",
                    "Fleet, mechanic, and payout oversight",
                    "Audit visibility with role-protected access",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/62">
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.7)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex items-end justify-between gap-6 rounded-[28px] border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">
                  Operations note
                </p>
                <p className="mt-3 max-w-md text-sm leading-7 text-white/58">
                  Admin access is intentionally closed to public signup. Provisioning
                  remains controlled so platform operations stay traceable and secure.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/10 px-4 py-3 text-right xl:block">
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Panel mode</p>
                <p className="mt-2 text-lg font-semibold text-white">Operational control</p>
              </div>
            </div>
          </div>

          <div className="relative p-6 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/35 to-transparent" />

            <div className="mx-auto flex max-w-md flex-col justify-center">
              <div className="mb-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-white/55 lg:hidden">
                  <Shield size={14} />
                  Admin access
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-yellow-300">
                  TruckFix Admin
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  Sign in to the admin panel
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  Use an admin account to access service operations, audit tools,
                  financial controls, and platform settings.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-white/75">
                    Email address
                  </span>
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-white/15 focus-within:border-yellow-400/50 focus-within:bg-white/[0.05]">
                    <Mail size={18} className="text-white/40 transition group-focus-within:text-yellow-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@truckfix.com"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/28"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white/75">Password</span>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-yellow-300/90 transition hover:text-yellow-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                <label className="block">
                  <span className="sr-only">Password</span>
                  <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-white/15 focus-within:border-yellow-400/50 focus-within:bg-white/[0.05]">
                    <Lock size={18} className="text-white/40 transition group-focus-within:text-yellow-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/28"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-white/40 transition hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 px-5 py-4 font-semibold text-black shadow-[0_18px_40px_rgba(250,204,21,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/42">
                {["Role-protected", "Audit-aware", "Secure provisioning"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-sm leading-6 text-white/45">
                Admin accounts are provisioned securely. Public registration is not
                enabled for this panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
