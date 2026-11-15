import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  /** "danger" for destructive actions (the default), "primary" otherwise. */
  tone?: "danger" | "primary";
}

/** Asks before an action that is hard to undo. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onCancel}>
      <div className="text-ink-muted">{children}</div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
