import { useState } from "react";
import { apiErrorMessage } from "@api/apiClient";
import { useUpdateSalon } from "@modules/salon/hooks/useSalon";
import type { DayHours, Salon } from "@modules/salon/types";
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

const sorted = (hours: DayHours[]) =>
  ORDER.map(
    (d) =>
      hours.find((h) => h.day === d) ?? {
        day: d,
        isOpen: false,
        open: "10:00",
        close: "20:00",
      },
  );

export function BusinessHoursCard({ salon }: { salon: Salon }) {
  const update = useUpdateSalon();
  const [hours, setHours] = useState(() => sorted(salon.businessHours));
  const [saved, setSaved] = useState(() =>
    JSON.stringify(sorted(salon.businessHours)),
  );

  const set = (day: number, patch: Partial<DayHours>) =>
    setHours((all) => all.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const invalid = hours
    .filter((h) => h.isOpen && h.open >= h.close)
    .map((h) => h.day);
  const dirty = JSON.stringify(hours) !== saved;

  const copyMonday = () => {
    const monday = hours.find((h) => h.day === 1);
    if (monday)
      setHours((all) =>
        all.map((h) => ({
          ...h,
          isOpen: monday.isOpen,
          open: monday.open,
          close: monday.close,
        })),
      );
  };

  const save = () =>
    update.mutate(
      { businessHours: hours },
      { onSuccess: (b) => setSaved(JSON.stringify(sorted(b.businessHours))) },
    );

  return (
    <Card
      title="Business hours"
      description="Customers can join the queue only while the salon is open."
      actions={
        <Button variant="ghost" size="sm" onClick={copyMonday}>
          Copy Monday to all days
        </Button>
      }
    >
      <ul className="divide-y divide-line">
        {hours.map((h) => {
          const bad = invalid.includes(h.day);
          return (
            <li
              key={h.day}
              className="flex flex-wrap items-center gap-3 py-2.5"
            >
              <label className="flex w-36 items-center gap-2 font-medium text-ink">
                <input
                  type="checkbox"
                  checked={h.isOpen}
                  onChange={(e) => set(h.day, { isOpen: e.target.checked })}
                  className="size-4 accent-brand-600"
                />
                {DAY_NAMES[h.day]}
              </label>
              {h.isOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES[h.day]} opens at`}
                    value={h.open}
                    onChange={(e) => set(h.day, { open: e.target.value })}
                    className={cn(
                      "h-9 rounded-lg border bg-surface px-2",
                      bad ? "border-danger-600" : "border-line",
                    )}
                  />
                  <span className="text-ink-subtle">to</span>
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES[h.day]} closes at`}
                    aria-invalid={bad || undefined}
                    value={h.close}
                    onChange={(e) => set(h.day, { close: e.target.value })}
                    className={cn(
                      "h-9 rounded-lg border bg-surface px-2",
                      bad ? "border-danger-600" : "border-line",
                    )}
                  />
                </div>
              ) : (
                <span className="text-ink-subtle">Closed</span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 space-y-3">
        {invalid.length > 0 && (
          <Alert tone="danger">
            Closing time must be after opening time on{" "}
            {invalid.map((d) => DAY_NAMES[d]).join(", ")}.
          </Alert>
        )}
        {update.isError && (
          <Alert tone="danger">{apiErrorMessage(update.error)}</Alert>
        )}
        {update.isSuccess && !dirty && (
          <Alert tone="success">Hours saved.</Alert>
        )}
        <Button
          onClick={save}
          loading={update.isPending}
          disabled={!dirty || invalid.length > 0}
        >
          Save hours
        </Button>
      </div>
    </Card>
  );
}
