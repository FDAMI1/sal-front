import { useState } from "react";
import { useParams } from "react-router";
import { CalendarClock, Copy, Phone, Ticket } from "lucide-react";
import { apiErrorMessage, apiErrorStatus } from "@api/apiClient";
import { minutesLabel } from "@modules/public/booking";
import {
  useCancelBooking,
  useTrackedBooking,
} from "@modules/public/hooks/usePublicSalon";
import type { TrackedBooking } from "@modules/public/types";
import { formatDate, formatPaise } from "@shared/format";
import {
  Alert,
  Button,
  ConfirmDialog,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@shared/ui";

type Status = TrackedBooking["status"];
const STATUS: Record<
  Status,
  { label: string; tone: "success" | "neutral" | "warning" }
> = {
  booked: { label: "Waiting", tone: "success" },
  called: { label: "Your turn", tone: "warning" },
  in_service: { label: "In service", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  no_show: { label: "Missed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** The one line that tells the customer what to do now. */
function nextStep(b: TrackedBooking): string {
  switch (b.status) {
    case "booked":
      if (b.peopleAhead === null) return "We'll see you at your booked time.";
      return b.peopleAhead === 0
        ? "You're next. Please be ready at the salon."
        : `${b.peopleAhead} ${b.peopleAhead === 1 ? "person" : "people"} ahead of you.`;
    case "called":
      return `It's your turn${b.assignedWorkerName ? ` with ${b.assignedWorkerName}` : ""}. Please come to the counter now.`;
    case "in_service":
      return `Your service is in progress${b.assignedWorkerName ? ` with ${b.assignedWorkerName}` : ""}.`;
    case "completed":
      return "Thank you for visiting!";
    case "no_show":
      return "We called your token but missed you. Please speak to the salon.";
    case "cancelled":
      return "This booking is cancelled.";
  }
}

/**
 * /t/:trackingCode — the customer's own booking: token, status, place in
 * the queue, services and total. The private link is the key; there is no
 * sign-in. Refreshes every 15 s while the visit is going on.
 */
export default function TrackingScreen() {
  const { trackingCode = "" } = useParams();
  const booking = useTrackedBooking(trackingCode);
  const cancel = useCancelBooking(trackingCode);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState<boolean | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (booking.isPending) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8" aria-busy="true">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }
  if (booking.isError) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <ErrorState
          title={
            apiErrorStatus(booking.error) === 404
              ? "Booking not found"
              : "Could not load your booking"
          }
          message={apiErrorMessage(booking.error)}
          onRetry={() => void booking.refetch()}
          retrying={booking.isFetching}
        />
      </main>
    );
  }

  const b = booking.data;
  const status = STATUS[b.status];
  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-4 py-8">
      <section className="rounded-2xl border border-line bg-surface p-6 text-center shadow-xs">
        <p className="text-sm text-ink-subtle">{b.salonName}</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-ink-subtle">
          <Ticket className="size-5" aria-hidden="true" />
          <span className="text-sm font-medium">Your token</span>
        </div>
        <p
          className="mt-1 text-5xl font-bold tracking-wide text-brand-700"
          aria-label={`Token ${b.token}`}
        >
          {b.token}
        </p>
        <div className="mt-3">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
        <p
          role="status"
          className="mt-3 text-lg font-semibold text-ink"
          aria-live="polite"
        >
          {nextStep(b)}
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-ink">
          <CalendarClock className="size-4" aria-hidden="true" />
          {b.mode === "now"
            ? `Today, as soon as possible (${formatDate(b.businessDate)})`
            : `${formatDate(b.businessDate)} at ${b.scheduledTime ?? ""}`}
        </p>
        <p className="mt-1 text-sm text-ink-subtle">
          Booked for {b.customerName}
          {b.preferredWorkerName ? ` · with ${b.preferredWorkerName}` : ""}
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-5 py-3 font-semibold text-ink">
          Services
        </h2>
        <ul className="divide-y divide-line">
          {b.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-3 px-5 py-3">
              <span>
                <span className="block text-ink">{i.name}</span>
                <span className="text-xs text-ink-subtle">
                  {minutesLabel(i.durationMinutes)}
                </span>
              </span>
              <span className="font-medium text-ink">
                {formatPaise(i.pricePaise)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-line px-5 py-3 font-semibold text-ink">
          <span>Total · {minutesLabel(b.totalMinutes)}</span>
          <span>{formatPaise(b.totalPaise)}</span>
        </div>
      </section>

      <p className="text-center text-sm text-ink-subtle">
        Keep this page: it is your private link to this booking. Pay at the
        salon after your service.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          icon={<Copy className="size-4" aria-hidden="true" />}
          onClick={() => void copy()}
        >
          Copy my booking link
        </Button>
        {b.salonPhone && (
          <a
            href={`tel:${b.salonPhone}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface font-medium text-ink hover:bg-canvas"
          >
            <Phone className="size-4" aria-hidden="true" />
            Call the salon
          </a>
        )}
      </div>
      {copied !== null && (
        <Alert tone={copied ? "success" : "danger"}>
          {copied
            ? "Link copied."
            : "Could not copy. Bookmark this page instead."}
        </Alert>
      )}
      {b.status === "booked" && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setConfirming(true)}
        >
          Cancel my booking
        </Button>
      )}
      {cancel.isError && (
        <Alert tone="danger">{apiErrorMessage(cancel.error)}</Alert>
      )}
      <ConfirmDialog
        open={confirming}
        title="Cancel this booking?"
        confirmLabel="Cancel booking"
        tone="danger"
        busy={cancel.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          cancel.mutate(undefined, { onSettled: () => setConfirming(false) })
        }
      >
        Token {b.token} will be released. You can book again afterwards.
      </ConfirmDialog>
    </main>
  );
}
