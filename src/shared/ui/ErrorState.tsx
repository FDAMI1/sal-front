import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title: string;
  message: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retrying,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 px-4 py-10 text-center"
    >
      <span className="grid size-11 place-items-center rounded-full bg-danger-50 text-danger-600">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-md text-ink-subtle">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          loading={retrying}
          icon={<RotateCw className="size-4" aria-hidden="true" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
