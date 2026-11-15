import { useState } from "react";
import { apiErrorMessage } from "@api/apiClient";
import { PayDialog } from "@modules/billing/components/MoneyDialogs";
import { QueueCard } from "@modules/queue/components/QueueCard";
import {
  useQueueAction,
  useQueueBoard,
  type QueueAction,
  type QueueItem,
} from "@modules/queue/queueApi";
import { formatDate } from "@shared/format";
import {
  Alert,
  ConfirmDialog,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@shared/ui";

const COLUMNS = [
  ["waiting", "Waiting"],
  ["called", "Called"],
  ["inService", "In service"],
  ["done", "Done today"],
] as const;

/**
 * The live queue for /app/queue (salon admin: everything) and /worker
 * (a stylist: who they may take, and their own visits). Refreshes every 5 s.
 */
export default function QueueScreen() {
  const board = useQueueBoard();
  const act = useQueueAction();
  const [confirming, setConfirming] = useState<{
    item: QueueItem;
    action: "no-show" | "cancel";
  } | null>(null);
  const [paying, setPaying] = useState<QueueItem | null>(null);

  const run = (
    item: QueueItem,
    action: QueueAction,
    workerId?: string | null,
  ) => act.mutate({ id: item.id, action, workerId });

  if (board.isPending) {
    return (
      <div
        className="grid gap-4 lg:grid-cols-4"
        aria-busy="true"
        aria-label="Loading queue"
      >
        {COLUMNS.map(([key]) => (
          <Skeleton key={key} className="h-64 w-full" />
        ))}
      </div>
    );
  }
  if (board.isError) {
    return (
      <ErrorState
        title="Could not load the queue"
        message={apiErrorMessage(board.error)}
        onRetry={() => void board.refetch()}
        retrying={board.isFetching}
      />
    );
  }

  const data = board.data;
  const isAdmin = data.me === null;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <PageHeader
        title="Queue"
        description={`${formatDate(data.date)} · updates every few seconds${
          isAdmin ? "" : " · customers you can take, and your own visits"
        }`}
      />
      {act.isError && <Alert tone="danger">{apiErrorMessage(act.error)}</Alert>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(([key, title]) => {
          const items = data[key];
          return (
            <section
              key={key}
              aria-labelledby={`col-${key}`}
              className="space-y-3 rounded-xl bg-canvas p-3"
            >
              <h2
                id={`col-${key}`}
                className="flex items-center justify-between font-semibold text-ink"
              >
                {title}
                <span className="rounded-full bg-surface px-2 text-sm text-ink-muted">
                  {items.length}
                </span>
              </h2>
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-subtle">
                  {key === "waiting" ? "No one waiting." : "Nobody here."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <QueueCard
                      key={`${item.id}-${item.status}`}
                      item={item}
                      board={data}
                      isAdmin={isAdmin}
                      busy={act.isPending && act.variables.id === item.id}
                      onAction={(action, workerId) =>
                        run(item, action, workerId)
                      }
                      onConfirm={(action) => setConfirming({ item, action })}
                      onPay={() => setPaying(item)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <PayDialog target={paying} onClose={() => setPaying(null)} />
      <ConfirmDialog
        open={confirming !== null}
        title={
          confirming?.action === "cancel"
            ? `Cancel ${confirming.item.token}?`
            : `Mark ${confirming?.item.token ?? ""} as a no-show?`
        }
        confirmLabel={
          confirming?.action === "cancel" ? "Cancel booking" : "Mark no-show"
        }
        tone="danger"
        busy={act.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (!confirming) return;
          act.mutate(
            { id: confirming.item.id, action: confirming.action },
            { onSettled: () => setConfirming(null) },
          );
        }}
      >
        {confirming?.action === "cancel"
          ? `${confirming.item.customerName}'s booking will be cancelled. Their tracking page will show it.`
          : `${confirming?.item.customerName ?? ""} did not come when called. This frees the staff member for the next customer.`}
      </ConfirmDialog>
    </div>
  );
}
