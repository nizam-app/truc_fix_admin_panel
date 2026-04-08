import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck, Truck } from "lucide-react";
import { isAuthenticated, loginAdmin } from "../lib/auth";

const defaultCredentials = {
  email: "admin@truckfix.com",
  password: "Admin1234!",
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState(defaultCredentials);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "Admin Login";
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await loginAdmin(credentials);
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.2),_transparent_30%),linear-gradient(160deg,_#020617,_#111827_55%,_#0f172a)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/20 p-3 ring-1 ring-inset ring-blue-300/30">
                <Truck className="text-blue-300" size={28} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">Truckfix</p>
                <h1 className="text-2xl font-semibold">Admin Control Center</h1>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-100">
                <ShieldCheck size={16} />
                Protected operations for dispatch, finance, support, and fleet teams
              </div>
              <h2 className="text-5xl font-semibold leading-tight">
                Secure access to the full Truckfix admin workspace.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                Sign in to monitor service activity, manage users, review financial performance, and respond to operational alerts in one place.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">24/7</p>
                <p className="mt-1 text-slate-300">Service visibility</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">Live</p>
                <p className="mt-1 text-slate-300">Operational dashboard</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">Role-based</p>
                <p className="mt-1 text-slate-300">Admin access control</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/20 p-3 ring-1 ring-inset ring-blue-300/30">
                  <Truck className="text-blue-300" size={28} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">Truckfix</p>
                  <h1 className="text-2xl font-semibold">Admin Login</h1>
                </div>
              </div>
              <p className="text-slate-300">Sign in to access the admin dashboard.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">Welcome back</p>
                <h2 className="mt-3 text-3xl font-semibold">Sign in to continue</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This form is wired to <span className="font-medium text-white">/auth/login</span> and stores the returned access token for protected admin routes.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="admin@truckfix.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={credentials.password}
                      onChange={(event) =>
                        setCredentials((current) => ({ ...current, password: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition-colors hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/60"
                >
                  {isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />}
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Default admin credentials</p>
                <p className="mt-2">Email: {defaultCredentials.email}</p>
                <p>Password: {defaultCredentials.password}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
