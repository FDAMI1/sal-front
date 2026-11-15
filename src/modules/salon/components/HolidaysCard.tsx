import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarOff } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  useAddHoliday,
  useHolidays,
  useRemoveHoliday,
} from "@modules/salon/hooks/useSalon";
import {
  holidayFormSchema,
  type HolidayForm,
} from "@modules/salon/salon.validation";
import type { Holiday } from "@modules/salon/types";
import { ControlledInput } from "@shared/form/ControlledInput";
import { formatDate } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@shared/ui";

/** Upcoming closed days. Past days drop off the list on their own. */
export function HolidaysCard({ timezone }: { timezone: string }) {
  const holidays = useHolidays();
  const add = useAddHoliday();
  const remove = useRemoveHoliday();
  const [removing, setRemoving] = useState<Holiday | null>(null);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
    new Date(),
  );

  const { control, handleSubmit, reset } = useForm<HolidayForm>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { date: "", reason: "" },
  });

  let list;
  if (holidays.isPending) list = <Skeleton className="h-16 w-full" />;
  else if (holidays.isError)
    list = (
      <ErrorState
        title="Could not load holidays"
        message={apiErrorMessage(holidays.error)}
        onRetry={() => void holidays.refetch()}
        retrying={holidays.isFetching}
      />
    );
  else if (holidays.data.length === 0)
    list = (
      <EmptyState
        icon={CalendarOff}
        title="No upcoming holidays"
        message="Add days the salon is closed."
      />
    );
  else
    list = (
      <ul className="divide-y divide-line">
        {holidays.data.map((h) => (
          <li key={h.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{formatDate(h.date)}</p>
              {h.reason && (
                <p className="text-xs text-ink-subtle">{h.reason}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRemoving(h)}
              aria-label={`Remove holiday on ${formatDate(h.date)}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <Card
      title="Holidays"
      description="The queue and bookings stay closed on these days."
    >
      <form
        noValidate
        onSubmit={(e) =>
          void handleSubmit((v) => add.mutate(v, { onSuccess: () => reset() }))(
            e,
          )
        }
        className="mb-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
      >
        <ControlledInput
          control={control}
          name="date"
          label="Date"
          type="date"
          min={today}
        />
        <ControlledInput
          control={control}
          name="reason"
          label="Reason (optional)"
          placeholder="e.g. Diwali"
        />
        <Button type="submit" loading={add.isPending}>
          Add holiday
        </Button>
      </form>
      {add.isError && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(add.error)}</Alert>
        </div>
      )}
      {list}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this holiday?"
        confirmLabel="Remove"
        busy={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, { onSettled: () => setRemoving(null) })
        }
      >
        The salon will be open on {removing ? formatDate(removing.date) : ""} as
        usual.
      </ConfirmDialog>
    </Card>
  );
}
