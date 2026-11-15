import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  apiErrorCode,
  apiErrorDetails,
  apiErrorMessage,
  fieldIssues,
} from "@api/apiClient";
import { minutesLabel, servesGender } from "@modules/public/booking";
import { ServicePicker } from "@modules/public/components/ServicePicker";
import { useCreateBooking } from "@modules/public/hooks/usePublicSalon";
import type {
  BookingMode,
  CustomerGender,
  PublicSalon,
} from "@modules/public/types";
import { cn } from "@shared/cn";
import { formatPaise } from "@shared/format";
import { Alert, Button } from "@shared/ui";

const FIELDS = [
  "serviceIds",
  "name",
  "phone",
  "preferredWorkerId",
  "mode",
  "date",
  "time",
] as const;
type Field = (typeof FIELDS)[number];

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none";

/**
 * Brings the first problem into view. The Confirm button sits in a bar at
 * the bottom of the screen, so on a phone an error higher up (or below the
 * fold) would otherwise go unseen.
 */
function revealFirstError() {
  requestAnimationFrame(() => {
    document
      .querySelector("[data-booking-error]")
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  });
}

function FieldError({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p id={id} data-booking-error className="text-sm text-danger-700">
      {text}
    </p>
  ) : null;
}

/** The whole booking: services, details, staff, time, then confirm. */
export function BookingForm({
  salon,
  code,
}: {
  salon: PublicSalon;
  code: string;
}) {
  const navigate = useNavigate();
  const book = useCreateBooking(code);
  const [gender, setGender] = useState<CustomerGender>("male");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [staffId, setStaffId] = useState("");
  const { walkInOpen, walkInMessage, today, maxDaysAhead } = salon.booking;
  const [mode, setMode] = useState<BookingMode>(
    walkInOpen ? "now" : "scheduled",
  );
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const chosen = useMemo(
    () => salon.services.filter((s) => selected.includes(s.id)),
    [salon.services, selected],
  );
  const total = chosen.reduce((n, s) => n + s.pricePaise, 0);
  const minutes = chosen.reduce((n, s) => n + s.durationMinutes, 0);
  const walkInBlocked = chosen.find((s) => !s.allowWalkIn);
  const apptBlocked = chosen.find((s) => !s.allowAppointment);
  // Staff who do every chosen service (with nothing chosen yet: everyone).
  const staff = salon.staff.filter((w) =>
    selected.every((id) => w.serviceIds.includes(id)),
  );

  const changeGender = (g: CustomerGender) => {
    setGender(g);
    setSelected((ids) =>
      ids.filter((id) => {
        const s = salon.services.find((x) => x.id === id);
        return s ? servesGender(s, g) : false;
      }),
    );
  };
  const toggle = (id: string) =>
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (selected.length === 0) e.serviceIds = "Pick at least one service.";
    if (!name.trim()) e.name = "Enter your name.";
    const digits = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits))
      e.phone = "Enter a valid 10-digit mobile number.";
    if (mode === "now" && !walkInOpen)
      e.mode = walkInMessage ?? "Walk-ins are closed now.";
    if (mode === "now" && walkInBlocked)
      e.mode = `${walkInBlocked.name} needs an appointment. Choose a date and time.`;
    if (mode === "scheduled" && apptBlocked)
      e.mode = `${apptBlocked.name} is walk-in only. Choose "As soon as possible".`;
    if (mode === "scheduled" && !date) e.date = "Pick a date.";
    if (mode === "scheduled" && !time) e.time = "Pick a time.";
    setErrors(e);
    const ok = Object.keys(e).length === 0;
    if (!ok) revealFirstError();
    return ok;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    book.mutate(
      {
        gender,
        name: name.trim(),
        phone,
        serviceIds: selected,
        preferredWorkerId:
          staffId && staff.some((w) => w.id === staffId) ? staffId : null,
        mode,
        ...(mode === "scheduled" ? { date, time } : {}),
      },
      {
        onSuccess: (b) => void navigate(`/t/${b.trackingCode}`),
        onError: (err) => {
          const next: Partial<Record<Field, string>> = {};
          for (const i of fieldIssues(err, FIELDS)) next[i.field] = i.message;
          setErrors(next);
          revealFirstError();
        },
      },
    );
  };

  const existing =
    apiErrorCode(book.error) === "ALREADY_BOOKED"
      ? apiErrorDetails(book.error)?.trackingCode
      : undefined;
  const onFields = fieldIssues(book.error, FIELDS).length > 0;

  return (
    <form noValidate onSubmit={submit} className="space-y-8 pb-28">
      <ServicePicker
        services={salon.services}
        gender={gender}
        onGender={changeGender}
        selected={selected}
        onToggle={toggle}
        error={errors.serviceIds}
      />

      <section aria-labelledby="details-title" className="space-y-4">
        <h2 id="details-title" className="text-lg font-semibold text-ink">
          2. Your details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="font-medium text-ink">Name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="name-error"
            />
            <FieldError id="name-error" text={errors.name} />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium text-ink">Mobile number</span>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby="phone-error"
            />
            <FieldError id="phone-error" text={errors.phone} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="font-medium text-ink">
            Preferred staff (optional)
          </span>
          <select
            className={inputClass}
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            aria-describedby="staff-error"
          >
            <option value="">Any available</option>
            {staff.map((w) => (
              <option key={w.id} value={w.id}>
                {w.displayName}
              </option>
            ))}
          </select>
          {selected.length > 0 && staff.length === 0 && (
            <span className="block text-xs text-ink-subtle">
              No single staff member does all of these; anyone available will
              serve you.
            </span>
          )}
          <FieldError id="staff-error" text={errors.preferredWorkerId} />
        </label>
      </section>

      <section aria-labelledby="when-title" className="space-y-4">
        <h2 id="when-title" className="text-lg font-semibold text-ink">
          3. When
        </h2>
        <div
          role="radiogroup"
          aria-label="When"
          className="grid gap-3 sm:grid-cols-2"
        >
          {(
            [
              [
                "now",
                "As soon as possible",
                walkInOpen
                  ? "Join today's queue"
                  : (walkInMessage ?? "Not available now"),
              ],
              [
                "scheduled",
                "Choose date & time",
                `Up to ${maxDaysAhead} days ahead`,
              ],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              disabled={value === "now" && !walkInOpen}
              onClick={() => setMode(value)}
              className={cn(
                "rounded-xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-60",
                mode === value
                  ? "border-brand-600 bg-brand-50"
                  : "border-line bg-surface hover:bg-canvas",
              )}
            >
              <span className="block font-medium text-ink">{label}</span>
              <span className="block text-sm text-ink-subtle">{hint}</span>
            </button>
          ))}
        </div>
        <FieldError id="mode-error" text={errors.mode} />
        {mode === "scheduled" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="font-medium text-ink">Date</span>
              <input
                type="date"
                className={inputClass}
                value={date}
                min={today}
                max={addDays(today, maxDaysAhead)}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={Boolean(errors.date)}
              />
              <FieldError id="date-error" text={errors.date} />
            </label>
            <label className="block space-y-1.5">
              <span className="font-medium text-ink">Time</span>
              <input
                type="time"
                className={inputClass}
                value={time}
                step={900}
                onChange={(e) => setTime(e.target.value)}
                aria-invalid={Boolean(errors.time)}
              />
              <FieldError id="time-error" text={errors.time} />
            </label>
          </div>
        )}
      </section>

      {book.isError && !onFields && (
        <div data-booking-error>
          <Alert tone="danger">
            {apiErrorMessage(book.error)}{" "}
            {typeof existing === "string" && (
              <Link to={`/t/${existing}`} className="font-medium underline">
                View your booking
              </Link>
            )}
          </Alert>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-subtle">
              {chosen.length === 0
                ? "No services selected"
                : `${chosen.length} service${chosen.length === 1 ? "" : "s"} · ${minutesLabel(minutes)}`}
            </p>
            <p className="text-lg font-semibold text-ink">
              Total {formatPaise(total)}
            </p>
          </div>
          <Button type="submit" loading={book.isPending}>
            Confirm booking
          </Button>
        </div>
      </div>
    </form>
  );
}
