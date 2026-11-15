import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { useSystemStatus } from "@modules/system/hooks/useSystemStatus";
import { apiErrorMessage } from "@api/apiClient";
import { environment } from "@config/env";
import { Button, Card, ErrorState, Skeleton, StatusChip } from "@shared/ui";
import { formatDateTime, formatDuration } from "@shared/format";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="font-medium break-all text-ink sm:text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Super admin only: API and database health, timings and server details.
 * The server refuses this data to anyone else; salon admins never see it.
 */
export default function SystemStatusScreen() {
  const status = useSystemStatus();
  const retry = () => void status.refetch();

  let body: ReactNode;
  if (status.isPending) {
    body = (
      <div
        aria-busy="true"
        aria-label="Checking system status"
        className="space-y-3"
      >
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  } else if (status.isError) {
    body = (
      <ErrorState
        title="Cannot reach the API"
        message={`${apiErrorMessage(status.error)} Expected it at ${environment.apiOrigin}.`}
        onRetry={retry}
        retrying={status.isFetching}
      />
    );
  } else {
    const s = status.data;
    const dbUp = s.db === "connected";
    body = (
      <dl className="divide-y divide-line">
        <Row label="API">
          <StatusChip tone="success">Operational</StatusChip>
        </Row>
        <Row label="Database">
          <StatusChip tone={dbUp ? "success" : "danger"}>{s.db}</StatusChip>
        </Row>
        <Row label="Database ping">
          {s.dbPingMs === null ? "No answer" : `${s.dbPingMs} ms`}
        </Row>
        <Row label="Response time">{s.latencyMs} ms</Row>
        <Row label="Server processing">{s.responseMs} ms</Row>
        <Row label="Server uptime">{formatDuration(s.uptimeSeconds)}</Row>
        <Row label="Server time">{formatDateTime(s.time)}</Row>
        <Row label="Service">{s.service}</Row>
        <Row label="Environment">{s.environment}</Row>
        <Row label="Runtime">
          Node {s.nodeVersion} · {s.platform}
        </Row>
        <Row label="Memory">
          {s.memoryMb.rss} MB in use · heap {s.memoryMb.heapUsed} MB
        </Row>
        <Row label="API address">{environment.apiUrl}</Row>
      </dl>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">System status</h1>
        <p className="mt-1 text-ink-subtle">
          Live health of the API, the database and the server.
        </p>
      </div>
      <Card
        title="Platform health"
        description="Refreshes automatically every 30 seconds."
        actions={
          status.isSuccess ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={retry}
              loading={status.isFetching}
              icon={<RotateCw className="size-4" aria-hidden="true" />}
            >
              Check again
            </Button>
          ) : null
        }
      >
        {body}
      </Card>
    </div>
  );
}
