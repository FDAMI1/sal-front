import { cn } from "@shared/cn";

/** Classes for the control itself, shared by input, select and textarea. */
export const controlClass = (invalid: boolean) =>
  cn(
    "w-full rounded-lg border bg-surface px-3 text-ink placeholder:text-ink-subtle disabled:opacity-60",
    invalid ? "border-danger-600" : "border-line",
  );

/** aria-describedby target for a field: its error, else its hint. */
export const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;
