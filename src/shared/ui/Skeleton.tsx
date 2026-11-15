import { cn } from "@shared/cn";

/** Loading placeholder. Hidden from screen readers; pair with aria-busy. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-line", className)}
    />
  );
}
