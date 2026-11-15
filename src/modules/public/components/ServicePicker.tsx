import { useMemo } from "react";
import { Check } from "lucide-react";
import { GENDERS, minutesLabel, servesGender } from "@modules/public/booking";
import type { CustomerGender, PublicSalon } from "@modules/public/types";
import { cn } from "@shared/cn";
import { formatPaise } from "@shared/format";
import { groupBy } from "@shared/groupBy";

type Service = PublicSalon["services"][number];

interface ServicePickerProps {
  services: Service[];
  gender: CustomerGender;
  onGender: (g: CustomerGender) => void;
  selected: string[];
  onToggle: (id: string) => void;
  error?: string;
}

/** Step 1 and 2: who the visit is for, then any number of services. */
export function ServicePicker({
  services,
  gender,
  onGender,
  selected,
  onToggle,
  error,
}: ServicePickerProps) {
  const groups = useMemo(
    () =>
      groupBy(
        services.filter((s) => servesGender(s, gender)),
        (s) => s.category,
      ),
    [services, gender],
  );
  const picked = new Set(selected);

  return (
    <section aria-labelledby="services-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="services-title" className="text-lg font-semibold text-ink">
          1. Choose your services
        </h2>
        <div
          role="radiogroup"
          aria-label="Services for"
          className="flex rounded-full bg-canvas p-1"
        >
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              role="radio"
              aria-checked={gender === g.value}
              onClick={() => onGender(g.value)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium",
                gender === g.value
                  ? "bg-brand-600 text-white"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          data-booking-error
          className="text-sm font-medium text-danger-700"
        >
          {error}
        </p>
      )}
      {groups.size === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-ink-subtle">
          No services listed for this selection yet.
        </p>
      ) : (
        [...groups].map(([category, items]) => (
          <fieldset
            key={category}
            className="rounded-xl border border-line bg-surface"
          >
            <legend className="sr-only">{category}</legend>
            <p
              aria-hidden="true"
              className="border-b border-line px-4 py-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase"
            >
              {category}
            </p>
            {items.map((s) => {
              const on = picked.has(s.id);
              return (
                <label
                  key={s.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3 last:border-b-0",
                    on ? "bg-brand-50" : "hover:bg-canvas",
                  )}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={on}
                    onChange={() => onToggle(s.id)}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500",
                      on
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-surface",
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{s.name}</span>
                    {s.description && (
                      <span className="block text-sm text-ink-subtle">
                        {s.description}
                      </span>
                    )}
                    <span className="block text-xs text-ink-subtle">
                      {minutesLabel(s.durationMinutes)}
                      {!s.allowWalkIn && " · appointment only"}
                      {!s.allowAppointment && " · walk-in only"}
                    </span>
                  </span>
                  <span className="font-semibold whitespace-nowrap text-ink">
                    {formatPaise(s.pricePaise)}
                  </span>
                </label>
              );
            })}
          </fieldset>
        ))
      )}
    </section>
  );
}
