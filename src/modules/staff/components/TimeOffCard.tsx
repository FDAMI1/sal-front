import { fieldIssues } from "@api/apiClient";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarOff } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  useAddTimeOff,
  useRemoveTimeOff,
  useTimeOff,
} from "@modules/staff/hooks/useStaff";
import {
  timeOffFormSchema,
  type TimeOffForm,
} from "@modules/staff/staff.validation";
import type { TimeOff } from "@modules/staff/types";
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

const FIELDS = ["from", "to", "reason"] as const;

const range = (t: TimeOff) =>
  t.from === t.to
    ? formatDate(t.from)
    : `${formatDate(t.from)} – ${formatDate(t.to)}`;

/** Upcoming leave. Past entries drop off the list on their own. */
export function TimeOffCard({ workerId }: { workerId: string }) {
  const timeOff = useTimeOff(workerId);
  const add = useAddTimeOff();
  const remove = useRemoveTimeOff();
  const [removing, setRemoving] = useState<TimeOff | null>(null);
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());

  const { control, handleSubmit, reset, setError } = useForm<TimeOffForm>({
    resolver: zodResolver(timeOffFormSchema),
    defaultValues: { from: "", to: "", reason: "" },
  });
  const from = useWatch({ control, name: "from" });

  const submit = (v: TimeOffForm) =>
    add.mutate(
      { id: workerId, input: v },
      {
        onSuccess: () => reset(),
        onError: (err) =>
          fieldIssues(err, FIELDS).forEach((i) =>
            setError(i.field, { message: i.message }),
          ),
      },
    );
  const shownOnFields = fieldIssues(add.error, FIELDS).length > 0;

  let list;
  if (timeOff.isPending) list = <Skeleton className="h-16 w-full" />;
  else if (timeOff.isError)
    list = (
      <ErrorState
        title="Could not load time off"
        message={apiErrorMessage(timeOff.error)}
        onRetry={() => void timeOff.refetch()}
        retrying={timeOff.isFetching}
      />
    );
  else if (timeOff.data.length === 0)
    list = (
      <EmptyState
        icon={CalendarOff}
        title="No upcoming time off"
        message="Add leave so customers are not assigned on those days."
      />
    );
  else
    list = (
      <ul className="divide-y divide-line">
        {timeOff.data.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{range(t)}</p>
              {t.reason && (
                <p className="text-xs text-ink-subtle">{t.reason}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRemoving(t)}
              aria-label={`Remove time off ${range(t)}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <Card title="Time off" description="Days this person is not working.">
      <form
        noValidate
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="mb-4 grid gap-3 sm:grid-cols-[10rem_10rem_1fr_auto] sm:items-end"
      >
        <ControlledInput
          control={control}
          name="from"
          label="From"
          type="date"
          min={today}
        />
        <ControlledInput
          control={control}
          name="to"
          label="To"
          type="date"
          min={from || today}
        />
        <ControlledInput
          control={control}
          name="reason"
          label="Reason (optional)"
          placeholder="e.g. Family wedding"
        />
        <Button type="submit" loading={add.isPending}>
          Add time off
        </Button>
      </form>
      {add.isError && !shownOnFields && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(add.error)}</Alert>
        </div>
      )}
      {remove.isError && (
        <div className="mb-3">
          <Alert tone="danger">{apiErrorMessage(remove.error)}</Alert>
        </div>
      )}
      {list}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this time off?"
        confirmLabel="Remove"
        busy={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          remove.mutate(
            { id: workerId, timeOffId: removing.id },
            { onSettled: () => setRemoving(null) },
          )
        }
      >
        They will be available on {removing ? range(removing) : ""} as usual.
      </ConfirmDialog>
    </Card>
  );
}
