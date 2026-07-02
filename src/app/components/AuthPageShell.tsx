import { Shield } from "lucide-react";
import type { ReactNode } from "react";

export function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg items-center justify-center px-6 py-12">
        <div className="w-full rounded-[36px] border border-white/10 bg-[#0a0a0a]/92 p-8 shadow-[0_35px_140px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-white/55">
            <Shield size={14} />
            Admin access
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-yellow-300">
            TruckFix Admin
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-white/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
