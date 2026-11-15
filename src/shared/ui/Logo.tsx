import { cn } from "@shared/cn";

/**
 * The SmartQueue mark, drawn inline so it takes the brand colour of the
 * current theme (indigo on desktop, green on phones). public/favicon.svg is
 * the same shape for the browser tab.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path
        d="M9 21h14M9 16h10M9 11h6"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
