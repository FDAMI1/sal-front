import { useState } from "react";
import { Plus, X } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { useSetSchedule } from "@modules/staff/hooks/useStaff";
import type { ScheduleDay, TimeSpan, WorkerDetail } from "@modules/staff/types";
import { cn } from "@shared/cn";
import { Alert, Button, Card } from "@shared/ui";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
/** Shown Monday first, the way salons plan their week. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const MAX_BREAKS = 3;

const sorted = (week: ScheduleDay[]) =>
  ORDER.map(
    (d) =>
      week.find((w) => w.day === d) ?? {
        day: d,
        isWorking: false,
        start: "10:00",
        end: "20:00",
        breaks: [],
      },
  );

/** Same rules the server applies, so mistakes show before saving. */
function dayError(d: ScheduleDay): string | null {
  if (!d.isWorking) return null;
  if (d.start >= d.end) return "End must be after start";
  const breaks = [...d.breaks].sort((a, b) => (a.start < b.start ? -1 : 1));
  for (const [i, b] of breaks.entries()) {
    if (b.start >= b.end) return "Each break must end after it starts";
    if (b.start < d.start || b.end > d.end)
      return "Breaks must be inside the shift";
    const next = breaks[i + 1];
    if (next && next.start < b.end) return "Breaks overlap";
  }
  return null;
}

function TimeInput({
  label,
  value,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  invalid: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-lg border bg-surface px-2",
        invalid ? "border-danger-600" : "border-line",
      )}
    />
  );
}

export function WeeklyScheduleCard({ worker }: { worker: WorkerDetail }) {
  const save = useSetSchedule();
  const [week, setWeek] = useState(() => sorted(worker.weeklySchedule));
  const [saved, setSaved] = useState(() =>
    JSON.stringify(sorted(worker.weeklySchedule)),
  );

  const set = (day: number, patch: Partial<ScheduleDay>) =>
    setWeek((all) => all.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  const setBreak = (d: ScheduleDay, i: number, patch: Partial<TimeSpan>) =>
    set(d.day, {
      breaks: d.breaks.map((b, j) => (j === i ? { ...b, ...patch } : b)),
    });

  const errors = new Map(week.map((d) => [d.day, dayError(d)]));
  const invalid = [...errors.values()].some(Boolean);
  const dirty = JSON.stringify(week) !== saved;

  return (
    <Card
      title="Weekly schedule"
      description="Working hours and breaks. Customers are only assigned inside these hours."
    >
      <ul className="divide-y divide-line">
        {week.map((d) => {
          const name = DAY_NAMES[d.day] ?? "";
          const error = errors.get(d.day);
          return (
            <li key={d.day} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 items-center gap-2 font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={d.isWorking}
                    onChange={(e) =>
                      set(d.day, { isWorking: e.target.checked })
                    }
                    className="size-4 accent-brand-600"
                  />
                  {name}
                </label>
                {d.isWorking ? (
                  <div className="flex items-center gap-2">
                    <TimeInput
                      label={`${name} starts at`}
                      value={d.start}
                      invalid={Boolean(error)}
                      onChange={(start) => set(d.day, { start })}
                    />
                    <span className="text-ink-subtle">to</span>
                    <TimeInput
                      label={`${name} ends at`}
                      value={d.end}
                      invalid={Boolean(error)}
                      onChange={(end) => set(d.day, { end })}
                    />
                  </div>
                ) : (
                  <span className="text-ink-subtle">Day off</span>
                )}
              </div>
              {d.isWorking && (
                <div className="space-y-2 sm:pl-35">
                  {d.breaks.map((b, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <span className="w-12 text-xs text-ink-subtle">
                        Break
                      </span>
                      <TimeInput
                        label={`${name} break ${i + 1} starts at`}
                        value={b.start}
                        invalid={Boolean(error)}
                        onChange={(start) => setBreak(d, i, { start })}
                      />
                      <span className="text-ink-subtle">to</span>
                      <TimeInput
                        label={`${name} break ${i + 1} ends at`}
                        value={b.end}
                        invalid={Boolean(error)}
                        onChange={(end) => setBreak(d, i, { end })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${name} break ${i + 1}`}
                        icon={<X className="size-4" aria-hidden="true" />}
                        onClick={() =>
                          set(d.day, {
                            breaks: d.breaks.filter((_, j) => j !== i),
                          })
                        }
                      />
                    </div>
                  ))}
                  {d.breaks.length < MAX_BREAKS && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Plus className="size-4" aria-hidden="true" />}
                      aria-label={`Add a break on ${name}`}
                      onClick={() =>
                        set(d.day, {
                          breaks: [
                            ...d.breaks,
                            { start: "13:00", end: "13:30" },
                          ],
                        })
                      }
                    >
                      Add break
                    </Button>
                  )}
                  {error && (
                    <p className="text-xs text-danger-700">
                      {name}: {error}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 space-y-3">
        {invalid && (
          <Alert tone="danger">Fix the highlighted days before saving.</Alert>
        )}
        {save.isError && (
          <Alert tone="danger">{apiErrorMessage(save.error)}</Alert>
        )}
        {save.isSuccess && !dirty && (
          <Alert tone="success">Schedule saved.</Alert>
        )}
        <Button
          loading={save.isPending}
          disabled={!dirty || invalid}
          onClick={() =>
            save.mutate(
              { id: worker.id, weeklySchedule: week },
              {
                onSuccess: (w) =>
                  setSaved(JSON.stringify(sorted(w.weeklySchedule))),
              },
            )
          }
        >
          Save schedule
        </Button>
      </div>
    </Card>
  );
}
