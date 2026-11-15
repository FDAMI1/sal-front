import { useState } from "react";
import { methodLabel, PAYMENT_STATUS } from "@modules/billing/billingApi";
import type {
  QueueAction,
  QueueBoard,
  QueueItem,
} from "@modules/queue/queueApi";
import { formatPaise } from "@shared/format";
import { Button, StatusChip } from "@shared/ui";

const DONE_LABEL: Record<
  string,
  { text: string; tone: "success" | "neutral" | "warning" }
> = {
  completed: { text: "Completed", tone: "success" },
  no_show: { text: "No-show", tone: "warning" },
  cancelled: { text: "Cancelled", tone: "neutral" },
};

interface QueueCardProps {
  item: QueueItem;
  board: QueueBoard;
  isAdmin: boolean;
  busy: boolean;
  onAction: (action: QueueAction, workerId?: string | null) => void;
  /** Asks before an action that cannot be undone. */
  onConfirm: (action: "no-show" | "cancel") => void;
  /** Opens the payment dialog for a completed, unpaid visit. */
  onPay: () => void;
}

/** One customer on the board, with the next steps the viewer may take. */
export function QueueCard({
  item,
  board,
  isAdmin,
  busy,
  onAction,
  onConfirm,
  onPay,
}: QueueCardProps) {
  // Staff who do every service on this booking; the asked-for one first.
  const able = board.workers
    .filter((w) => item.serviceIds.every((id) => w.serviceIds.includes(id)))
    .sort((a, b) =>
      a.id === item.preferredWorkerId
        ? -1
        : b.id === item.preferredWorkerId
          ? 1
          : 0,
    );
  const [workerId, setWorkerId] = useState(
    () => able.find((w) => !w.busy)?.id ?? "",
  );
  const done = DONE_LABEL[item.status];

  return (
    <li className="space-y-2 rounded-xl border border-line bg-surface p-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold text-brand-700">
            {item.token}
          </p>
          <p className="font-medium text-ink">{item.customerName}</p>
        </div>
        <span className="text-right text-xs text-ink-subtle">
          {item.mode === "now" ? "Walk-in" : `At ${item.scheduledTime ?? ""}`}
          <br />
          {formatPaise(item.totalPaise)} · {item.totalMinutes} min
        </span>
      </div>
      <p className="text-sm text-ink-muted">{item.services.join(", ")}</p>
      {(item.assignedWorkerName ?? item.preferredWorkerName) && (
        <p className="text-xs text-ink-subtle">
          {item.assignedWorkerName
            ? `With ${item.assignedWorkerName}`
            : `Asked for ${item.preferredWorkerName ?? ""}`}
        </p>
      )}

      {item.status === "booked" && (
        <div className="space-y-2">
          {isAdmin && (
            <label className="block text-sm">
              <span className="sr-only">Staff member for {item.token}</span>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="h-9 w-full rounded-lg border border-line bg-surface px-2"
              >
                <option value="">No one yet</option>
                {able.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.busy}>
                    {w.displayName}
                    {w.busy ? " (busy)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={busy}
              onClick={() =>
                onAction("call", isAdmin ? workerId || null : undefined)
              }
            >
              Call
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onConfirm("cancel")}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
      {item.status === "called" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" loading={busy} onClick={() => onAction("start")}>
            Start service
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onConfirm("no-show")}
          >
            No-show
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction("release")}
            >
              Back to waiting
            </Button>
          )}
        </div>
      )}
      {item.status === "in_service" && (
        <Button size="sm" loading={busy} onClick={() => onAction("complete")}>
          Complete
        </Button>
      )}
      {done && (
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={done.tone}>{done.text}</StatusChip>
          {item.status === "completed" &&
            (item.paymentStatus === "unpaid" ? (
              <Button size="sm" onClick={onPay}>
                Collect payment
              </Button>
            ) : (
              <StatusChip tone={PAYMENT_STATUS[item.paymentStatus].tone}>
                {PAYMENT_STATUS[item.paymentStatus].text}{" "}
                {formatPaise(item.paidPaise - item.refundedPaise)} ·{" "}
                {methodLabel(item.paymentMethod)}
              </StatusChip>
            ))}
        </div>
      )}
    </li>
  );
}
