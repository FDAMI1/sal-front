import type { ReactNode } from "react";
import { cn } from "@shared/cn";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Label above, control, then the error (or the hint) tied to it by id. */
export function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
