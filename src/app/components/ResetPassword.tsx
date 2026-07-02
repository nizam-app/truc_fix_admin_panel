import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getApiBaseUrl, isAdminAuthenticated } from "../auth";
import { AuthPageShell } from "./AuthPageShell";

export function ResetPassword() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (isAdminAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (!token.trim()) {
      setErrorMessage("Reset token is missing. Use the link from your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message?.trim() || "Unable to reset password.");
      }

      setSuccessMessage(payload?.message || "Password reset successful.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="Set a new password"
      subtitle="Choose a new password using the link from your email. The link expires in 10 minutes."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!tokenFromUrl ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/75">Reset token</span>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/28"
                required
              />
            </div>
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">New password</span>
          <PasswordField
            value={newPassword}
            onChange={setNewPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">Confirm password</span>
          <PasswordField
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <p>{successMessage}</p>
            <Link to="/login" className="mt-2 inline-block font-medium text-yellow-300 underline">
              Sign in
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || Boolean(successMessage)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 px-5 py-4 font-semibold text-black shadow-[0_18px_40px_rgba(250,204,21,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
          {isSubmitting ? "Saving..." : "Update password"}
        </button>
      </form>

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

function PasswordField({
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition focus-within:border-yellow-400/50">
      <Lock size={18} className="text-white/40 group-focus-within:text-yellow-300" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-white outline-none placeholder:text-white/28"
        autoComplete={autoComplete}
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="text-white/40 transition hover:text-white"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
