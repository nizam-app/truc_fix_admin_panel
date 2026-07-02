import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { getApiBaseUrl, isAdminAuthenticated } from "../auth";
import { AuthPageShell } from "./AuthPageShell";

type ForgotResponse = {
  message?: string;
  data?: { resetToken?: string };
};

export function ForgotPassword() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  if (isAdminAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevResetToken(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as ForgotResponse | null;

      if (!response.ok) {
        throw new Error(payload?.message?.trim() || "Unable to send reset email.");
      }

      setSuccessMessage(
        payload?.message ||
          "If an account exists for this email, password reset instructions have been sent."
      );

      if (payload?.data?.resetToken) {
        setDevResetToken(payload.data.resetToken);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send reset email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to set a new password."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">Email address</span>
          <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition focus-within:border-yellow-400/50">
            <Mail size={18} className="text-white/40 group-focus-within:text-yellow-300" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@truckfix.com"
              className="w-full bg-transparent text-white outline-none placeholder:text-white/28"
              autoComplete="email"
              required
            />
          </div>
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <p>{successMessage}</p>
            <p className="text-white/60">Check your inbox (and spam folder). The link expires in 10 minutes.</p>
            {devResetToken ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                <p className="mb-2 font-medium text-yellow-300">Dev fallback (email also sent if Resend is configured)</p>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(devResetToken)}`}
                  className="font-mono text-yellow-200 underline"
                >
                  Open reset page
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 px-5 py-4 font-semibold text-black shadow-[0_18px_40px_rgba(250,204,21,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/45">
        Know your current password?{" "}
        <Link to="/change-password" className="text-yellow-300 hover:underline">
          Change password
        </Link>
      </p>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-yellow-300"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>
    </AuthPageShell>
  );
}
