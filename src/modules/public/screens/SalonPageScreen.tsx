import { useParams } from "react-router";
import { Clock, MapPin, Phone, Scissors } from "lucide-react";
import { apiErrorMessage, apiErrorStatus } from "@api/apiClient";
import { usePublicSalon } from "@modules/public/hooks/usePublicSalon";
import { BookingForm } from "@modules/public/components/BookingForm";
import type { PublicSalon } from "@modules/public/types";
import { ErrorState, Skeleton } from "@shared/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Hours({ salon }: { salon: PublicSalon }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
      {salon.businessHours.map((d) => (
        <li key={d.day} className="flex justify-between gap-2">
          <span className="text-ink-subtle">{DAYS[d.day]}</span>
          <span className="text-ink">
            {d.isOpen ? `${d.open}–${d.close}` : "Closed"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * /s/:code — the page the salon's QR code opens. Public: no sign-in, no
 * OTP. Shows the salon and its hours, then the booking form.
 */
export default function SalonPageScreen() {
  const { code = "" } = useParams();
  const salon = usePublicSalon(code);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl space-y-6 px-4 py-8">
      {salon.isPending ? (
        <div aria-busy="true" aria-label="Loading salon" className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : salon.isError ? (
        <ErrorState
          title={
            apiErrorStatus(salon.error) === 404
              ? "This link is not active"
              : "Could not load the salon"
          }
          message={apiErrorMessage(salon.error)}
          onRetry={() => void salon.refetch()}
          retrying={salon.isFetching}
        />
      ) : (
        <>
          <header className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                <Scissors className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-semibold text-ink">
                {salon.data.name}
              </h1>
            </div>
            {salon.data.closedToday && (
              <p className="rounded-lg bg-canvas px-3 py-2 text-sm font-medium text-ink">
                Closed today.
              </p>
            )}
            <div className="space-y-1.5 text-sm text-ink-muted">
              {salon.data.address && (
                <p className="flex gap-2">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {salon.data.address}
                </p>
              )}
              {salon.data.phone && (
                <p className="flex gap-2">
                  <Phone
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href={`tel:${salon.data.phone}`}
                    className="text-brand-700 underline-offset-2 hover:underline"
                  >
                    {salon.data.phone}
                  </a>
                </p>
              )}
            </div>
            <details className="text-sm">
              <summary className="flex cursor-pointer items-center gap-2 text-ink-muted">
                <Clock className="size-4" aria-hidden="true" />
                Opening hours
              </summary>
              <div className="mt-2">
                <Hours salon={salon.data} />
              </div>
            </details>
          </header>
          <BookingForm salon={salon.data} code={code} />
        </>
      )}
    </main>
  );
}
