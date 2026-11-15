import type { ReactNode } from "react";
import { cn } from "@shared/cn";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONES: Record<StatusTone, string> = {
  success: "bg-success-50 text-success-700 ring-success-700/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-700/20",
  danger: "bg-danger-50 text-danger-700 ring-danger-700/20",
  neutral: "bg-canvas text-ink-muted ring-line",
};

const DOTS: Record<StatusTone, string> = {
  success: "bg-success-700",
  warning: "bg-warning-700",
  danger: "bg-danger-700",
  neutral: "bg-ink-subtle",
};

/** Status pill: the text carries the meaning, the colour only reinforces it. */
export function StatusChip({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", DOTS[tone])}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
