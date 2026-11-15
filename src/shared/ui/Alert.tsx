import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@shared/cn";

type Tone = "danger" | "success" | "info";

const STYLES: Record<Tone, string> = {
  danger: "border-danger-600/30 bg-danger-50 text-danger-700",
  success: "border-success-700/30 bg-success-50 text-success-700",
  info: "border-brand-200 bg-brand-50 text-brand-700",
};

const ICONS = { danger: AlertTriangle, success: CheckCircle2, info: Info };

/** Inline message under a form or card. Errors are announced immediately. */
export function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-2 rounded-lg border px-3 py-2.5", STYLES[tone])}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
