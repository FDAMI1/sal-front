import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@shared/cn";

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** White panel on the canvas: the base container for every dashboard block. */
export function Card({
  title,
  description,
  actions,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-surface shadow-xs",
        className,
      )}
      {...rest}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-ink-subtle">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
