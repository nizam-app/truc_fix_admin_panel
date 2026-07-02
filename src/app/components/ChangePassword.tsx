import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { getApiBaseUrl, isAdminAuthenticated } from "../auth";
import { AuthPageShell } from "./AuthPageShell";

export function ChangePassword() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
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

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message?.trim() || "Unable to update password.");
      }

      setSuccessMessage(payload?.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="Change your password"
      subtitle="Enter your email, current password, and a new password."
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

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">Current password</span>
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showPassword}
            placeholder="Your existing password"
            autoComplete="current-password"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">New password</span>
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            show={showPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/75">Confirm password</span>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showPassword}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="text-xs text-white/45 transition hover:text-white/70"
        >
          {showPassword ? "Hide passwords" : "Show passwords"}
        </button>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <p>{successMessage}</p>
            <Link to="/login" className="mt-2 inline-block font-medium text-yellow-300 underline">
              Sign in with your new password
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || Boolean(successMessage)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 px-5 py-4 font-semibold text-black shadow-[0_18px_40px_rgba(250,204,21,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/45">
        Forgot your password?{" "}
        <Link to="/forgot-password" className="text-yellow-300 hover:underline">
          Email me a reset link
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

function PasswordInput({
  value,
  onChange,
  show,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
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
    </div>
  );
}
