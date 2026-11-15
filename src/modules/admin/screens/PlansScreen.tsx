import { useState } from "react";
import { Layers, Plus } from "lucide-react";
import { apiErrorMessage } from "@api/apiClient";
import { PlanDialog } from "@modules/admin/components/PlanDialog";
import { usePlans } from "@modules/admin/hooks/useAdminSalons";
import type { Plan } from "@modules/salon/types";
import { formatPaise } from "@shared/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusChip,
} from "@shared/ui";

export default function PlansScreen() {
  const plans = usePlans();
  // undefined = closed, null = new plan, Plan = editing it.
  const [editing, setEditing] = useState<Plan | null | undefined>(undefined);

  let body;
  if (plans.isPending) body = <Skeleton className="h-32 w-full" />;
  else if (plans.isError)
    body = (
      <ErrorState
        title="Could not load plans"
        message={apiErrorMessage(plans.error)}
        onRetry={() => void plans.refetch()}
        retrying={plans.isFetching}
      />
    );
  else if (plans.data.length === 0)
    body = (
      <EmptyState
        icon={Layers}
        title="No plans yet"
        message="Create the plans you sell to salons."
      />
    );
  else
    body = (
      <ul className="divide-y divide-line">
        {plans.data.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {p.name}{" "}
                <span className="text-xs font-normal text-ink-subtle">
                  {p.code}
                </span>
              </p>
              <p className="text-xs text-ink-subtle">
                {formatPaise(p.pricePaise)} / {p.interval} · {p.limits.workers}{" "}
                staff
                {p.limits.devicesPerUser
                  ? ` · ${p.limits.devicesPerUser} devices each`
                  : ""}
              </p>
            </div>
            {!p.isActive && <StatusChip tone="neutral">Not offered</StatusChip>}
            <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>
              Edit
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title="Plans"
        description="What salons pay for and what it allows. Assign them on a salon's page."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => setEditing(null)}
          >
            New plan
          </Button>
        }
      />
      <Card>{body}</Card>
      {editing !== undefined && (
        <PlanDialog
          key={editing?.id ?? "new"}
          plan={editing}
          open
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
