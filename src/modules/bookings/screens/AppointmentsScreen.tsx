import { useState } from "react";
import { CalendarClock, MessageCircle, Phone } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  addDays,
  BOOKING_STATUS,
  useBookings,
  useMarkReminded,
  type BookingRow,
} from "@modules/bookings/bookingsApi";
import { useQueueAction } from "@modules/queue/queueApi";
import { useSalon } from "@modules/salon/hooks/useSalon";
import { cn } from "@shared/cn";
import { formatDate, formatDateTime, formatPaise } from "@shared/format";
import { groupBy } from "@shared/groupBy";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

const VIEWS = [
  { value: "upcoming", label: "Next 30 days" },
  { value: "past", label: "Last 30 days" },
] as const;
type View = (typeof VIEWS)[number]["value"];

/** The salon's "today", so the list starts on the right day in any zone. */
function useSalonToday() {
  const salon = useSalon();
  const today = salon.data
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: salon.data.timezone,
      }).format(new Date())
    : null;
  return { today, salonName: salon.data?.name ?? "" };
}

/** The reminder text, ready to send from the salon's own WhatsApp. */
function reminderLink(b: BookingRow, salonName: string) {
  const text = `Hello ${b.customerName}, this is a reminder of your appointment at ${salonName} on ${formatDate(b.businessDate)} at ${b.scheduledTime ?? ""} (${b.services.join(", ")}). Your token is ${b.token}. Track or cancel here: ${window.location.origin}/t/${b.trackingCode}`;
  return `https://wa.me/${b.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function AppointmentList({ remindersOnly }: { remindersOnly: boolean }) {
  const { today, salonName } = useSalonToday();
  const [view, setView] = useState<View>("upcoming");
  const span =
    !today || remindersOnly
      ? { date: today ?? undefined, to: today ? addDays(today, 7) : undefined }
      : view === "upcoming"
        ? { date: today, to: addDays(today, 30) }
        : { date: addDays(today, -30), to: addDays(today, -1) };
  const list = useBookings({ ...span, mode: "scheduled" });
  const cancel = useQueueAction();
  const remind = useMarkReminded();
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);

  const items = (list.data?.items ?? []).filter(
    (b) => !remindersOnly || b.status === "booked",
  );
  const days = [...groupBy(items, (b) => b.businessDate)];
  if (!remindersOnly && view === "past") days.reverse();

  let body;
  if (list.isPending || !today) body = <Skeleton className="h-48 w-full" />;
  else if (list.isError)
    body = (
      <ErrorState
        title="Could not load appointments"
        message={apiErrorMessage(list.error)}
        onRetry={() => void list.refetch()}
        retrying={list.isFetching}
      />
    );
  else if (items.length === 0)
    body = (
      <EmptyState
        icon={CalendarClock}
        title={
          remindersOnly
            ? "No appointments to remind in the next 7 days"
            : view === "upcoming"
              ? "No appointments in the next 30 days"
              : "No appointments in the last 30 days"
        }
        message="Customers choose a date and time on your QR booking page."
      />
    );
  else
    body = (
      <div className="space-y-6">
        {days.map(([date, rows]) => (
          <section key={date} aria-labelledby={`day-${date}`}>
            <h2
              id={`day-${date}`}
              className="mb-2 text-sm font-semibold text-ink-muted"
            >
              {date === today ? "Today · " : ""}
              {formatDate(date)} · {rows.length} appointment
              {rows.length === 1 ? "" : "s"}
            </h2>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {rows.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3 sm:w-36">
                    <span className="text-base font-semibold text-ink tabular-nums">
                      {b.scheduledTime}
                    </span>
                    <span className="rounded-lg bg-brand-50 px-2 py-0.5 font-mono text-sm font-semibold text-brand-700">
                      {b.token}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{b.customerName}</p>
                    <p className="text-sm text-ink-subtle">
                      {b.services.join(", ")} · {formatPaise(b.totalPaise)}
                      {(b.assignedWorkerName ?? b.preferredWorkerName)
                        ? ` · ${b.assignedWorkerName ?? `asked for ${b.preferredWorkerName ?? ""}`}`
                        : ""}
                    </p>
                    {b.reminderSentAt && (
                      <p className="text-xs text-success-700">
                        Reminded {formatDateTime(b.reminderSentAt)}
                      </p>
                    )}
                  </div>
                  <a
                    href={`tel:${b.customerPhone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {b.customerPhone}
                  </a>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusChip tone={BOOKING_STATUS[b.status].tone}>
                      {BOOKING_STATUS[b.status].text}
                    </StatusChip>
                    {b.status === "booked" && (
                      <>
                        <a
                          href={reminderLink(b, salonName)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => remind.mutate(b.id)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium",
                            remindersOnly
                              ? "bg-brand-600 text-white hover:bg-brand-800"
                              : "border border-line bg-surface text-ink hover:bg-canvas",
                          )}
                        >
                          <MessageCircle
                            className="size-4"
                            aria-hidden="true"
                          />
                          {b.reminderSentAt ? "Remind again" : "Send reminder"}
                        </a>
                        {!remindersOnly && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCancelling(b)}
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title={remindersOnly ? "Customer reminders" : "Appointments"}
        description={
          remindersOnly
            ? "Appointments in the next 7 days. Send reminder opens WhatsApp with the message written; press send there."
            : "Bookings for a chosen date and time. They join the Queue on their day."
        }
      />
      {(cancel.isError || remind.isError) && (
        <Alert tone="danger">
          {apiErrorMessage(cancel.error ?? remind.error)}
        </Alert>
      )}
      <Card
        actions={
          !remindersOnly && (
            <div role="radiogroup" aria-label="Period" className="flex gap-2">
              {VIEWS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  role="radio"
                  aria-checked={view === v.value}
                  onClick={() => setView(v.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium",
                    view === v.value
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-surface text-ink-muted hover:text-ink",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )
        }
        title={
          remindersOnly
            ? "Waiting for their appointment"
            : view === "upcoming"
              ? "Upcoming"
              : "Earlier"
        }
      >
        {body}
      </Card>
      <ConfirmDialog
        open={cancelling !== null}
        title={`Cancel ${cancelling?.token ?? ""}?`}
        confirmLabel="Cancel appointment"
        busy={cancel.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={() => {
          if (!cancelling) return;
          cancel.mutate(
            { id: cancelling.id, action: "cancel" },
            { onSettled: () => setCancelling(null) },
          );
        }}
      >
        {cancelling &&
          `${cancelling.customerName}'s appointment on ${formatDate(cancelling.businessDate)} at ${cancelling.scheduledTime ?? ""} will be cancelled. Their tracking page will show it.`}
      </ConfirmDialog>
    </div>
  );
}

/** /app/appointments */
export default function AppointmentsScreen() {
  return <AppointmentList remindersOnly={false} />;
}

/** /app/reminders */
export function RemindersScreen() {
  return <AppointmentList remindersOnly />;
}
