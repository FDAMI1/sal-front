import { useEffect, useState } from "react";
import { Bell, CalendarPlus, CalendarX, Volume2 } from "lucide-react";
import { Link } from "react-router";
import { apiErrorMessage } from "@api/apiClient";
import { useNotifications } from "@modules/bookings/bookingsApi";
import {
  loadAlertSettings,
  loadSeenAt,
  playAlert,
  saveAlertSettings,
  saveSeenAt,
  TONES,
  type AlertSettings,
} from "@modules/notifications/alerts";
import { formatDateTime } from "@shared/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

/** /app/notifications — new bookings and customer cancellations, newest first. */
export default function NotificationsScreen() {
  const events = useNotifications();
  // What was unread when the page opened stays marked for this visit.
  const [seenAt] = useState(loadSeenAt);
  const newest = events.data?.[0]?.at;
  useEffect(() => {
    if (newest && newest > seenAt) saveSeenAt(newest);
  }, [newest, seenAt]);

  let body;
  if (events.isPending) body = <Skeleton className="h-48 w-full" />;
  else if (events.isError)
    body = (
      <ErrorState
        title="Could not load notifications"
        message={apiErrorMessage(events.error)}
        onRetry={() => void events.refetch()}
        retrying={events.isFetching}
      />
    );
  else if (events.data.length === 0)
    body = (
      <EmptyState
        icon={Bell}
        title="Nothing in the last 7 days"
        message="New bookings and customer cancellations appear here as they happen."
      />
    );
  else
    body = (
      <ul className="divide-y divide-line">
        {events.data.map((e) => {
          const Icon = e.type === "booking.created" ? CalendarPlus : CalendarX;
          return (
            <li key={e.id} className="flex items-start gap-3 py-3">
              <span
                className={
                  e.type === "booking.created"
                    ? "grid size-9 shrink-0 place-items-center rounded-lg bg-success-50 text-success-700"
                    : "grid size-9 shrink-0 place-items-center rounded-lg bg-warning-50 text-warning-700"
                }
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{e.title}</p>
                <p className="text-sm text-ink-subtle">{e.detail}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-ink-subtle">
                {formatDateTime(e.at)}
                {e.at > seenAt && <StatusChip tone="success">New</StatusChip>}
              </div>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="New bookings and customer cancellations from the last 7 days. This list refreshes by itself."
        actions={
          <Link
            to="/app/settings/sound"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink hover:bg-canvas"
          >
            <Volume2 className="size-4" aria-hidden="true" />
            Sound settings
          </Link>
        }
      />
      <Card>{body}</Card>
    </div>
  );
}

/** /app/settings/sound — the alert this device plays for a new booking. */
export function SoundSettingsScreen() {
  const [settings, setSettings] = useState<AlertSettings>(loadAlertSettings);
  const change = (patch: Partial<AlertSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAlertSettings(next);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Notification sound settings"
        description="The sound played when a customer books or cancels. Saved on this device only, so the front desk can ring while your phone stays quiet."
      />
      <Card>
        <div className="space-y-6">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-medium text-ink">
                Play a sound for new bookings
              </span>
              <span className="block text-sm text-ink-subtle">
                Keep SmartQueue open in a browser tab to hear it.
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={settings.enabled}
              onChange={(e) => change({ enabled: e.target.checked })}
              className="size-5 accent-brand-600"
            />
          </label>

          <fieldset disabled={!settings.enabled} className="space-y-6">
            <div>
              <p className="mb-2 font-medium text-ink">Sound</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <label
                    key={t.value}
                    className="cursor-pointer rounded-lg border border-line px-4 py-2 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-700 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={t.value}
                      checked={settings.tone === t.value}
                      onChange={() => {
                        change({ tone: t.value });
                        void playAlert({ ...settings, tone: t.value });
                      }}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="block space-y-2">
              <span className="font-medium text-ink">
                Volume: {Math.round(settings.volume * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.volume * 100)}
                onChange={(e) =>
                  change({ volume: Number(e.target.value) / 100 })
                }
                className="block w-full accent-brand-600"
              />
            </label>
            <Button
              variant="secondary"
              onClick={() => void playAlert(settings)}
              icon={<Volume2 className="size-4" aria-hidden="true" />}
            >
              Test sound
            </Button>
          </fieldset>
        </div>
      </Card>
    </div>
  );
}
