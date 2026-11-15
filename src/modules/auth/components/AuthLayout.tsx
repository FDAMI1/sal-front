import type { ReactNode } from "react";
import { Logo } from "@shared/ui/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centred card used by every sign-in and reset screen. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 font-semibold text-ink">
          <Logo className="size-8" />
          SmartQueue Salon
        </div>
        <section className="rounded-xl border border-line bg-surface p-6 shadow-xs">
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-ink-subtle">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </section>
        {footer && (
          <div className="mt-4 text-center text-ink-subtle">{footer}</div>
        )}
      </div>
    </main>
  );
}
