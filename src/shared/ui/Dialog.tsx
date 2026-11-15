import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal on the native <dialog>: the browser traps focus, closes on Escape
 * and returns focus to the opener. Escape calls onClose so React state and
 * the element never disagree.
 */
export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/60"
    >
      {open && (
        <div className="p-5">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description && (
            <div className="mt-1 text-ink-muted">{description}</div>
          )}
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
