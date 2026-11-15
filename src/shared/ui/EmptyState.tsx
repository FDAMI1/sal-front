import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}

/** What an empty list shows: why it is empty and what to do about it. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {message && <p className="mt-1 max-w-md text-ink-subtle">{message}</p>}
      </div>
      {action}
    </div>
  );
}
