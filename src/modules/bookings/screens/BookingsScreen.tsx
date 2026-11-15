import { useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { PAYMENT_STATUS } from "@modules/billing/billingApi";
import { BOOKING_STATUS, useBookings } from "@modules/bookings/bookingsApi";
import { formatDate, formatPaise } from "@shared/format";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

/** /app/bookings — one day's bookings from the QR page (default: today). */
export default function BookingsScreen() {
  const [date, setDate] = useState("");
  const day = useBookings({ date });
  const shownDate = day.data?.date ?? date;

  let body;
  if (day.isPending) body = <Skeleton className="h-48 w-full" />;
  else if (day.isError)
    body = (
      <ErrorState
        title="Could not load bookings"
        message={apiErrorMessage(day.error)}
        onRetry={() => void day.refetch()}
        retrying={day.isFetching}
      />
    );
  else if (day.data.items.length === 0)
    body = (
      <EmptyState
        icon={CalendarCheck}
        title="No bookings for this day"
        message="Bookings made from your QR code appear here."
      />
    );
  else
    body = (
      <ul className="divide-y divide-line">
        {day.data.items.map((b) => (
          <li
            key={b.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:w-40">
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 font-mono font-semibold text-brand-700">
                {b.token}
              </span>
              <span className="text-sm text-ink-muted">
                {b.mode === "now" ? "Walk-in" : b.scheduledTime}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {b.customerName}{" "}
                <span className="text-sm font-normal text-ink-subtle">
                  ({b.gender === "male" ? "M" : "F"})
                </span>
              </p>
              <p className="text-sm text-ink-subtle">
                {b.services.join(", ")}
                {b.preferredWorkerName
                  ? ` · asked for ${b.preferredWorkerName}`
                  : ""}
              </p>
            </div>
            <a
              href={`tel:${b.customerPhone}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
            >
              <Phone className="size-4" aria-hidden="true" />
              {b.customerPhone}
            </a>
            <div className="flex items-center gap-3 flex-wrap sm:w-64 sm:justify-end">
              <span className="font-semibold text-ink">
                {formatPaise(b.totalPaise)}
              </span>
              <StatusChip tone={BOOKING_STATUS[b.status].tone}>
                {BOOKING_STATUS[b.status].text}
              </StatusChip>
              {b.status === "completed" && (
                <StatusChip tone={PAYMENT_STATUS[b.paymentStatus].tone}>
                  {PAYMENT_STATUS[b.paymentStatus].text}
                </StatusChip>
              )}
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Bookings"
        description="Walk-ins (W) and appointments (A) booked from your QR code."
      />
      <Card
        title={shownDate ? formatDate(shownDate) : "Today"}
        description={
          day.data ? `${day.data.items.length} booking(s)` : undefined
        }
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-subtle">Date</span>
            <input
              type="date"
              value={shownDate}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-lg border border-line bg-surface px-2"
            />
          </label>
        }
      >
        {body}
      </Card>
    </div>
  );
}
