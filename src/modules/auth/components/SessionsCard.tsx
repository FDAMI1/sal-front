import { useState } from "react";
import { LogOut, Monitor } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import {
  useEndSession,
  useSessions,
  useSignOutOtherDevices,
} from "@modules/auth/hooks/useAuth";
import { formatDateTime } from "@shared/format";
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@shared/ui";

/** Where this account is signed in, with a way to end any other session. */
export function SessionsCard() {
  const sessions = useSessions();
  const endOne = useEndSession();
  const endOthers = useSignOutOtherDevices();
  const [confirmAll, setConfirmAll] = useState(false);

  const others = sessions.data?.filter((s) => !s.current) ?? [];

  let body;
  if (sessions.isPending) {
    body = (
      <div aria-busy="true" aria-label="Loading devices" className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  } else if (sessions.isError) {
    body = (
      <ErrorState
        title="Could not load your devices"
        message={apiErrorMessage(sessions.error)}
        onRetry={() => void sessions.refetch()}
        retrying={sessions.isFetching}
      />
    );
  } else {
    body = (
      <ul className="divide-y divide-line">
        {sessions.data.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
            <Monitor
              className="size-5 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {s.deviceName}{" "}
                {s.current && (
                  <StatusChip tone="success">This device</StatusChip>
                )}
              </p>
              <p className="text-xs text-ink-subtle">
                Last active {formatDateTime(s.lastSeenAt)}
                {s.ip ? ` · ${s.ip}` : ""}
              </p>
            </div>
            {!s.current && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => endOne.mutate(s.id)}
                loading={endOne.isPending && endOne.variables === s.id}
                aria-label={`Sign out ${s.deviceName}`}
              >
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card
      title="Signed-in devices"
      description="Sign out anywhere you no longer use."
      actions={
        others.length > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<LogOut className="size-4" aria-hidden="true" />}
            onClick={() => setConfirmAll(true)}
          >
            Sign out other devices
          </Button>
        ) : null
      }
    >
      {body}
      {(endOne.isError || endOthers.isError) && (
        <div className="mt-3">
          <Alert tone="danger">
            {apiErrorMessage(endOne.error ?? endOthers.error)}
          </Alert>
        </div>
      )}
      <ConfirmDialog
        open={confirmAll}
        title="Sign out other devices?"
        confirmLabel="Sign out"
        busy={endOthers.isPending}
        onCancel={() => setConfirmAll(false)}
        onConfirm={() =>
          endOthers.mutate(undefined, { onSettled: () => setConfirmAll(false) })
        }
      >
        {others.length === 1
          ? "1 other device will be signed out."
          : `${others.length} other devices will be signed out.`}{" "}
        This device stays signed in.
      </ConfirmDialog>
    </Card>
  );
}
